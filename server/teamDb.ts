import { getDb } from "./db";
import { teams, users, teamInvitations } from "../drizzle/schema";
import { eq, and, or } from "drizzle-orm";
import crypto from "crypto";

// ============================================
// TEAM FUNCTIONS
// ============================================

export async function createTeam(data: { name: string; ownerId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(teams).values(data);
  const insertId = (result as any).insertId;
  
  // Update owner's teamId
  await db
    .update(users)
    .set({ teamId: Number(insertId) })
    .where(eq(users.id, data.ownerId));

  return { id: Number(insertId) };
}

export async function getTeamById(teamId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  return result[0] || null;
}

export async function updateTeam(
  teamId: number,
  ownerId: number,
  data: { name?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(teams)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(teams.id, teamId), eq(teams.ownerId, ownerId)));

  return { success: true };
}

export async function deleteTeam(teamId: number, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Remove teamId from all members
  await db
    .update(users)
    .set({ teamId: null })
    .where(eq(users.teamId, teamId));

  // Delete team
  await db
    .delete(teams)
    .where(and(eq(teams.id, teamId), eq(teams.ownerId, ownerId)));

  return { success: true };
}

// ============================================
// TEAM MEMBERS FUNCTIONS
// ============================================

export async function getTeamMembers(teamId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(users)
    .where(eq(users.teamId, teamId));
}

export async function updateMemberRole(
  userId: number,
  teamId: number,
  role: "admin" | "manager" | "viewer"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.teamId, teamId)));

  return { success: true };
}

export async function removeMember(userId: number, teamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ teamId: null, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.teamId, teamId)));

  return { success: true };
}

// ============================================
// TEAM INVITATION FUNCTIONS
// ============================================

function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createInvitation(data: {
  teamId: number;
  email: string;
  role: "admin" | "manager" | "viewer";
  invitedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  const result = await db.insert(teamInvitations).values({
    ...data,
    token,
    expiresAt,
    status: "pending",
  });

  const insertId = (result as any).insertId;
  return { id: Number(insertId), token };
}

export async function getTeamInvitations(teamId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.teamId, teamId),
        or(
          eq(teamInvitations.status, "pending"),
          eq(teamInvitations.status, "accepted")
        )
      )
    );
}

export async function getPendingInvitationsByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.email, email),
        eq(teamInvitations.status, "pending")
      )
    );
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(teamInvitations)
    .where(eq(teamInvitations.token, token))
    .limit(1);

  return result[0] || null;
}

export async function acceptInvitation(token: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new Error("Invitation already processed");
  }

  if (new Date() > new Date(invitation.expiresAt)) {
    throw new Error("Invitation expired");
  }

  // Update invitation status
  await db
    .update(teamInvitations)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(teamInvitations.token, token));

  // Add user to team
  await db
    .update(users)
    .set({
      teamId: invitation.teamId,
      role: invitation.role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true, teamId: invitation.teamId };
}

export async function declineInvitation(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(teamInvitations)
    .set({ status: "declined" })
    .where(eq(teamInvitations.token, token));

  return { success: true };
}

export async function cancelInvitation(invitationId: number, teamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(teamInvitations)
    .where(
      and(
        eq(teamInvitations.id, invitationId),
        eq(teamInvitations.teamId, teamId)
      )
    );

  return { success: true };
}


// ============================================
// TEAM ACTIVITY LOGGING
// ============================================

export async function getTeamActivities(teamId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const { activities, users } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");

  return await db
    .select({
      activity: activities,
      user: users,
    })
    .from(activities)
    .leftJoin(users, eq(users.id, activities.userId))
    .where(eq(activities.teamId, teamId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export async function logTeamActivity(data: {
  userId: number;
  teamId: number;
  type: string;
  description: string;
  metadata?: any;
}) {
  const { createActivity } = await import("./db");
  return await createActivity(data);
}
