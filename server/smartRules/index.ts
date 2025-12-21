/**
 * Smart Rules System - Main Entry Point
 * نظام القواعد الذكية - نقطة الدخول الرئيسية
 */

// Tracking Pixel
export {
  generateTrackingPixel,
  generateTrackingUrl,
  handleTrackingPixelRequest,
  handleLinkClick,
  getEmailTrackingStats,
  createTrackingPixelRouter,
} from "./trackingPixel";

// Webhooks
export {
  sendWebhook,
  registerWebhook,
  unregisterWebhook,
  testWebhook,
  getWebhookLogs,
  retryFailedWebhooks,
  WEBHOOK_EVENTS,
  type WebhookEvent,
} from "./webhooks";

// Scheduled Jobs
export {
  createScheduledJob,
  cancelScheduledJob,
  processScheduledJobs,
  startJobProcessor,
  JOB_TYPES,
  JOB_STATUS,
  type JobType,
  type JobStatus,
} from "./scheduledJobs";

// Reply Classifier
export {
  classifyReply,
  processEmailReply,
  analyzeReplies,
  addCustomRule,
  REPLY_CATEGORIES,
  type ReplyCategory,
  type ClassificationResult,
} from "./replyClassifier";

// Cron Jobs
export {
  registerCronJob,
  runDueCronJobs,
  initializeDefaultCronJobs,
  startCronProcessor,
  getCronJobsStatus,
  toggleCronJob,
  runCronJobManually,
} from "./cronJobs";

/**
 * تهيئة نظام القواعد الذكية
 */
export function initializeSmartRules(): void {
  console.log("[SmartRules] Initializing Smart Rules System...");

  // تهيئة المهام الدورية الافتراضية
  const { initializeDefaultCronJobs } = require("./cronJobs");
  initializeDefaultCronJobs();

  console.log("[SmartRules] ✓ Smart Rules System initialized");
}

/**
 * بدء جميع المعالجات
 */
export function startAllProcessors(options?: {
  jobInterval?: number;
  cronInterval?: number;
}): { jobProcessor: NodeJS.Timeout; cronProcessor: NodeJS.Timeout } {
  const { startJobProcessor } = require("./scheduledJobs");
  const { startCronProcessor } = require("./cronJobs");

  const jobProcessor = startJobProcessor(options?.jobInterval || 60000);
  const cronProcessor = startCronProcessor(options?.cronInterval || 60000);

  console.log("[SmartRules] ✓ All processors started");

  return { jobProcessor, cronProcessor };
}

/**
 * إيقاف جميع المعالجات
 */
export function stopAllProcessors(processors: {
  jobProcessor: NodeJS.Timeout;
  cronProcessor: NodeJS.Timeout;
}): void {
  clearInterval(processors.jobProcessor);
  clearInterval(processors.cronProcessor);

  console.log("[SmartRules] ✓ All processors stopped");
}

export default {
  initializeSmartRules,
  startAllProcessors,
  stopAllProcessors,
};
