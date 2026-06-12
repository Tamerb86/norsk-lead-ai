/**
 * Email Service - SendGrid Integration
 * Handles all email sending functionality for campaigns
 */

import sgMail from '@sendgrid/mail';

// Environment variables for SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@norskleads.no';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'NorskLeads';

// Initialize SendGrid only if API key is available
let isInitialized = false;

function initializeSendGrid() {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY not set - email sending disabled');
    return false;
  }
  
  if (!isInitialized) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    isInitialized = true;
    console.log('✅ SendGrid initialized successfully');
  }
  
  return true;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  trackingId?: string;
  campaignId?: number;
  /**
   * Tenant + lead the message belongs to. When both are set, the message gets
   * a signed Reply-To address so the lead's reply routes back to the follow-up
   * agent and is matched to this exact (tenant, lead). See replyAddress.ts.
   */
  userId?: number;
  leadId?: number;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Validate email address first (before checking API key)
    if (!options.to || !isValidEmail(options.to)) {
      return {
        success: false,
        error: `Invalid email address: ${options.to}`
      };
    }

    // Initialize SendGrid if not already done
    if (!initializeSendGrid()) {
      return {
        success: false,
        error: 'SendGrid not configured - SENDGRID_API_KEY missing'
      };
    }

    // Signed Reply-To so the lead's reply routes back to the follow-up agent.
    let replyTo: { email: string } | undefined;
    if (options.userId && options.leadId) {
      const { buildReplyAddress } = await import("./services/replyAddress");
      replyTo = { email: buildReplyAddress(options.userId, options.leadId) };
    }

    // Prepare email message (strip CR/LF from subject to block header injection)
    const msg = {
      to: options.to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME
      },
      ...(replyTo ? { replyTo } : {}),
      subject: options.subject.replace(/[\r\n\0]/g, " ").trim(),
      html: options.html,
      text: options.text || stripHtml(options.html),
      // Add custom args for tracking
      customArgs: {
        trackingId: options.trackingId || '',
        campaignId: options.campaignId?.toString() || ''
      },
      // Enable click tracking and open tracking
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: true
        },
        openTracking: {
          enable: true
        }
      }
    };

    // Send email
    const [response] = await sgMail.send(msg);
    
    // Extract message ID from response headers
    const messageId = response.headers['x-message-id'] as string || '';

    console.log(`✅ Email sent to ${options.to} - Message ID: ${messageId}`);

    return {
      success: true,
      messageId
    };

  } catch (error: any) {
    console.error('❌ SendGrid error:', error);
    
    // Extract error message
    let errorMessage = 'Unknown error';
    if (error.response?.body?.errors) {
      errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send bulk emails (batch processing)
 */
export async function sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  // SendGrid allows up to 1000 emails per API call, but we'll batch in smaller chunks
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(email => sendEmail(email))
    );
    
    results.push(...batchResults);
    
    // Add small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < emails.length) {
      await sleep(1000); // 1 second delay
    }
  }
  
  return results;
}

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test SendGrid connection
 */
export async function testSendGridConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!initializeSendGrid()) {
      return {
        success: false,
        error: 'SendGrid not configured - SENDGRID_API_KEY missing'
      };
    }

    // Try to send a test email to the sender address
    const result = await sendEmail({
      to: SENDGRID_FROM_EMAIL,
      subject: 'NorskLeads - SendGrid Test',
      html: '<p>This is a test email from NorskLeads. SendGrid is working correctly!</p>',
      text: 'This is a test email from NorskLeads. SendGrid is working correctly!'
    });

    return result;

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}
