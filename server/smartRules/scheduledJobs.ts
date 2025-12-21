/**
 * Scheduled Jobs System
 * نظام المهام المجدولة للمتابعة التلقائية
 */

import { db } from "../db";
import { 
  scheduledJobs, 
  emails, 
  sequences, 
  sequenceSteps,
  sequenceEnrollments,
  leads,
  campaigns 
} from "../../drizzle/schema";
import { eq, and, lte, isNull, sql } from "drizzle-orm";
import { sendWebhook } from "./webhooks";

// أنواع المهام المجدولة
export const JOB_TYPES = {
  SEND_EMAIL: "send_email",
  FOLLOW_UP: "follow_up",
  SEQUENCE_STEP: "sequence_step",
  REMINDER: "reminder",
  CAMPAIGN_START: "campaign_start",
  CAMPAIGN_END: "campaign_end",
  LEAD_NURTURE: "lead_nurture",
  DATA_CLEANUP: "data_cleanup",
} as const;

export type JobType = typeof JOB_TYPES[keyof typeof JOB_TYPES];

// حالات المهام
export const JOB_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

interface JobData {
  [key: string]: any;
}

/**
 * إنشاء مهمة مجدولة جديدة
 */
export async function createScheduledJob(
  type: JobType,
  scheduledFor: Date,
  data: JobData,
  userId?: number,
  priority: number = 0
): Promise<number> {
  const [job] = await db
    .insert(scheduledJobs)
    .values({
      type,
      status: JOB_STATUS.PENDING,
      scheduledFor,
      data: JSON.stringify(data),
      userId,
      priority,
      createdAt: new Date(),
    })
    .returning();

  console.log(`[Jobs] Created job ${job.id}: ${type} scheduled for ${scheduledFor}`);
  return job.id;
}

/**
 * إلغاء مهمة مجدولة
 */
export async function cancelScheduledJob(jobId: number): Promise<boolean> {
  const [updated] = await db
    .update(scheduledJobs)
    .set({
      status: JOB_STATUS.CANCELLED,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(scheduledJobs.id, jobId),
        eq(scheduledJobs.status, JOB_STATUS.PENDING)
      )
    )
    .returning();

  return !!updated;
}

/**
 * معالجة المهام المستحقة
 */
export async function processScheduledJobs(): Promise<void> {
  const now = new Date();

  // الحصول على المهام المستحقة
  const pendingJobs = await db
    .select()
    .from(scheduledJobs)
    .where(
      and(
        eq(scheduledJobs.status, JOB_STATUS.PENDING),
        lte(scheduledJobs.scheduledFor, now)
      )
    )
    .orderBy(scheduledJobs.priority, scheduledJobs.scheduledFor)
    .limit(50); // معالجة 50 مهمة في كل دورة

  console.log(`[Jobs] Processing ${pendingJobs.length} pending jobs...`);

  for (const job of pendingJobs) {
    await processJob(job);
  }
}

/**
 * معالجة مهمة واحدة
 */
