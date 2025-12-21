/**
 * Cron Jobs System
 * نظام المهام الدورية للتذكيرات والأتمتة
 */

import { db } from "../db";
import { 
  leads, 
  campaigns, 
  emails, 
  scheduledJobs,
  users,
  sequences,
  sequenceEnrollments 
} from "../../drizzle/schema";
import { eq, and, lte, gte, sql, isNull, not } from "drizzle-orm";
import { sendWebhook } from "./webhooks";
import { createScheduledJob, JOB_TYPES, processScheduledJobs } from "./scheduledJobs";

// تعريف المهام الدورية
interface CronJob {
  name: string;
  schedule: string;        // تعبير cron
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// قائمة المهام الدورية
const cronJobs: Map<string, CronJob> = new Map();

/**
 * تحليل تعبير cron
 */
function parseCronExpression(expression: string): {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
} {
  const parts = expression.split(" ");
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: ${expression}`);
  }

  const parseField = (field: string, min: number, max: number): number[] => {
    if (field === "*") {
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    }
    if (field.includes("/")) {
      const [, step] = field.split("/");
      return Array.from({ length: max - min + 1 }, (_, i) => min + i).filter(
        (v) => v % parseInt(step) === 0
      );
    }
    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    if (field.includes(",")) {
      return field.split(",").map(Number);
    }
    return [parseInt(field)];
  };

  return {
    minute: parseField(parts[0], 0, 59),
    hour: parseField(parts[1], 0, 23),
    dayOfMonth: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12),
    dayOfWeek: parseField(parts[4], 0, 6),
  };
}

/**
 * حساب وقت التشغيل التالي
 */
function getNextRunTime(expression: string, after: Date = new Date()): Date {
  const cron = parseCronExpression(expression);
  const next = new Date(after);
  next.setSeconds(0);
  next.setMilliseconds(0);
  next.setMinutes(next.getMinutes() + 1);

  for (let i = 0; i < 366 * 24 * 60; i++) {
    if (
      cron.minute.includes(next.getMinutes()) &&
      cron.hour.includes(next.getHours()) &&
      cron.dayOfMonth.includes(next.getDate()) &&
      cron.month.includes(next.getMonth() + 1) &&
      cron.dayOfWeek.includes(next.getDay())
    ) {
      return next;
    }
    next.setMinutes(next.getMinutes() + 1);
  }

  throw new Error(`Could not find next run time for: ${expression}`);
}

/**
 * تسجيل مهمة دورية
 */
export function registerCronJob(
  name: string,
  schedule: string,
  handler: () => Promise<void>,
  enabled: boolean = true
): void {
  const nextRun = getNextRunTime(schedule);
  
  cronJobs.set(name, {
    name,
    schedule,
    handler,
    enabled,
    nextRun,
  });

  console.log(`[Cron] Registered job "${name}" - Next run: ${nextRun.toISOString()}`);
}

/**
 * تشغيل المهام المستحقة
 */
export async function runDueCronJobs(): Promise<void> {
  const now = new Date();

  for (const [name, job] of cronJobs) {
    if (!job.enabled) continue;
    if (!job.nextRun || job.nextRun > now) continue;

    console.log(`[Cron] Running job: ${name}`);
    const startTime = Date.now();

    try {
      await job.handler();
      job.lastRun = now;
      job.nextRun = getNextRunTime(job.schedule, now);
      
      const duration = Date.now() - startTime;
      console.log(`[Cron] ✓ Job "${name}" completed in ${duration}ms`);
      
      await sendWebhook("cron.job_completed", {
        jobName: name,
        duration,
        nextRun: job.nextRun.toISOString(),
      });
    } catch (error: any) {
      console.error(`[Cron] ✗ Job "${name}" failed:`, error.message);
      
      await sendWebhook("cron.job_failed", {
        jobName: name,
        error: error.message,
      });
    }
  }
}

// ============ المهام الدورية المدمجة ============

/**
 * معالجة المهام المجدولة
 */
async function processScheduledJobsHandler(): Promise<void> {
  await processScheduledJobs();
}

/**
 * تنظيف السجلات القديمة
 */
async function cleanupOldRecords(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // حذف المهام المكتملة القديمة
  const deleted = await db
    .delete(scheduledJobs)
    .where(
      and(
        eq(scheduledJobs.status, "completed"),
        lte(scheduledJobs.completedAt, thirtyDaysAgo)
      )
    );

  console.log(`[Cron] Cleaned up old scheduled jobs`);
}

/**
 * إرسال تقرير يومي
 */
async function sendDailyReport(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // إحصائيات اليوم
  const [stats] = await db
    .select({
      emailsSent: sql<number>`COUNT(CASE WHEN ${emails.sentAt} >= ${today} THEN 1 END)`,
      emailsOpened: sql<number>`COUNT(CASE WHEN ${emails.openedAt} >= ${today} THEN 1 END)`,
      emailsReplied: sql<number>`COUNT(CASE WHEN ${emails.repliedAt} >= ${today} THEN 1 END)`,
    })
    .from(emails);

  const [leadStats] = await db
    .select({
      newLeads: sql<number>`COUNT(CASE WHEN ${leads.createdAt} >= ${today} THEN 1 END)`,
      totalLeads: sql<number>`COUNT(*)`,
    })
    .from(leads);

  await sendWebhook("report.daily", {
    date: today.toISOString().split("T")[0],
    emailsSent: stats?.emailsSent || 0,
    emailsOpened: stats?.emailsOpened || 0,
    emailsReplied: stats?.emailsReplied || 0,
    newLeads: leadStats?.newLeads || 0,
    totalLeads: leadStats?.totalLeads || 0,
  });

  console.log(`[Cron] Daily report sent`);
}

/**
 * التحقق من الحملات المجدولة
 */
async function checkScheduledCampaigns(): Promise<void> {
  const now = new Date();

  // الحملات التي يجب أن تبدأ
  const campaignsToStart = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.status, "scheduled"),
        lte(campaigns.scheduledStartAt, now)
      )
    );

  for (const campaign of campaignsToStart) {
    await createScheduledJob(JOB_TYPES.CAMPAIGN_START, new Date(), {
      campaignId: campaign.id,
    });
    console.log(`[Cron] Scheduled campaign ${campaign.id} to start`);
  }

  // الحملات التي يجب أن تنتهي
  const campaignsToEnd = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.status, "active"),
        lte(campaigns.scheduledEndAt, now)
      )
    );

  for (const campaign of campaignsToEnd) {
    await createScheduledJob(JOB_TYPES.CAMPAIGN_END, new Date(), {
      campaignId: campaign.id,
    });
    console.log(`[Cron] Scheduled campaign ${campaign.id} to end`);
  }
}

/**
 * إرسال تذكيرات المتابعة
 */
async function sendFollowUpReminders(): Promise<void> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  // العملاء المحتملون الذين لم يتم التواصل معهم
  const staleLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.status, "contacted"),
        lte(leads.lastContactedAt, threeDaysAgo),
        isNull(leads.repliedAt)
      )
    )
    .limit(100);

  for (const lead of staleLeads) {
    await createScheduledJob(
      JOB_TYPES.REMINDER,
      new Date(),
      {
        type: "follow_up",
        leadId: lead.id,
        message: `Lead ${lead.companyName || lead.email} hasn't responded in 3 days`,
        entityType: "lead",
        entityId: lead.id,
      },
      lead.userId
    );
  }

  console.log(`[Cron] Created ${staleLeads.length} follow-up reminders`);
}

