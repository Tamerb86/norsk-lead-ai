/**
 * Tracking Pixel System
 * تتبع فتح البريد الإلكتروني باستخدام صورة 1x1 شفافة
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import { emailEvents, emails } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// صورة GIF شفافة 1x1 pixel
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * إنشاء معرف تتبع فريد للبريد
 */
export function generateTrackingId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * إنشاء رابط التتبع
 */
export function generateTrackingUrl(trackingId: string, baseUrl: string): string {
  return `${baseUrl}/api/track/open/${trackingId}.gif`;
}

/**
 * إنشاء HTML لـ Tracking Pixel
 */
export function generateTrackingPixelHtml(trackingId: string, baseUrl: string): string {
  const url = generateTrackingUrl(trackingId, baseUrl);
  return `<img src="${url}" width="1" height="1" style="display:none;visibility:hidden;" alt="" />`;
}

/**
 * إضافة Tracking Pixel إلى محتوى البريد
 */
export function injectTrackingPixel(
  htmlContent: string,
  trackingId: string,
  baseUrl: string
): string {
  const pixel = generateTrackingPixelHtml(trackingId, baseUrl);
  
  // إضافة قبل </body> إذا موجود، وإلا في النهاية
  if (htmlContent.includes("</body>")) {
    return htmlContent.replace("</body>", `${pixel}</body>`);
  }
  return htmlContent + pixel;
}

/**
 * تسجيل حدث فتح البريد
 */
async function recordEmailOpen(trackingId: string, req: Request): Promise<void> {
  try {
    // الحصول على معلومات البريد
    const emailRecord = await db
      .select()
      .from(emails)
      .where(eq(emails.trackingId, trackingId))
      .limit(1);

    if (!emailRecord.length) {
      console.log(`[Tracking] Unknown tracking ID: ${trackingId}`);
      return;
    }

    const email = emailRecord[0];

    // استخراج معلومات المستخدم
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "Unknown";
    const referer = req.headers["referer"] || "";

    // تحديد نوع الجهاز
    const deviceType = detectDeviceType(userAgent as string);
    
    // تحديد عميل البريد
    const emailClient = detectEmailClient(userAgent as string);

    // تسجيل الحدث
    await db.insert(emailEvents).values({
      emailId: email.id,
      eventType: "opened",
      occurredAt: new Date(),
      metadata: JSON.stringify({
        userAgent,
        ipAddress,
        referer,
        deviceType,
        emailClient,
      }),
    });

    // تحديث حالة البريد
    await db
      .update(emails)
      .set({
        status: "opened",
        openedAt: new Date(),
        openCount: (email.openCount || 0) + 1,
      })
      .where(eq(emails.id, email.id));

    console.log(`[Tracking] Email opened: ${email.id} (${email.recipientEmail})`);

    // إرسال Webhook إذا مُعد
    await triggerWebhook("email.opened", {
      emailId: email.id,
      campaignId: email.campaignId,
      recipientEmail: email.recipientEmail,
      openedAt: new Date().toISOString(),
      deviceType,
      emailClient,
    });

  } catch (error) {
    console.error("[Tracking] Error recording email open:", error);
  }
}

/**
 * تحديد نوع الجهاز من User Agent
 */
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "mobile";
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  }
  return "desktop";
}

/**
 * تحديد عميل البريد من User Agent
 */
function detectEmailClient(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  const clients: { [key: string]: string } = {
    "googleimageproxy": "Gmail",
    "outlook": "Outlook",
    "thunderbird": "Thunderbird",
    "apple mail": "Apple Mail",
    "yahoo": "Yahoo Mail",
    "windows live": "Windows Live Mail",
    "postbox": "Postbox",
    "mailspring": "Mailspring",
  };

  for (const [pattern, name] of Object.entries(clients)) {
    if (ua.includes(pattern)) {
      return name;
    }
  }

  return "Unknown";
}

/**
 * إرسال Webhook
 */
async function triggerWebhook(event: string, data: any): Promise<void> {
  // سيتم تنفيذها في ملف webhooks.ts
  const { sendWebhook } = await import("./webhooks");
  await sendWebhook(event, data);
}

// ============ Routes ============

/**
 * Route لتتبع فتح البريد
 * GET /api/track/open/:trackingId.gif
 */
