/**
 * Webhooks System
 * نظام الإشعارات الفورية عبر Webhooks
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import { webhooks, webhookLogs } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// أنواع الأحداث المدعومة
export const WEBHOOK_EVENTS = {
  // أحداث البريد
  "email.sent": "تم إرسال البريد",
  "email.opened": "تم فتح البريد",
  "email.clicked": "تم النقر على رابط",
  "email.replied": "تم الرد على البريد",
  "email.bounced": "فشل تسليم البريد",
  "email.unsubscribed": "إلغاء الاشتراك",
  
  // أحداث الحملات
  "campaign.started": "بدأت الحملة",
  "campaign.completed": "اكتملت الحملة",
  "campaign.paused": "توقفت الحملة",
  
  // أحداث العملاء المحتملين
  "lead.created": "تم إنشاء عميل محتمل",
  "lead.updated": "تم تحديث عميل محتمل",
  "lead.converted": "تم تحويل العميل",
  
  // أحداث التسلسلات
  "sequence.step_completed": "اكتملت خطوة في التسلسل",
  "sequence.completed": "اكتمل التسلسل",
} as const;

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

/**
 * إنشاء توقيع HMAC للتحقق من صحة الـ Webhook
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * التحقق من توقيع Webhook الوارد
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * إرسال Webhook إلى URL محدد
 */
export async function sendWebhook(
  event: WebhookEvent,
  data: any,
  userId?: number
): Promise<void> {
  try {
    // الحصول على جميع الـ Webhooks المسجلة لهذا الحدث
    let query = db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.isActive, true),
          // يمكن إضافة فلتر للأحداث المحددة
        )
      );

    const activeWebhooks = await query;

    for (const webhook of activeWebhooks) {
      // التحقق من أن الحدث مدعوم
      const events = webhook.events as string[];
      if (!events.includes(event) && !events.includes("*")) {
        continue;
      }

      // إنشاء الـ Payload
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      const payloadString = JSON.stringify(payload);
      const signature = generateSignature(payloadString, webhook.secret);

      // إرسال الـ Webhook
      const startTime = Date.now();
      let success = false;
      let responseStatus = 0;
      let responseBody = "";
      let errorMessage = "";

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
            "X-Webhook-Timestamp": payload.timestamp,
          },
          body: payloadString,
          signal: AbortSignal.timeout(10000), // 10 ثواني timeout
        });

        responseStatus = response.status;
        responseBody = await response.text();
        success = response.ok;

      } catch (error: any) {
        errorMessage = error.message;
        console.error(`[Webhook] Failed to send to ${webhook.url}:`, error.message);
      }

      const duration = Date.now() - startTime;

      // تسجيل محاولة الإرسال
      await db.insert(webhookLogs).values({
        webhookId: webhook.id,
        event,
        payload: payloadString,
        responseStatus,
        responseBody: responseBody.substring(0, 1000), // أول 1000 حرف فقط
        success,
        duration,
        errorMessage,
        createdAt: new Date(),
      });

      // إذا فشل، جدولة إعادة المحاولة
      if (!success && webhook.retryCount < 3) {
        await scheduleRetry(webhook.id, event, data, webhook.retryCount + 1);
      }

      console.log(
        `[Webhook] ${success ? "✓" : "✗"} ${event} -> ${webhook.url} (${duration}ms)`
      );
    }
  } catch (error) {
    console.error("[Webhook] Error sending webhooks:", error);
  }
}

/**
 * جدولة إعادة محاولة إرسال Webhook
 */
async function scheduleRetry(
  webhookId: number,
  event: WebhookEvent,
  data: any,
  retryCount: number
): Promise<void> {
  // تأخير متزايد: 1 دقيقة، 5 دقائق، 15 دقيقة
  const delays = [60000, 300000, 900000];
  const delay = delays[retryCount - 1] || delays[delays.length - 1];

  setTimeout(async () => {
    console.log(`[Webhook] Retrying (attempt ${retryCount})...`);
    
    const webhook = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, webhookId))
      .limit(1);

    if (webhook.length && webhook[0].isActive) {
      await sendWebhook(event, data);
    }
  }, delay);
}