async function processJob(job: any): Promise<void> {
  const startTime = Date.now();

  try {
    // تحديث الحالة إلى "قيد المعالجة"
    await db
      .update(scheduledJobs)
      .set({
        status: JOB_STATUS.PROCESSING,
        startedAt: new Date(),
      })
      .where(eq(scheduledJobs.id, job.id));

    const data = JSON.parse(job.data || "{}");

    // تنفيذ المهمة حسب النوع
    switch (job.type) {
      case JOB_TYPES.SEND_EMAIL:
        await handleSendEmail(data);
        break;

      case JOB_TYPES.FOLLOW_UP:
        await handleFollowUp(data);
        break;

      case JOB_TYPES.SEQUENCE_STEP:
        await handleSequenceStep(data);
        break;

      case JOB_TYPES.REMINDER:
        await handleReminder(data);
        break;

      case JOB_TYPES.CAMPAIGN_START:
        await handleCampaignStart(data);
        break;

      case JOB_TYPES.CAMPAIGN_END:
        await handleCampaignEnd(data);
        break;

      case JOB_TYPES.LEAD_NURTURE:
        await handleLeadNurture(data);
        break;

      case JOB_TYPES.DATA_CLEANUP:
        await handleDataCleanup(data);
        break;

      default:
        console.warn(`[Jobs] Unknown job type: ${job.type}`);
    }

    // تحديث الحالة إلى "مكتمل"
    const duration = Date.now() - startTime;
    await db
      .update(scheduledJobs)
      .set({
        status: JOB_STATUS.COMPLETED,
        completedAt: new Date(),
        duration,
      })
      .where(eq(scheduledJobs.id, job.id));

    console.log(`[Jobs] ✓ Job ${job.id} completed in ${duration}ms`);

  } catch (error: any) {
    // تحديث الحالة إلى "فشل"
    await db
      .update(scheduledJobs)
      .set({
        status: JOB_STATUS.FAILED,
        errorMessage: error.message,
        retryCount: (job.retryCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(scheduledJobs.id, job.id));

    console.error(`[Jobs] ✗ Job ${job.id} failed:`, error.message);

    // إعادة جدولة إذا لم تتجاوز المحاولات
    if ((job.retryCount || 0) < 3) {
      const retryDelay = Math.pow(2, job.retryCount || 0) * 60000; // تأخير متزايد
      await createScheduledJob(
        job.type,
        new Date(Date.now() + retryDelay),
        JSON.parse(job.data),
        job.userId,
        job.priority
      );
    }
  }
}

// ============ معالجات المهام ============

/**
 * إرسال بريد إلكتروني
 */
async function handleSendEmail(data: JobData): Promise<void> {
  const { emailId, templateId, recipientEmail, subject, content, campaignId } = data;

  // استيراد خدمة البريد
  const { sendEmail } = await import("../emailService");

  await sendEmail({
    to: recipientEmail,
    subject,
    html: content,
    campaignId,
  });

  // تحديث حالة البريد
  if (emailId) {
    await db
      .update(emails)
      .set({
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(emails.id, emailId));
  }

  // إرسال Webhook
  await sendWebhook("email.sent", {
    emailId,
    recipientEmail,
    campaignId,
    sentAt: new Date().toISOString(),
  });
}

/**
 * متابعة تلقائية
 */
async function handleFollowUp(data: JobData): Promise<void> {
  const { leadId, campaignId, followUpNumber, templateId } = data;

  // الحصول على معلومات العميل المحتمل
  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!lead || lead.status === "unsubscribed") {
    console.log(`[Jobs] Skipping follow-up for lead ${leadId} (inactive)`);
    return;
  }

  // التحقق من عدم الرد
  const recentEmails = await db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.leadId, leadId),
        eq(emails.campaignId, campaignId)
      )
    )
    .orderBy(emails.sentAt)
    .limit(1);

  if (recentEmails.length && recentEmails[0].repliedAt) {
    console.log(`[Jobs] Skipping follow-up for lead ${leadId} (already replied)`);
    return;
  }

  // إرسال المتابعة
  console.log(`[Jobs] Sending follow-up #${followUpNumber} to lead ${leadId}`);
  
  // جدولة إرسال البريد
  await createScheduledJob(
    JOB_TYPES.SEND_EMAIL,
    new Date(),
    {
      leadId,
      campaignId,
      templateId,
      recipientEmail: lead.email,
      subject: `Follow-up #${followUpNumber}`,
      isFollowUp: true,
    }
  );
}

/**
 * تنفيذ خطوة في التسلسل
 */
async function handleSequenceStep(data: JobData): Promise<void> {
  const { enrollmentId, stepId, sequenceId } = data;

  // الحصول على معلومات التسجيل
  const [enrollment] = await db
    .select()
    .from(sequenceEnrollments)
    .where(eq(sequenceEnrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment || enrollment.status !== "active") {
    console.log(`[Jobs] Skipping sequence step for enrollment ${enrollmentId} (inactive)`);
    return;
  }

  // الحصول على الخطوة
  const [step] = await db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.id, stepId))
    .limit(1);

  if (!step) {
    console.error(`[Jobs] Sequence step ${stepId} not found`);
    return;
  }

  // تنفيذ الخطوة حسب النوع
  switch (step.type) {
    case "email":
      await createScheduledJob(JOB_TYPES.SEND_EMAIL, new Date(), {
        enrollmentId,
        templateId: step.templateId,
        leadId: enrollment.leadId,
      });
      break;

    case "wait":
      // جدولة الخطوة التالية
      const nextStep = await getNextSequenceStep(sequenceId, step.order);
      if (nextStep) {
        const waitTime = step.waitDays || 1;
        await createScheduledJob(
          JOB_TYPES.SEQUENCE_STEP,
          new Date(Date.now() + waitTime * 24 * 60 * 60 * 1000),
          {
            enrollmentId,
            stepId: nextStep.id,
            sequenceId,
          }
        );
      }
      break;

    case "condition":
      // تقييم الشرط وتحديد المسار
      const conditionMet = await evaluateCondition(step.condition, enrollment.leadId);
      const targetStepId = conditionMet ? step.trueStepId : step.falseStepId;
      if (targetStepId) {
        await createScheduledJob(JOB_TYPES.SEQUENCE_STEP, new Date(), {
          enrollmentId,
          stepId: targetStepId,
          sequenceId,
        });
      }
      break;
  }

  // تحديث التسجيل
  await db
    .update(sequenceEnrollments)
    .set({
      currentStepId: stepId,
      lastStepAt: new Date(),
    })
    .where(eq(sequenceEnrollments.id, enrollmentId));

  // إرسال Webhook
  await sendWebhook("sequence.step_completed", {
    enrollmentId,
    stepId,
    sequenceId,
    completedAt: new Date().toISOString(),
  });
}

