import { getDb } from "./db";
import { sequences, sequenceSteps, sequenceEnrollments, emailQueue } from "../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";

// ============================================
// SEQUENCE CRUD
// ============================================

export async function createSequence(data: {
  userId: number;
  teamId?: number;
  name: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(sequences).values(data);
  const insertId = (result as any).insertId;
  return { id: Number(insertId) };
}

export async function getSequences(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(sequences)
    .where(eq(sequences.userId, userId))
    .orderBy(desc(sequences.createdAt));
}

export async function getSequenceById(sequenceId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(sequences)
    .where(eq(sequences.id, sequenceId))
    .limit(1);

  return result[0] || null;
}

export async function updateSequence(
  sequenceId: number,
  userId: number,
  data: {
    name?: string;
    description?: string;
    status?: "active" | "paused" | "archived";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(sequences)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(sequences.id, sequenceId), eq(sequences.userId, userId)));

  return { success: true };
}

export async function deleteSequence(sequenceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all steps
  await db
    .delete(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, sequenceId));

  // Delete all enrollments
  await db
    .delete(sequenceEnrollments)
    .where(eq(sequenceEnrollments.sequenceId, sequenceId));

  // Delete sequence
  await db
    .delete(sequences)
    .where(and(eq(sequences.id, sequenceId), eq(sequences.userId, userId)));

  return { success: true };
}

// ============================================
// SEQUENCE STEPS
// ============================================

export async function createStep(data: {
  sequenceId: number;
  stepNumber: number;
  name: string;
  subject: string;
  body: string;
  delayDays?: number;
  delayHours?: number;
  triggerType?: "time" | "opened" | "clicked" | "replied" | "not_opened" | "not_replied";
  stopOnReply?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(sequenceSteps).values({
    ...data,
    delayDays: data.delayDays || 0,
    delayHours: data.delayHours || 0,
    triggerType: data.triggerType || "time",
    stopOnReply: data.stopOnReply !== undefined ? data.stopOnReply : 1,
  });

  const insertId = (result as any).insertId;

  // Update sequence totalSteps
  const steps = await getSteps(data.sequenceId);
  await db
    .update(sequences)
    .set({ totalSteps: steps.length + 1 })
    .where(eq(sequences.id, data.sequenceId));

  return { id: Number(insertId) };
}

export async function getSteps(sequenceId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, sequenceId))
    .orderBy(asc(sequenceSteps.stepNumber));
}

export async function updateStep(
  stepId: number,
  data: {
    name?: string;
    subject?: string;
    body?: string;
    delayDays?: number;
    delayHours?: number;
    triggerType?: "time" | "opened" | "clicked" | "replied" | "not_opened" | "not_replied";
    stopOnReply?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(sequenceSteps)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sequenceSteps.id, stepId));

  return { success: true };
}

export async function deleteStep(stepId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get step info before deleting
  const stepResult = await db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.id, stepId))
    .limit(1);

  if (!stepResult[0]) throw new Error("Step not found");

  const sequenceId = stepResult[0].sequenceId;

  // Delete step
  await db.delete(sequenceSteps).where(eq(sequenceSteps.id, stepId));

  // Update sequence totalSteps
  const steps = await getSteps(sequenceId);
  await db
    .update(sequences)
    .set({ totalSteps: steps.length })
    .where(eq(sequences.id, sequenceId));

  return { success: true };
}

export async function reorderSteps(
  sequenceId: number,
  stepIds: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update each step's stepNumber based on array order
  for (let i = 0; i < stepIds.length; i++) {
    await db
      .update(sequenceSteps)
      .set({ stepNumber: i + 1 })
      .where(
        and(
          eq(sequenceSteps.id, stepIds[i]),
          eq(sequenceSteps.sequenceId, sequenceId)
        )
      );
  }

  return { success: true };
}

// ============================================
// SEQUENCE ENROLLMENTS
// ============================================

export async function enrollLead(data: {
  sequenceId: number;
  leadId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already enrolled
  const existing = await db
    .select()
    .from(sequenceEnrollments)
    .where(
      and(
        eq(sequenceEnrollments.sequenceId, data.sequenceId),
        eq(sequenceEnrollments.leadId, data.leadId)
      )
    )
    .limit(1);

  if (existing[0]) {
    throw new Error("Lead already enrolled in this sequence");
  }

  const result = await db.insert(sequenceEnrollments).values({
    ...data,
    currentStep: 0,
    status: "active",
  });

  const insertId = (result as any).insertId;

  // Update sequence totalEnrolled
  await db
    .update(sequences)
    .set({ totalEnrolled: (await getEnrollments(data.sequenceId)).length + 1 })
    .where(eq(sequences.id, data.sequenceId));

  return { id: Number(insertId) };
}

export async function unenrollLead(enrollmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get enrollment info
  const enrollment = await db
    .select()
    .from(sequenceEnrollments)
    .where(eq(sequenceEnrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment[0]) throw new Error("Enrollment not found");

  // Update status to stopped
  await db
    .update(sequenceEnrollments)
    .set({
      status: "stopped",
      stoppedReason: "Manual unenrollment",
      updatedAt: new Date(),
    })
    .where(eq(sequenceEnrollments.id, enrollmentId));

  // Cancel pending emails
  await db
    .update(emailQueue)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(emailQueue.enrollmentId, enrollmentId),
        eq(emailQueue.status, "pending")
      )
    );

  return { success: true };
}

export async function getEnrollments(sequenceId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(sequenceEnrollments)
    .where(eq(sequenceEnrollments.sequenceId, sequenceId))
    .orderBy(desc(sequenceEnrollments.enrolledAt));
}

export async function getEnrollmentStatus(sequenceId: number, leadId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(sequenceEnrollments)
    .where(
      and(
        eq(sequenceEnrollments.sequenceId, sequenceId),
        eq(sequenceEnrollments.leadId, leadId)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function updateEnrollmentStep(
  enrollmentId: number,
  currentStep: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(sequenceEnrollments)
    .set({
      currentStep,
      lastEmailSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sequenceEnrollments.id, enrollmentId));

  return { success: true };
}

export async function completeEnrollment(enrollmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get enrollment info
  const enrollment = await db
    .select()
    .from(sequenceEnrollments)
    .where(eq(sequenceEnrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment[0]) throw new Error("Enrollment not found");

  // Update status to completed
  await db
    .update(sequenceEnrollments)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sequenceEnrollments.id, enrollmentId));

  // Update sequence totalCompleted
  const completedCount = await db
    .select()
    .from(sequenceEnrollments)
    .where(
      and(
        eq(sequenceEnrollments.sequenceId, enrollment[0].sequenceId),
        eq(sequenceEnrollments.status, "completed")
      )
    );

  await db
    .update(sequences)
    .set({ totalCompleted: completedCount.length + 1 })
    .where(eq(sequences.id, enrollment[0].sequenceId));

  return { success: true };
}