/**
 * إنشاء مفتاح سري جديد للـ Webhook
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

// ============ API Routes ============

/**
 * الحصول على قائمة Webhooks للمستخدم
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, userId));

    res.json({ webhooks: userWebhooks });
  } catch (error) {
    console.error("[Webhook] Error fetching webhooks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * إنشاء Webhook جديد
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, url, events } = req.body;

    if (!name || !url || !events?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // التحقق من صحة URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const secret = generateWebhookSecret();

    const [newWebhook] = await db
      .insert(webhooks)
      .values({
        userId,
        name,
        url,
        events,
        secret,
        isActive: true,
        createdAt: new Date(),
      })
      .returning();

    res.status(201).json({ webhook: newWebhook });
  } catch (error) {
    console.error("[Webhook] Error creating webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * تحديث Webhook
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const webhookId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, url, events, isActive } = req.body;

    const [updated] = await db
      .update(webhooks)
      .set({
        name,
        url,
        events,
        isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    res.json({ webhook: updated });
  } catch (error) {
    console.error("[Webhook] Error updating webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * حذف Webhook
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const webhookId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId)));

    res.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error deleting webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * اختبار Webhook
 */
router.post("/:id/test", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const webhookId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId)))
      .limit(1);

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // إرسال حدث اختبار
    const testPayload: WebhookPayload = {
      event: "email.sent" as WebhookEvent,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: "This is a test webhook from NorskLeads",
      },
    };

    const payloadString = JSON.stringify(testPayload);
    const signature = generateSignature(payloadString, webhook.secret);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": "test",
        "X-Webhook-Timestamp": testPayload.timestamp,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000),
    });

    res.json({
      success: response.ok,
      status: response.status,
      message: response.ok ? "Webhook test successful" : "Webhook test failed",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * الحصول على سجلات Webhook
 */
router.get("/:id/logs", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const webhookId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // التحقق من ملكية الـ Webhook
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId)))
      .limit(1);

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    const logs = await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookId, webhookId))
      .orderBy(webhookLogs.createdAt)
      .limit(100);

    res.json({ logs });
  } catch (error) {
    console.error("[Webhook] Error fetching logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * الحصول على قائمة الأحداث المدعومة
 */
router.get("/events", (req: Request, res: Response) => {
  res.json({ events: WEBHOOK_EVENTS });
});

// ============ Additional Exports ============

/**
 * تسجيل Webhook جديد
 */
export async function registerWebhook(
  userId: number,
  name: string,
  url: string,
  events: WebhookEvent[]
): Promise<any> {
  const secret = generateWebhookSecret();

  const [newWebhook] = await db
    .insert(webhooks)
    .values({
      userId,
      name,
      url,
      events,
      secret,
      isActive: true,
      createdAt: new Date(),
    })
    .returning();

  return newWebhook;
}

/**
 * إلغاء تسجيل Webhook
 */
export async function unregisterWebhook(
  webhookId: number,
  userId: number
): Promise<boolean> {
  const result = await db
    .delete(webhooks)
    .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId)));

  return true;
}

/**
 * اختبار Webhook
 */
export async function testWebhook(webhookId: number): Promise<{
  success: boolean;
  status?: number;
  error?: string;
}> {
  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, webhookId))
    .limit(1);

  if (!webhook) {
    return { success: false, error: "Webhook not found" };
  }

  try {
    const testPayload: WebhookPayload = {
      event: "email.sent" as WebhookEvent,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: "This is a test webhook from NorskLeads",
      },
    };

    const payloadString = JSON.stringify(testPayload);
    const signature = generateSignature(payloadString, webhook.secret);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": "test",
        "X-Webhook-Timestamp": testPayload.timestamp,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000),
    });

    return {
      success: response.ok,
      status: response.status,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * الحصول على سجلات Webhook
 */
export async function getWebhookLogs(
  webhookId: number,
  limit: number = 100
): Promise<any[]> {
  const logs = await db
    .select()
    .from(webhookLogs)
    .where(eq(webhookLogs.webhookId, webhookId))
    .orderBy(webhookLogs.createdAt)
    .limit(limit);

  return logs;
}

/**
 * إعادة محاولة الـ Webhooks الفاشلة
 */
export async function retryFailedWebhooks(): Promise<number> {
  const failedLogs = await db
    .select()
    .from(webhookLogs)
    .where(eq(webhookLogs.success, false))
    .limit(50);

  let retried = 0;

  for (const log of failedLogs) {
    try {
      const payload = JSON.parse(log.payload);
      await sendWebhook(payload.event, payload.data);
      retried++;
    } catch (error) {
      console.error(`[Webhook] Retry failed for log ${log.id}:`, error);
    }
  }

  return retried;
}

export default router;
