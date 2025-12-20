import { getDb } from "./db";
import { emailQueue, leads } from "../drizzle/schema";
import { eq, and, lte, or } from "drizzle-orm";

// ============================================
// EMAIL QUEUE MANAGEMENT
// ============================================

export async function addToQueue(data: {
  leadId: number;
  campaignId?: number;
  sequenceId?: number;
  sequenceStepId?: number;
  enrollmentId?: number;
  subject: string;
  body: string;
  scheduledAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailQueue).values({
    ...data,
    status: "pending",
    attempts: 0,
  });

  const insertId = (result as any).insertId;
  return { id: Number(insertId) };
}

export async function getPendingEmails(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  return await db
    .select({
      queue: emailQueue,
      lead: leads,
    })
    .from(emailQueue)
    .leftJoin(leads, eq(leads.id, emailQueue.leadId))
    .where(
      and(
        eq(emailQueue.status, "pending"),
        lte(emailQueue.scheduledAt, now)
      )
    )
    .limit(limit);
}

export async function markAsSending(queueId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailQueue)
    .set({
      status: "sending",
      attempts: (await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.id, queueId))
        .limit(1)
        .then((r) => r[0]?.attempts || 0)) + 1,
      lastAttemptAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(emailQueue.id, queueId));

  return { success: true };
}

export async function markAsSent(queueId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailQueue)
    .set({
      status: "sent",
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(emailQueue.id, queueId));

  return { success: true };
}

export async function markAsFailed(queueId: number, errorMessage: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current attempts
  const queueItem = await db
    .select()
    .from(emailQueue)
    .where(eq(emailQueue.id, queueId))
    .limit(1);

  if (!queueItem[0]) throw new Error("Queue item not found");

  const attempts = queueItem[0].attempts || 0;
  const maxAttempts = 3;

  // If max attempts reached, mark as failed permanently
  // Otherwise, reschedule for retry (1 hour later)
  if (attempts >= maxAttempts) {
    await db
      .update(emailQueue)
      .set({
        status: "failed",
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(emailQueue.id, queueId));
  } else {
    // Reschedule for 1 hour later
    const nextAttempt = new Date();
    nextAttempt.setHours(nextAttempt.getHours() + 1);

    await db
      .update(emailQueue)
      .set({
        status: "pending",
        scheduledAt: nextAttempt,
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(emailQueue.id, queueId));
  }

  return { success: true };
}

export async function cancelQueuedEmail(queueId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailQueue)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(emailQueue.id, queueId));

  return { success: true };
}

export async function getQueueStats() {
  const db = await getDb();
  if (!db) return {
    pending: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  };

  const stats = await db
    .select({
      status: emailQueue.status,
    })
    .from(emailQueue);

  return {
    pending: stats.filter((s) => s.status === "pending").length,
    sending: stats.filter((s) => s.status === "sending").length,
    sent: stats.filter((s) => s.status === "sent").length,
    failed: stats.filter((s) => s.status === "failed").length,
    cancelled: stats.filter((s) => s.status === "cancelled").length,
  };
}

// ============================================
// QUEUE PROCESSING (called by cron job)
// ============================================

export async function processQueue() {
  const pendingEmails = await getPendingEmails(50); // Process 50 at a time

  console.log(`[Queue] Processing ${pendingEmails.length} pending emails`);

  for (const item of pendingEmails) {
    if (!item.queue || !item.lead) continue;

    try {
      // Mark as sending
      await markAsSending(item.queue.id);

      // TODO: Integrate with actual email service (SendGrid/Amazon SES)
      // For now, just simulate sending
      console.log(`[Queue] Sending email for lead ID: ${item.lead.id}`);
      
      // Simulate email send
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Mark as sent
      await markAsSent(item.queue.id);

      // If this is part of a sequence, update enrollment
      if (item.queue.enrollmentId && item.queue.sequenceStepId) {
        const { updateEnrollmentStep, getSteps, completeEnrollment } = await import("./sequenceDb");
        const { getSequenceById } = await import("./sequenceDb");

        // Get sequence steps
        if (item.queue.sequenceId) {
          const steps = await getSteps(item.queue.sequenceId);
          const currentStepNumber = steps.find(s => s.id === item.queue.sequenceStepId)?.stepNumber || 0;

          // Check if this is the last step
          if (currentStepNumber >= steps.length) {
            // Complete enrollment
            await completeEnrollment(item.queue.enrollmentId);
          } else {
            // Update to current step
            await updateEnrollmentStep(item.queue.enrollmentId, currentStepNumber);
            
            // Schedule next step
            const nextStep = steps.find(s => s.stepNumber === currentStepNumber + 1);
            if (nextStep) {
              await scheduleNextStep(
                item.queue.enrollmentId,
                item.queue.leadId,
                item.queue.sequenceId,
                nextStep.id,
                nextStep.delayDays,
                nextStep.delayHours
              );
            }
          }
        }
      }

      console.log(`[Queue] Email sent successfully for lead ID: ${item.lead.id}`);
    } catch (error: any) {
      console.error(`[Queue] Failed to send email for lead ID: ${item.lead?.id}:`, error);
      await markAsFailed(item.queue.id, error.message);
    }
  }

  return { processed: pendingEmails.length };
}

// Helper function to schedule next step
async function scheduleNextStep(
  enrollmentId: number,
  leadId: number,
  sequenceId: number,
  stepId: number,
  delayDays: number,
  delayHours: number
) {
  const { getSteps } = await import("./sequenceDb");
  const steps = await getSteps(sequenceId);
  const step = steps.find(s => s.id === stepId);
  
  if (!step) return;

  // Calculate scheduled time
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + delayDays);
  scheduledAt.setHours(scheduledAt.getHours() + delayHours);

  // Add to queue
  await addToQueue({
    leadId,
    sequenceId,
    sequenceStepId: stepId,
    enrollmentId,
    subject: step.subject,
    body: step.body,
    scheduledAt,
  });
}