/**
 * إرسال تذكير
 */
async function handleReminder(data: JobData): Promise<void> {
  const { userId, type, message, entityId, entityType } = data;

  // إرسال إشعار (يمكن توسيعه لإرسال بريد أو push notification)
  console.log(`[Jobs] Sending reminder to user ${userId}: ${message}`);

  await sendWebhook("reminder.sent", {
    userId,
    type,
    message,
    entityId,
    entityType,
    sentAt: new Date().toISOString(),
  });
}

/**
 * بدء حملة
 */
async function handleCampaignStart(data: JobData): Promise<void> {
  const { campaignId } = data;

  await db
    .update(campaigns)
    .set({
      status: "active",
      startedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  await sendWebhook("campaign.started", {
    campaignId,
    startedAt: new Date().toISOString(),
  });

  console.log(`[Jobs] Campaign ${campaignId} started`);
}

/**
 * إنهاء حملة
 */
async function handleCampaignEnd(data: JobData): Promise<void> {
  const { campaignId } = data;

  await db
    .update(campaigns)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  await sendWebhook("campaign.completed", {
    campaignId,
    completedAt: new Date().toISOString(),
  });

  console.log(`[Jobs] Campaign ${campaignId} completed`);
}

/**
 * رعاية العميل المحتمل
 */
async function handleLeadNurture(data: JobData): Promise<void> {
  const { leadId, action, sequenceId } = data;

  switch (action) {
    case "enroll_sequence":
      // تسجيل العميل في تسلسل
      await db.insert(sequenceEnrollments).values({
        leadId,
        sequenceId,
        status: "active",
        enrolledAt: new Date(),
      });
      break;

    case "update_score":
      // تحديث نقاط العميل
      await db
        .update(leads)
        .set({
          score: sql`${leads.score} + 10`,
        })
        .where(eq(leads.id, leadId));
      break;
  }
}

/**
 * تنظيف البيانات
 */
async function handleDataCleanup(data: JobData): Promise<void> {
  const { type, olderThan } = data;

  const cutoffDate = new Date(Date.now() - olderThan);

  switch (type) {
    case "old_logs":
      // حذف السجلات القديمة
      await db
        .delete(scheduledJobs)
        .where(
          and(
            eq(scheduledJobs.status, JOB_STATUS.COMPLETED),
            lte(scheduledJobs.completedAt, cutoffDate)
          )
        );
      break;

    case "expired_tokens":
      // حذف التوكنات المنتهية
      // يمكن إضافة المزيد من أنواع التنظيف
      break;
  }

  console.log(`[Jobs] Data cleanup completed: ${type}`);
}

// ============ وظائف مساعدة ============

/**
 * الحصول على الخطوة التالية في التسلسل
 */
async function getNextSequenceStep(sequenceId: number, currentOrder: number): Promise<any> {
  const [nextStep] = await db
    .select()
    .from(sequenceSteps)
    .where(
      and(
        eq(sequenceSteps.sequenceId, sequenceId),
        sql`${sequenceSteps.order} > ${currentOrder}`
      )
    )
    .orderBy(sequenceSteps.order)
    .limit(1);

  return nextStep;
}

/**
 * تقييم شرط
 */
async function evaluateCondition(condition: any, leadId: number): Promise<boolean> {
  if (!condition) return true;

  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!lead) return false;

  // تقييم الشرط بناءً على النوع
  switch (condition.type) {
    case "email_opened":
      return lead.lastOpenedAt !== null;
    case "email_clicked":
      return lead.lastClickedAt !== null;
    case "score_above":
      return (lead.score || 0) >= condition.value;
    default:
      return true;
  }
}

/**
 * بدء معالج المهام المجدولة
 */
export function startJobProcessor(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`[Jobs] Starting job processor (interval: ${intervalMs}ms)`);

  // معالجة فورية
  processScheduledJobs().catch(console.error);

  // معالجة دورية
  return setInterval(() => {
    processScheduledJobs().catch(console.error);
  }, intervalMs);
}

export default {
  createScheduledJob,
  cancelScheduledJob,
  processScheduledJobs,
  startJobProcessor,
  JOB_TYPES,
  JOB_STATUS,
};