/**
 * تحديث نقاط العملاء المحتملين
 */
async function updateLeadScores(): Promise<void> {
  // زيادة النقاط للعملاء الذين فتحوا البريد
  await db
    .update(leads)
    .set({
      score: sql`${leads.score} + 5`,
    })
    .where(
      and(
        gte(leads.lastOpenedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
        sql`${leads.score} < 100`
      )
    );

  // زيادة النقاط للعملاء الذين ردوا
  await db
    .update(leads)
    .set({
      score: sql`${leads.score} + 20`,
    })
    .where(
      and(
        gte(leads.repliedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
        sql`${leads.score} < 100`
      )
    );

  // تقليل النقاط للعملاء غير النشطين
  await db
    .update(leads)
    .set({
      score: sql`GREATEST(${leads.score} - 1, 0)`,
    })
    .where(
      and(
        lte(leads.lastContactedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        sql`${leads.score} > 0`
      )
    );

  console.log(`[Cron] Lead scores updated`);
}

/**
 * معالجة التسلسلات النشطة
 */
async function processActiveSequences(): Promise<void> {
  const activeEnrollments = await db
    .select()
    .from(sequenceEnrollments)
    .where(eq(sequenceEnrollments.status, "active"))
    .limit(100);

  for (const enrollment of activeEnrollments) {
    // التحقق من الخطوة التالية
    if (enrollment.nextStepAt && enrollment.nextStepAt <= new Date()) {
      await createScheduledJob(
        JOB_TYPES.SEQUENCE_STEP,
        new Date(),
        {
          enrollmentId: enrollment.id,
          stepId: enrollment.currentStepId,
          sequenceId: enrollment.sequenceId,
        }
      );
    }
  }

  console.log(`[Cron] Processed ${activeEnrollments.length} active sequence enrollments`);
}

/**
 * إرسال ملخص أسبوعي
 */
async function sendWeeklyDigest(): Promise<void> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [weekStats] = await db
    .select({
      emailsSent: sql<number>`COUNT(CASE WHEN ${emails.sentAt} >= ${weekAgo} THEN 1 END)`,
      emailsOpened: sql<number>`COUNT(CASE WHEN ${emails.openedAt} >= ${weekAgo} THEN 1 END)`,
      emailsReplied: sql<number>`COUNT(CASE WHEN ${emails.repliedAt} >= ${weekAgo} THEN 1 END)`,
      emailsBounced: sql<number>`COUNT(CASE WHEN ${emails.bouncedAt} >= ${weekAgo} THEN 1 END)`,
    })
    .from(emails);

  const [campaignStats] = await db
    .select({
      activeCampaigns: sql<number>`COUNT(CASE WHEN ${campaigns.status} = 'active' THEN 1 END)`,
      completedCampaigns: sql<number>`COUNT(CASE WHEN ${campaigns.completedAt} >= ${weekAgo} THEN 1 END)`,
    })
    .from(campaigns);

  const openRate = weekStats?.emailsSent 
    ? ((weekStats.emailsOpened / weekStats.emailsSent) * 100).toFixed(1) 
    : "0";
  
  const replyRate = weekStats?.emailsSent 
    ? ((weekStats.emailsReplied / weekStats.emailsSent) * 100).toFixed(1) 
    : "0";

  await sendWebhook("report.weekly", {
    weekEnding: new Date().toISOString().split("T")[0],
    emailsSent: weekStats?.emailsSent || 0,
    emailsOpened: weekStats?.emailsOpened || 0,
    emailsReplied: weekStats?.emailsReplied || 0,
    emailsBounced: weekStats?.emailsBounced || 0,
    openRate: `${openRate}%`,
    replyRate: `${replyRate}%`,
    activeCampaigns: campaignStats?.activeCampaigns || 0,
    completedCampaigns: campaignStats?.completedCampaigns || 0,
  });

  console.log(`[Cron] Weekly digest sent`);
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
async function validateEmailAddresses(): Promise<void> {
  // الحصول على العناوين التي لم يتم التحقق منها
  const unvalidatedLeads = await db
    .select()
    .from(leads)
    .where(isNull(leads.emailValidatedAt))
    .limit(50);

  for (const lead of unvalidatedLeads) {
    // التحقق البسيط من صيغة البريد
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(lead.email);

    await db
      .update(leads)
      .set({
        emailValid: isValid,
        emailValidatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));
  }

  console.log(`[Cron] Validated ${unvalidatedLeads.length} email addresses`);
}

// ============ تسجيل المهام الافتراضية ============

export function initializeDefaultCronJobs(): void {
  // معالجة المهام المجدولة - كل دقيقة
  registerCronJob(
    "process_scheduled_jobs",
    "* * * * *",
    processScheduledJobsHandler
  );

  // تنظيف السجلات - كل يوم الساعة 3 صباحاً
  registerCronJob(
    "cleanup_old_records",
    "0 3 * * *",
    cleanupOldRecords
  );

  // التقرير اليومي - كل يوم الساعة 8 صباحاً
  registerCronJob(
    "daily_report",
    "0 8 * * *",
    sendDailyReport
  );

  // التحقق من الحملات - كل 15 دقيقة
  registerCronJob(
    "check_campaigns",
    "*/15 * * * *",
    checkScheduledCampaigns
  );

  // تذكيرات المتابعة - كل يوم الساعة 9 صباحاً
  registerCronJob(
    "follow_up_reminders",
    "0 9 * * *",
    sendFollowUpReminders
  );

  // تحديث النقاط - كل ساعة
  registerCronJob(
    "update_lead_scores",
    "0 * * * *",
    updateLeadScores
  );

  // معالجة التسلسلات - كل 5 دقائق
  registerCronJob(
    "process_sequences",
    "*/5 * * * *",
    processActiveSequences
  );

  // الملخص الأسبوعي - كل اثنين الساعة 9 صباحاً
  registerCronJob(
    "weekly_digest",
    "0 9 * * 1",
    sendWeeklyDigest
  );

  // التحقق من البريد - كل ساعة
  registerCronJob(
    "validate_emails",
    "30 * * * *",
    validateEmailAddresses
  );

  console.log(`[Cron] Initialized ${cronJobs.size} default cron jobs`);
}

/**
 * بدء معالج المهام الدورية
 */
export function startCronProcessor(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`[Cron] Starting cron processor (interval: ${intervalMs}ms)`);

  // تشغيل فوري
  runDueCronJobs().catch(console.error);

  // تشغيل دوري
  return setInterval(() => {
    runDueCronJobs().catch(console.error);
  }, intervalMs);
}

/**
 * الحصول على حالة المهام الدورية
 */
export function getCronJobsStatus(): Array<{
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}> {
  return Array.from(cronJobs.values()).map((job) => ({
    name: job.name,
    schedule: job.schedule,
    enabled: job.enabled,
    lastRun: job.lastRun?.toISOString(),
    nextRun: job.nextRun?.toISOString(),
  }));
}

/**
 * تفعيل/تعطيل مهمة دورية
 */
export function toggleCronJob(name: string, enabled: boolean): boolean {
  const job = cronJobs.get(name);
  if (!job) return false;

  job.enabled = enabled;
  if (enabled) {
    job.nextRun = getNextRunTime(job.schedule);
  }

  console.log(`[Cron] Job "${name}" ${enabled ? "enabled" : "disabled"}`);
  return true;
}

/**
 * تشغيل مهمة يدوياً
 */
export async function runCronJobManually(name: string): Promise<boolean> {
  const job = cronJobs.get(name);
  if (!job) return false;

  console.log(`[Cron] Manually running job: ${name}`);
  await job.handler();
  job.lastRun = new Date();
  
  return true;
}

export default {
  registerCronJob,
  runDueCronJobs,
  initializeDefaultCronJobs,
  startCronProcessor,
  getCronJobsStatus,
  toggleCronJob,
  runCronJobManually,
};
