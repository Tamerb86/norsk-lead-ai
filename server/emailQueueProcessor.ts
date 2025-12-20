/**
 * Email Queue Processor
 * Processes queued emails and handles retries
 */

import { getDb } from './db';
import { emailQueue, emailEvents, leads, sequenceEnrollments, sequenceSteps, norwegianCompanies } from '../drizzle/schema';
import { eq, and, lte, lt, or } from 'drizzle-orm';
import { sendEmail, type EmailOptions } from './emailService';
import { prepareEmailWithTracking } from './emailTracking';

const MAX_RETRIES = 3;
const RETRY_DELAY_HOURS = 1;
const BATCH_SIZE = 50; // Process 50 emails at a time

export interface ProcessQueueResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Process email queue - send pending emails
 */
export async function processEmailQueue(): Promise<ProcessQueueResult> {
  const result: ProcessQueueResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: []
  };

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    console.log('📧 Starting email queue processing...');

    // Get pending emails that are ready to send
    const now = new Date();
    const pendingEmails = await db
      .select()
      .from(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'pending'),
          lte(emailQueue.scheduledAt, now)
        )
      )
      .limit(BATCH_SIZE);

    console.log(`📬 Found ${pendingEmails.length} emails to process`);

    // Process each email
    for (const queueItem of pendingEmails) {
      result.processed++;

      // Get lead info for tracking (outside try block for scope)
      const leadResults = await db
        .select({
          lead: leads,
          company: norwegianCompanies
        })
        .from(leads)
        .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
        .where(eq(leads.id, queueItem.leadId))
        .limit(1);

      const leadData = leadResults[0];
      const lead = leadData?.lead;
      const company = leadData?.company;

      try {

        if (!lead) {
          throw new Error(`Lead not found: ${queueItem.leadId}`);
        }

        // Check if company email exists
        if (!company?.epostadresse) {
          throw new Error(`Company email not found for lead ${queueItem.leadId}`);
        }

        // Check if lead has unsubscribed
        if (lead.unsubscribed) {
          console.log(`⏭️ Skipping unsubscribed lead: ${company.epostadresse}`);
          
          // Mark as failed
          await db
            .update(emailQueue)
            .set({
          status: 'failed',
          errorMessage: 'Lead has unsubscribed',
          lastAttemptAt: new Date()
            })
            .where(eq(emailQueue.id, queueItem.id));
          
          result.failed++;
          continue;
        }

        // Prepare email with tracking (wrap body with tracking pixel, links, unsubscribe)
        const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
        const trackedBody = lead.trackingId 
          ? prepareEmailWithTracking(queueItem.body, lead.trackingId, baseUrl)
          : queueItem.body; // If no tracking ID, send plain body

        // Send email
        const sendResult = await sendEmail({
          to: company.epostadresse,
          subject: queueItem.subject,
          html: trackedBody,
          trackingId: lead.trackingId || undefined,
          campaignId: queueItem.campaignId || undefined
        });

        if (sendResult.success) {
          console.log(`✅ Email sent to ${company.epostadresse}`);

          // Mark as sent
          await db
            .update(emailQueue)
            .set({
              status: 'sent',
              sentAt: new Date(),
              attempts: queueItem.attempts + 1,
              lastAttemptAt: new Date()
            })
            .where(eq(emailQueue.id, queueItem.id));

          // Log sent event (if campaignId exists and lead has trackingId)
          if (queueItem.campaignId && lead.trackingId) {
            await db.insert(emailEvents).values({
              leadId: queueItem.leadId,
              campaignId: queueItem.campaignId,
              trackingId: lead.trackingId,
              eventType: 'open', // Using 'open' as placeholder since 'sent' is not in enum
              createdAt: new Date()
            });
          }

          result.sent++;

          // If this is part of a sequence, check if we need to advance to next step
          if (queueItem.sequenceId && queueItem.sequenceStepId) {
            await advanceSequenceStep(
              queueItem.leadId,
              queueItem.sequenceId,
              queueItem.sequenceStepId
            );
          }

        } else {
          throw new Error(sendResult.error || 'Unknown error');
        }

      } catch (error: any) {
        console.error(`❌ Failed to send email to lead ${queueItem.leadId}:`, error.message);

        const attempts = queueItem.attempts + 1;
        const shouldRetry = attempts < MAX_RETRIES;

        if (shouldRetry) {
          // Schedule retry
          await db
            .update(emailQueue)
            .set({
              attempts,
              lastAttemptAt: new Date(),
              errorMessage: error.message
            })
            .where(eq(emailQueue.id, queueItem.id));

          console.log(`🔄 Scheduled retry ${attempts}/${MAX_RETRIES} for lead ${queueItem.leadId}`);

        } else {
          // Max retries reached, mark as failed
          await db
            .update(emailQueue)
            .set({
              status: 'failed',
              errorMessage: error.message,
              lastAttemptAt: new Date()
            })
            .where(eq(emailQueue.id, queueItem.id));

          console.log(`💀 Max retries reached for lead ${queueItem.leadId}`);
        }

        result.failed++;
        result.errors.push(`Lead ${queueItem.leadId}: ${error.message}`);
      }

      // Small delay between emails to avoid rate limiting
      await sleep(100);
    }

    console.log(`✅ Queue processing complete: ${result.sent} sent, ${result.failed} failed`);

  } catch (error: any) {
    console.error('❌ Queue processing error:', error);
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Advance to next step in email sequence
 */
async function advanceSequenceStep(
  leadId: number,
  sequenceId: number,
  currentStepId: number
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get current enrollment
    const enrollment = await db
      .select()
      .from(sequenceEnrollments)
      .where(
        and(
          eq(sequenceEnrollments.leadId, leadId),
          eq(sequenceEnrollments.sequenceId, sequenceId)
        )
      )
      .limit(1);

    if (!enrollment[0] || enrollment[0].status !== 'active') {
      return;
    }

    // Get next step
    const currentStep = await db
      .select()
      .from(sequenceSteps)
      .where(eq(sequenceSteps.id, currentStepId))
      .limit(1);

    if (!currentStep[0]) {
      return;
    }

    const nextSteps = await db
      .select()
      .from(sequenceSteps)
      .where(
        and(
          eq(sequenceSteps.sequenceId, sequenceId),
          eq(sequenceSteps.stepNumber, currentStep[0].stepNumber + 1)
        )
      )
      .limit(1);

    if (nextSteps.length === 0) {
      // No more steps, complete the sequence
      await db
        .update(sequenceEnrollments)
        .set({
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(sequenceEnrollments.id, enrollment[0].id));

      console.log(`🎉 Sequence ${sequenceId} completed for lead ${leadId}`);
      return;
    }

    const nextStep = nextSteps[0];

    // Calculate when to send next email
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + (nextStep.delayHours || 24));

    // Queue next email
    await db.insert(emailQueue).values({
      leadId,
      campaignId: null,
      sequenceId,
      sequenceStepId: nextStep.id,
      enrollmentId: enrollment[0].id,
      subject: nextStep.subject,
      body: nextStep.body,
      scheduledAt: scheduledFor,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    });

    // Update enrollment
    await db
      .update(sequenceEnrollments)
      .set({
        currentStep: nextStep.stepNumber,
        lastEmailSentAt: scheduledFor
      })
      .where(eq(sequenceEnrollments.id, enrollment[0].id));

    console.log(`➡️ Advanced to step ${nextStep.stepNumber} for lead ${leadId}, scheduled for ${scheduledFor}`);

  } catch (error: any) {
    console.error('Error advancing sequence step:', error);
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [pending, sent, failed] = await Promise.all([
    db.select().from(emailQueue).where(eq(emailQueue.status, 'pending')),
    db.select().from(emailQueue).where(eq(emailQueue.status, 'sent')),
    db.select().from(emailQueue).where(eq(emailQueue.status, 'failed'))
  ]);

  return {
    pending: pending.length,
    sent: sent.length,
    failed: failed.length,
    total: pending.length + sent.length + failed.length
  };
}