router.get("/open/:trackingId.gif", async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  
  // تسجيل الفتح في الخلفية (لا ننتظر)
  recordEmailOpen(trackingId.replace(".gif", ""), req).catch(console.error);

  // إرجاع الصورة الشفافة
  res.set({
    "Content-Type": "image/gif",
    "Content-Length": TRANSPARENT_GIF.length,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  
  res.send(TRANSPARENT_GIF);
});

/**
 * Route لتتبع النقرات على الروابط
 * GET /api/track/click/:trackingId/:linkId
 */
router.get("/click/:trackingId/:linkId", async (req: Request, res: Response) => {
  const { trackingId, linkId } = req.params;
  const { url } = req.query;

  try {
    // الحصول على معلومات البريد
    const emailRecord = await db
      .select()
      .from(emails)
      .where(eq(emails.trackingId, trackingId))
      .limit(1);

    if (emailRecord.length) {
      const email = emailRecord[0];

      // تسجيل حدث النقر
      await db.insert(emailEvents).values({
        emailId: email.id,
        eventType: "clicked",
        occurredAt: new Date(),
        metadata: JSON.stringify({
          linkId,
          url,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        }),
      });

      // تحديث حالة البريد
      await db
        .update(emails)
        .set({
          clickedAt: new Date(),
          clickCount: (email.clickCount || 0) + 1,
        })
        .where(eq(emails.id, email.id));

      // إرسال Webhook
      await triggerWebhook("email.clicked", {
        emailId: email.id,
        campaignId: email.campaignId,
        recipientEmail: email.recipientEmail,
        linkId,
        url,
        clickedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("[Tracking] Error recording click:", error);
  }

  // إعادة التوجيه إلى الرابط الأصلي
  if (url && typeof url === "string") {
    res.redirect(url);
  } else {
    res.status(400).send("Invalid URL");
  }
});

/**
 * تحويل الروابط في البريد إلى روابط قابلة للتتبع
 */
export function convertLinksToTracked(
  htmlContent: string,
  trackingId: string,
  baseUrl: string
): string {
  // Regex للعثور على الروابط
  const linkRegex = /<a\s+([^>]*href=["'])(https?:\/\/[^"']+)(["'][^>]*)>/gi;
  
  let linkIndex = 0;
  
  return htmlContent.replace(linkRegex, (match, prefix, url, suffix) => {
    linkIndex++;
    const trackedUrl = `${baseUrl}/api/track/click/${trackingId}/${linkIndex}?url=${encodeURIComponent(url)}`;
    return `<a ${prefix}${trackedUrl}${suffix}>`;
  });
}

// ============ Additional Exports ============

/**
 * إنشاء Tracking Pixel كـ Buffer
 */
export function generateTrackingPixel(): Buffer {
  return TRANSPARENT_GIF;
}

/**
 * معالجة طلب Tracking Pixel
 */
export async function handleTrackingPixelRequest(
  trackingId: string,
  req: Request
): Promise<Buffer> {
  await recordEmailOpen(trackingId, req);
  return TRANSPARENT_GIF;
}

/**
 * معالجة النقر على الرابط
 */
export async function handleLinkClick(
  trackingId: string,
  linkId: string,
  url: string,
  req: Request
): Promise<void> {
  try {
    const emailRecord = await db
      .select()
      .from(emails)
      .where(eq(emails.trackingId, trackingId))
      .limit(1);

    if (emailRecord.length) {
      const email = emailRecord[0];

      await db.insert(emailEvents).values({
        emailId: email.id,
        eventType: "clicked",
        occurredAt: new Date(),
        metadata: JSON.stringify({
          linkId,
          url,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        }),
      });

      await db
        .update(emails)
        .set({
          clickedAt: new Date(),
          clickCount: (email.clickCount || 0) + 1,
        })
        .where(eq(emails.id, email.id));

      await triggerWebhook("email.clicked", {
        emailId: email.id,
        campaignId: email.campaignId,
        recipientEmail: email.recipientEmail,
        linkId,
        url,
        clickedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("[Tracking] Error recording click:", error);
  }
}

/**
 * الحصول على إحصائيات التتبع للبريد
 */
export async function getEmailTrackingStats(emailId: number): Promise<{
  opens: number;
  clicks: number;
  lastOpened?: Date;
  lastClicked?: Date;
  events: any[];
}> {
  const [email] = await db
    .select()
    .from(emails)
    .where(eq(emails.id, emailId))
    .limit(1);

  if (!email) {
    return { opens: 0, clicks: 0, events: [] };
  }

  const events = await db
    .select()
    .from(emailEvents)
    .where(eq(emailEvents.emailId, emailId));

  return {
    opens: email.openCount || 0,
    clicks: email.clickCount || 0,
    lastOpened: email.openedAt || undefined,
    lastClicked: email.clickedAt || undefined,
    events,
  };
}

/**
 * إنشاء Router للـ Tracking Pixel
 */
export function createTrackingPixelRouter(): Router {
  return router;
}

export default router;
