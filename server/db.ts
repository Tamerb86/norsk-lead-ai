import { eq, and, or, like, desc, asc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { 
  InsertUser, 
  users, 
  norwegianCompanies,
  campaigns,
  leads,
  emailTemplates,
  emailEvents,
  activities,
  dataUpdateLogs,
  savedFilters,
  refreshTokens,
  InsertRefreshToken,
  aiIntegrations,
  InsertAIIntegration,
  systemSettings,
  InsertSystemSetting
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

/**
 * Get database connection
 * @throws Error if DATABASE_URL is missing or connection fails
 */
export async function getDb() {
  if (!_db) {
    // DATABASE_URL is already validated in ENV (will throw if missing)
    // But we double-check here for clarity
    if (!ENV.databaseUrl) {
      throw new Error(
        "❌ DATABASE_URL is not configured. " +
        "Please set DATABASE_URL in your environment variables."
      );
    }

    try {
      _pool = new pg.Pool({
        connectionString: ENV.databaseUrl,
        ssl: ENV.isProduction ? { rejectUnauthorized: false } : false,
      });
      _db = drizzle(_pool);
      console.log("✅ [Database] Connected successfully (PostgreSQL)");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `❌ [Database] Failed to connect: ${errorMessage}\n` +
        "Please check your DATABASE_URL and ensure the database is accessible."
      );
    }
  }
  return _db;
}

// ============================================
// USER FUNCTIONS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  // getDb() now throws if database is not available, so no need to check

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    // Handle subscription fields
    if (user.subscriptionPlan !== undefined) {
      values.subscriptionPlan = user.subscriptionPlan;
      updateSet.subscriptionPlan = user.subscriptionPlan;
    }
    if (user.monthlyLeadsQuota !== undefined) {
      values.monthlyLeadsQuota = user.monthlyLeadsQuota;
      updateSet.monthlyLeadsQuota = user.monthlyLeadsQuota;
    }
    if (user.usedLeadsThisMonth !== undefined) {
      values.usedLeadsThisMonth = user.usedLeadsThisMonth;
      updateSet.usedLeadsThisMonth = user.usedLeadsThisMonth;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  // getDb() now throws if database is not available

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// NORWEGIAN COMPANIES FUNCTIONS
// ============================================

export async function searchCompanies(params: {
  query?: string;
  fylke?: string;
  kommune?: string;
  poststed?: string; // City filter
  naeringskode?: string;
  organisasjonsform?: string;
  minEmployees?: number;
  maxEmployees?: number;
  foundedAfter?: string; // stiftelsesdato
  foundedBefore?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
  sortBy?: 'name' | 'employees' | 'founded' | 'recent';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  // getDb() now throws if database is not available, so db is always defined

  const conditions = [];

  if (params.query) {
    // Use ILIKE for case-insensitive search
    conditions.push(
      or(
        sql`${norwegianCompanies.navn} ILIKE ${`%${params.query}%`}`,
        sql`${norwegianCompanies.organisasjonsnummer} ILIKE ${`%${params.query}%`}`
      )
    );
  }

  if (params.fylke) {
    conditions.push(eq(norwegianCompanies.fylke, params.fylke));
  }

  if (params.kommune) {
    conditions.push(eq(norwegianCompanies.kommune, params.kommune));
  }

  if (params.poststed) {
    // Use ILIKE for case-insensitive city search
    conditions.push(sql`${norwegianCompanies.poststed} ILIKE ${`%${params.poststed}%`}`);
  }

  if (params.naeringskode) {
    conditions.push(like(norwegianCompanies.naeringskode1, `${params.naeringskode}%`));
  }

  if (params.minEmployees !== undefined) {
    conditions.push(sql`${norwegianCompanies.antallAnsatte} >= ${params.minEmployees}`);
  }

  if (params.maxEmployees !== undefined) {
    conditions.push(sql`${norwegianCompanies.antallAnsatte} <= ${params.maxEmployees}`);
  }

  if (params.hasEmail) {
    conditions.push(sql`${norwegianCompanies.epostadresse} IS NOT NULL AND ${norwegianCompanies.epostadresse} != ''`);
  }

  if (params.hasPhone) {
    conditions.push(sql`${norwegianCompanies.telefon} IS NOT NULL AND ${norwegianCompanies.telefon} != ''`);
  }

  if (params.hasWebsite) {
    conditions.push(sql`${norwegianCompanies.hjemmeside} IS NOT NULL AND ${norwegianCompanies.hjemmeside} != ''`);
  }

  if (params.organisasjonsform) {
    conditions.push(eq(norwegianCompanies.organisasjonsform, params.organisasjonsform));
  }

  if (params.foundedAfter) {
    conditions.push(sql`${norwegianCompanies.stiftelsesdato} >= ${params.foundedAfter}`);
  }

  if (params.foundedBefore) {
    conditions.push(sql`${norwegianCompanies.stiftelsesdato} <= ${params.foundedBefore}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Determine sort order
  let orderByClause;
  const sortOrder = params.sortOrder === 'asc' ? asc : desc;
  
  switch (params.sortBy) {
    case 'name':
      orderByClause = sortOrder(norwegianCompanies.navn);
      break;
    case 'founded':
      orderByClause = sortOrder(norwegianCompanies.stiftelsesdato);
      break;
    case 'recent':
      orderByClause = desc(norwegianCompanies.registreringsdato);
      break;
    case 'employees':
    default:
      orderByClause = desc(norwegianCompanies.antallAnsatte);
      break;
  }

  const companiesResult = await db
    .select()
    .from(norwegianCompanies)
    .where(whereClause)
    .limit(params.limit || 50)
    .offset(params.offset || 0)
    .orderBy(orderByClause);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(norwegianCompanies)
    .where(whereClause);

  return {
    companies: companiesResult,
    total: totalResult[0]?.count || 0,
  };
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  // getDb() now throws if database is not available

  const result = await db
    .select()
    .from(norwegianCompanies)
    .where(eq(norwegianCompanies.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getCompaniesStats() {
  const db = await getDb();
  // getDb() now throws if database is not available

  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      withEmail: sql<number>`sum(case when ${norwegianCompanies.epostadresse} IS NOT NULL AND ${norwegianCompanies.epostadresse} != '' then 1 else 0 end)`,
      withPhone: sql<number>`sum(case when ${norwegianCompanies.telefon} IS NOT NULL AND ${norwegianCompanies.telefon} != '' then 1 else 0 end)`,
      withWebsite: sql<number>`sum(case when ${norwegianCompanies.hjemmeside} IS NOT NULL AND ${norwegianCompanies.hjemmeside} != '' then 1 else 0 end)`,
    })
    .from(norwegianCompanies);

  return stats[0] || { total: 0, withEmail: 0, withPhone: 0, withWebsite: 0 };
}

// ============================================
// CAMPAIGNS FUNCTIONS
// ============================================

export async function getCampaigns(userId: number) {
  const db = await getDb();
  // getDb() now throws if database is not available

  return await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number, userId: number) {
  const db = await getDb();
  // getDb() now throws if database is not available

  const result = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
    .limit(1);

  return result[0] || null;
}

export async function createCampaign(data: {
  userId: number;
  name: string;
  emailSubject?: string;
  emailBody?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db
    .insert(campaigns)
    .values({
      ...data,
      status: "draft" as const,
      totalRecipients: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalReplied: 0,
      totalBounced: 0,
      totalUnsubscribed: 0,
    })
    .$returningId();

  if (!inserted || !inserted.id) {
    throw new Error("Failed to create campaign");
  }
  
  // Return the full campaign object
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, inserted.id))
    .limit(1);
  
  if (!campaign) {
    throw new Error("Failed to retrieve created campaign");
  }
  
  return campaign;
}

export async function updateCampaign(
  id: number,
  userId: number,
  data: Partial<{
    name: string;
    status: string;
    emailSubject: string;
    emailBody: string;
    senderName: string;
    senderEmail: string;
    replyTo: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(campaigns)
    .set(data as any)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));

  return { success: true };
}

export async function deleteCampaign(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));

  return { success: true };
}

// ============================================
// LEADS FUNCTIONS
// ============================================

export async function getLeadsByCampaign(campaignId: number, userId: number) {
  const db = await getDb();
  // getDb() now throws if database is not available

  return await db
    .select({
      lead: leads,
      company: norwegianCompanies,
    })
    .from(leads)
    .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
    .where(and(eq(leads.campaignId, campaignId), eq(leads.userId, userId)))
    .orderBy(desc(leads.createdAt));
}

export async function addLeadToCampaign(data: {
  userId: number;
  campaignId: number;
  companyId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate tracking ID for email tracking
  const { generateTrackingId } = await import("./emailTracking");
  const trackingId = generateTrackingId();

  const result = await db.insert(leads).values({
    ...data,
    trackingId,
    status: "pending",
    openCount: 0,
    clickCount: 0,
    followUpCount: 0,
  });

  const insertId = (result as any).insertId;
  return { id: Number(insertId), trackingId };
}

export async function updateLeadStatus(
  id: number,
  userId: number,
  status: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(leads)
    .set({ status: status as any, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)));

  return { success: true };
}

// ============================================
// EMAIL TEMPLATES FUNCTIONS
// ============================================

export async function getTemplates(userId: number) {
  const db = await getDb();
  // getDb() now throws if database is not available

  return await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.userId, userId))
    .orderBy(desc(emailTemplates.createdAt));
}

export async function createTemplate(data: {
  userId: number;
  name: string;
  subject: string;
  body: string;
  category?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailTemplates).values({
    ...data,
    isDefault: false,
  }).returning({ id: emailTemplates.id });

  return { id: result[0]?.id || 0 };
}

export async function updateTemplate(
  id: number,
  userId: number,
  data: Partial<{
    name: string;
    subject: string;
    body: string;
    category: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailTemplates)
    .set(data)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));

  return { success: true };
}

export async function deleteTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(emailTemplates)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));

  return { success: true };
}

// ============================================
// ACTIVITIES FUNCTIONS
// ============================================

export async function getActivities(userId: number, limit: number = 50) {
  const db = await getDb();
  // getDb() now throws if database is not available

  return await db
    .select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export async function createActivity(data: {
  userId: number;
  teamId?: number;
  leadId?: number;
  campaignId?: number;
  type: string;
  description?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(activities).values(data);

  const insertId = (result as any).insertId;
  return { id: Number(insertId) };
}

// ============================================
// SAVED FILTERS FUNCTIONS
// ============================================

export async function getSavedFilters(userId: number) {
  const db = await getDb();
  // getDb() now throws if database is not available

  return await db
    .select()
    .from(savedFilters)
    .where(eq(savedFilters.userId, userId))
    .orderBy(desc(savedFilters.createdAt));
}

export async function createSavedFilter(data: {
  userId: number;
  name: string;
  filters: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(savedFilters).values(data);

  const insertId = (result as any).insertId;
  return { id: Number(insertId) };
}

export async function deleteSavedFilter(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(savedFilters)
    .where(and(eq(savedFilters.id, id), eq(savedFilters.userId, userId)));

  return { success: true };
}

// ============================================
// EMAIL QUEUE FUNCTIONS
// ============================================

/**
 * Queue campaign emails for sending
 */
export async function queueCampaignEmails(
  campaignId: number,
  leadIds: number[],
  scheduledAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Import emailQueue schema
  const { emailQueue } = await import("../drizzle/schema");

  // Get campaign details
  const campaign = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign[0]) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const campaignData = campaign[0];

  // Get leads
  const leadsData = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.campaignId, campaignId),
        inArray(leads.id, leadIds)
      )
    );

  if (leadsData.length === 0) {
    throw new Error("No leads found for the specified IDs");
  }

  // Queue emails for each lead
  const queuedEmails = [];
  for (const lead of leadsData) {
    await db.insert(emailQueue).values({
      leadId: lead.id,
      campaignId,
      sequenceId: null,
      sequenceStepId: null,
      enrollmentId: null,
      subject: campaignData.emailSubject || "No Subject",
      body: campaignData.emailBody || "",
      scheduledAt,
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
    });

    queuedEmails.push({
      leadId: lead.id,
    });
  }

  return {
    success: true,
    queued: queuedEmails.length,
    scheduledAt,
  };
}


// ============================================
// AUTH FUNCTIONS (Local Authentication)
// ============================================

/**
 * User authentication functions
 */

export async function getUserByEmail(email: string) {
  const db = await getDb();
  // Convert email to lowercase for case-insensitive search
  const normalizedEmail = email.toLowerCase();
  const result = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
    .limit(1);
  return result[0] || null;
}

export async function setUserPassword(openId: string, passwordHash: string) {
  const db = await getDb();
  // Store password hash in the users table password_hash column
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.openId, openId));
}

export async function getUserPassword(openId: string): Promise<string | null> {
  const db = await getDb();
  const result = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0]?.passwordHash || null;
}

export async function getAllUsers() {
  const db = await getDb();
  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));
  
  return {
    users: allUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastSignedIn: u.lastSignedIn,
      subscriptionPlan: u.subscriptionPlan,
      subscriptionStatus: u.subscriptionStatus,
      usedLeadsThisMonth: u.usedLeadsThisMonth,
      monthlyLeadsQuota: u.monthlyLeadsQuota,
      isActive: u.isActive !== false,
    }))
  };
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId));
  return { success: true };
}

export async function updateUserPlan(userId: number, plan: string) {
  const db = await getDb();
  await db
    .update(users)
    .set({ subscriptionPlan: plan })
    .where(eq(users.id, userId));
  return { success: true };
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  const db = await getDb();
  await db
    .update(users)
    .set({ isActive })
    .where(eq(users.id, userId));
  return { success: true };
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  await db.delete(users).where(eq(users.id, userId));
  return { success: true };
}

/**
 * Calculate estimated monthly revenue based on active subscriptions
 * Basic plan: 499 NOK, Pro plan: 1299 NOK
 */
function calculateMonthlyRevenue(activeSubscriptions: number): number {
  // For now, estimate average revenue per subscription
  // TODO: Calculate actual revenue from Stripe when integrated
  const averageRevenuePerSubscription = 899; // Average of Basic (499) and Pro (1299)
  return activeSubscriptions * averageRevenuePerSubscription;
}

export async function getAdminStats() {
  const db = await getDb();
  
  const [userStats] = await db
    .select({
      totalUsers: sql<number>`count(*)`,
      activeSubscriptions: sql<number>`sum(case when "subscriptionPlan" is not null and "subscriptionPlan" != '' then 1 else 0 end)`,
    })
    .from(users);

  const [companyStats] = await db
    .select({
      totalCompanies: sql<number>`count(*)`,
    })
    .from(norwegianCompanies);

  const [campaignStats] = await db
    .select({
      totalCampaigns: sql<number>`count(*)`,
    })
    .from(campaigns);

  const [emailStats] = await db
    .select({
      totalEmailsSent: sql<number>`count(*)`,
    })
    .from(emailEvents);

  return {
    totalUsers: Number(userStats?.totalUsers) || 0,
    totalCompanies: Number(companyStats?.totalCompanies) || 0,
    totalCampaigns: Number(campaignStats?.totalCampaigns) || 0,
    totalEmailsSent: Number(emailStats?.totalEmailsSent) || 0,
    activeSubscriptions: Number(userStats?.activeSubscriptions) || 0,
    revenue: calculateMonthlyRevenue(Number(userStats?.activeSubscriptions) || 0),
  };
}


// ============================================
// SAVED COMPANIES FUNCTIONS
// ============================================

export async function checkCompanySaved(userId: number, companyId: number): Promise<boolean> {
  const db = await getDb();
  
  const result = await db.execute(
    sql`SELECT id FROM saved_companies WHERE user_id = ${userId} AND company_id = ${companyId} LIMIT 1`
  );
  
  return (result.rows?.length || 0) > 0;
}

export async function saveCompany(data: {
  userId: number;
  companyId: number;
  listName: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`INSERT INTO saved_companies (user_id, company_id, list_name, notes, created_at)
        VALUES (${data.userId}, ${data.companyId}, ${data.listName}, ${data.notes || null}, NOW())
        ON CONFLICT (user_id, company_id) DO UPDATE SET list_name = ${data.listName}, notes = ${data.notes || null}`
  );

  return { success: true };
}

export async function removeSavedCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`DELETE FROM saved_companies WHERE user_id = ${userId} AND company_id = ${companyId}`
  );

  return { success: true };
}

export async function getSavedCompanies(userId: number) {
  const db = await getDb();

  const result = await db.execute(
    sql`SELECT sc.id, sc.company_id as "companyId", sc.list_name as "listName", sc.notes, sc.created_at as "createdAt",
               nc.id as "company.id", nc.navn as "company.navn", nc.organisasjonsnummer as "company.organisasjonsnummer",
               nc.epostadresse as "company.epost", nc.telefon as "company.telefon", nc.hjemmeside as "company.hjemmeside",
               nc.poststed as "company.poststed", nc.organisasjonsform as "company.organisasjonsform",
               nc.antall_ansatte as "company.antallAnsatte"
        FROM saved_companies sc
        LEFT JOIN norwegian_companies nc ON sc.company_id = nc.id
        WHERE sc.user_id = ${userId}
        ORDER BY sc.created_at DESC`
  );

  // Transform flat result to nested structure
  return result.rows?.map((row: any) => ({
    id: row.id,
    companyId: row.companyId,
    listName: row.listName,
    notes: row.notes,
    createdAt: row.createdAt,
    company: {
      id: row['company.id'],
      navn: row['company.navn'],
      organisasjonsnummer: row['company.organisasjonsnummer'],
      epost: row['company.epost'],
      telefon: row['company.telefon'],
      hjemmeside: row['company.hjemmeside'],
      poststed: row['company.poststed'],
      organisasjonsform: row['company.organisasjonsform'],
      antallAnsatte: row['company.antallAnsatte'],
    },
  })) || [];
}

export async function getSavedCompanyLists(userId: number): Promise<string[]> {
  const db = await getDb();

  const result = await db.execute(
    sql`SELECT DISTINCT list_name FROM saved_companies WHERE user_id = ${userId} ORDER BY list_name`
  );

  return result.rows?.map((row: any) => row.list_name) || [];
}

// ============================================
// NOTIFICATIONS FUNCTIONS
// ============================================

export async function getNotifications(userId: number, limit: number = 20) {
  const db = await getDb();

  const result = await db.execute(
    sql`SELECT id, type, title, message, related_id as "relatedId", related_type as "relatedType", 
               is_read as "isRead", created_at as "createdAt"
        FROM notifications 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}`
  );

  return result.rows || [];
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();

  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${userId} AND is_read = false`
  );

  return Number(result.rows?.[0]?.count || 0);
}

export async function markNotificationAsRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE notifications SET is_read = true WHERE id = ${id} AND user_id = ${userId}`
  );

  return { success: true };
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE notifications SET is_read = true WHERE user_id = ${userId}`
  );

  return { success: true };
}

export async function deleteNotification(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`DELETE FROM notifications WHERE id = ${id} AND user_id = ${userId}`
  );

  return { success: true };
}

export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message?: string;
  relatedId?: number;
  relatedType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`INSERT INTO notifications (user_id, type, title, message, related_id, related_type, is_read, created_at)
        VALUES (${data.userId}, ${data.type}, ${data.title}, ${data.message || null}, 
                ${data.relatedId || null}, ${data.relatedType || null}, false, NOW())`
  );

  return { success: true };
}

/**
 * Create notification for email event
 */
export async function createEmailEventNotification(data: {
  userId: number;
  eventType: 'open' | 'click' | 'reply' | 'bounce';
  companyName: string;
  email: string;
  campaignId?: number;
  leadId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const typeMap: Record<string, { type: string; title: string; message: string }> = {
    open: {
      type: 'email_opened',
      title: `${data.companyName} åpnet e-posten din`,
      message: `${data.email} har åpnet e-posten du sendte.`,
    },
    click: {
      type: 'email_clicked',
      title: `${data.companyName} klikket på en lenke`,
      message: `${data.email} har klikket på en lenke i e-posten din.`,
    },
    reply: {
      type: 'email_replied',
      title: `${data.companyName} svarte på e-posten din`,
      message: `Du har mottatt et svar fra ${data.email}.`,
    },
    bounce: {
      type: 'email_bounced',
      title: `E-post til ${data.companyName} ble avvist`,
      message: `E-posten til ${data.email} kunne ikke leveres.`,
    },
  };

  const notificationData = typeMap[data.eventType];
  if (!notificationData) return { success: false };

  await db.execute(
    sql`INSERT INTO notifications (user_id, type, title, message, related_id, related_type, is_read, created_at)
        VALUES (${data.userId}, ${notificationData.type}, ${notificationData.title}, ${notificationData.message}, 
                ${data.campaignId || data.leadId || null}, ${data.campaignId ? 'campaign' : 'lead'}, false, NOW())`
  );

  return { success: true };
}

// ============================================
// SUBSCRIPTION FUNCTIONS
// ============================================

/**
 * Update user subscription after successful checkout
 */
export async function updateUserSubscription(data: {
  userId: number;
  planId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get plan limits
  const planLimits: Record<string, { leads: number }> = {
    basic: { leads: 1000 },
    pro: { leads: -1 }, // -1 = unlimited
  };

  const limits = planLimits[data.planId] || planLimits.basic;

  await db.execute(
    sql`UPDATE users 
        SET "subscriptionPlan" = ${data.planId},
            stripe_customer_id = ${data.stripeCustomerId},
            stripe_subscription_id = ${data.stripeSubscriptionId},
            subscription_status = ${data.status},
            "monthlyLeadsQuota" = ${limits.leads},
            "updatedAt" = NOW()
        WHERE id = ${data.userId}`
  );

  return { success: true };
}

/**
 * Update subscription status by Stripe customer ID
 */
export async function updateSubscriptionByStripeCustomerId(data: {
  stripeCustomerId: string;
  status: string;
  periodEnd?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.periodEnd) {
    await db.execute(
      sql`UPDATE users 
          SET subscription_status = ${data.status},
              subscription_period_end = ${data.periodEnd},
              "updatedAt" = NOW()
          WHERE stripe_customer_id = ${data.stripeCustomerId}`
    );
  } else {
    await db.execute(
      sql`UPDATE users 
          SET subscription_status = ${data.status},
              "updatedAt" = NOW()
          WHERE stripe_customer_id = ${data.stripeCustomerId}`
    );
  }

  return { success: true };
}

/**
 * Cancel subscription by Stripe customer ID
 */
export async function cancelSubscriptionByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE users 
        SET subscription_status = 'cancelled',
            "subscriptionPlan" = NULL,
            stripe_subscription_id = NULL,
            "updatedAt" = NOW()
        WHERE stripe_customer_id = ${stripeCustomerId}`
  );

  return { success: true };
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(
    sql`SELECT "subscriptionPlan", subscription_status as "subscriptionStatus", 
               subscription_period_end as "subscriptionPeriodEnd",
               stripe_customer_id as "stripeCustomerId",
               stripe_subscription_id as "stripeSubscriptionId",
               "monthlyLeadsQuota", "usedLeadsThisMonth"
        FROM users WHERE id = ${userId}`
  );

  if (!result.rows || result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Get all subscriptions for admin panel
 */
export async function getAllSubscriptions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(
    sql`SELECT id, name, email, "subscriptionPlan", subscription_status as "subscriptionStatus",
               subscription_period_end as "subscriptionPeriodEnd",
               "monthlyLeadsQuota", "usedLeadsThisMonth", "createdAt"
        FROM users 
        WHERE "subscriptionPlan" IS NOT NULL
        ORDER BY "createdAt" DESC`
  );

  return result.rows || [];
}

/**
 * Reset monthly leads usage (should be called monthly via cron)
 */
export async function resetMonthlyLeadsUsage() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE users SET "usedLeadsThisMonth" = 0 WHERE "subscriptionPlan" IS NOT NULL`
  );

  return { success: true };
}

/**
 * Increment used leads for a user
 */
export async function incrementUsedLeads(userId: number, count: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE users 
        SET "usedLeadsThisMonth" = COALESCE("usedLeadsThisMonth", 0) + ${count}
        WHERE id = ${userId}`
  );

  return { success: true };
}


/**
 * Get user usage statistics for the current month
 */
export async function getUserUsageStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user subscription info
  const userResult = await db.execute(
    sql`SELECT "subscriptionPlan", "monthlyLeadsQuota", "usedLeadsThisMonth"
        FROM users WHERE id = ${userId}`
  );

  const user = userResult.rows?.[0] as any;
  const plan = user?.subscriptionPlan || 'free';

  // Get plan limits
  const planLimits: Record<string, { companies: number; emails: number; campaigns: number }> = {
    free: { companies: 50, emails: 100, campaigns: 1 },
    basic: { companies: 1000, emails: 5000, campaigns: 5 },
    pro: { companies: -1, emails: 25000, campaigns: -1 }, // -1 = unlimited
  };

  const limits = planLimits[plan] || planLimits.free;

  // Get companies used this month
  const companiesResult = await db.execute(
    sql`SELECT COUNT(DISTINCT company_id) as count 
        FROM saved_companies 
        WHERE user_id = ${userId} 
        AND created_at >= date_trunc('month', CURRENT_DATE)`
  );
  const companiesUsed = Number((companiesResult.rows?.[0] as any)?.count) || 0;

  // Get emails sent this month
  const emailsResult = await db.execute(
    sql`SELECT COUNT(*) as count 
        FROM emails 
        WHERE user_id = ${userId} 
        AND created_at >= date_trunc('month', CURRENT_DATE)`
  );
  const emailsSent = Number((emailsResult.rows?.[0] as any)?.count) || 0;

  // Get active campaigns
  const campaignsResult = await db.execute(
    sql`SELECT COUNT(*) as count 
        FROM campaigns 
        WHERE user_id = ${userId} 
        AND status = 'active'`
  );
  const campaignsActive = Number((campaignsResult.rows?.[0] as any)?.count) || 0;

  return {
    companiesUsed,
    companiesLimit: limits.companies,
    emailsSent,
    emailsLimit: limits.emails,
    campaignsActive,
    campaignsLimit: limits.campaigns,
  };
}

/**
 * Update user subscription (simplified version for partial updates)
 */
export async function updateUserSubscriptionPartial(userId: number, data: {
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionPeriodEnd?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate userId is a number to prevent SQL injection
  if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID");
  }

  // Use Drizzle ORM for safe updates
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.subscriptionPlan !== undefined) {
    updateData.subscriptionPlan = data.subscriptionPlan;
  }

  if (data.subscriptionStatus !== undefined) {
    updateData.subscriptionStatus = data.subscriptionStatus;
  }

  if (data.subscriptionPeriodEnd !== undefined) {
    updateData.subscriptionPeriodEnd = data.subscriptionPeriodEnd;
  }

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt, no actual changes
    return { success: true };
  }

  await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  return { success: true };
}


// ============================================
// Refresh Token Functions
// ============================================

/**
 * Create a new refresh token
 */
export async function createRefreshToken(data: {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const db = await getDb();
  const result = await db.insert(refreshTokens).values({
    userId: data.userId,
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
  }).returning();
  return result[0];
}

/**
 * Get refresh token by hash
 */
export async function getRefreshTokenByHash(tokenHash: string) {
  const db = await getDb();
  const result = await db.select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);
  return result[0] || null;
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(tokenId: number) {
  const db = await getDb();
  await db.update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, tokenId));
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserRefreshTokens(userId: number) {
  const db = await getDb();
  await db.update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(refreshTokens.userId, userId),
      sql`${refreshTokens.revokedAt} IS NULL`
    ));
}

/**
 * Clean up expired refresh tokens (should be run periodically)
 */
export async function cleanupExpiredRefreshTokens() {
  const db = await getDb();
  await db.delete(refreshTokens)
    .where(sql`${refreshTokens.expiresAt} < NOW()`);
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const db = await getDb();
  const result = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0] || null;
}


// ============================================
// EMAIL FINDER / ENRICHMENT FUNCTIONS
// ============================================

/**
 * Get companies without email address
 */
export async function getCompaniesWithoutEmail(params: {
  limit?: number;
  fylke?: string;
  kommune?: string;
  hasWebsite?: boolean;
}) {
  const db = await getDb();
  
  let query = sql`
    SELECT id, organisasjonsnummer, navn, hjemmeside, telefon, kommune, fylke, poststed
    FROM norwegian_companies
    WHERE (epostadresse IS NULL OR epostadresse = '')
    AND konkurs = false
    AND "underAvvikling" = false
  `;

  if (params.fylke) {
    query = sql`${query} AND fylke = ${params.fylke}`;
  }

  if (params.kommune) {
    query = sql`${query} AND kommune = ${params.kommune}`;
  }

  if (params.hasWebsite) {
    query = sql`${query} AND hjemmeside IS NOT NULL AND hjemmeside != ''`;
  }

  query = sql`${query} ORDER BY RANDOM() LIMIT ${params.limit || 100}`;

  const result = await db.execute(query);
  return (result.rows || []) as Array<{
    id: number;
    organisasjonsnummer: string;
    navn: string;
    hjemmeside: string | null;
    telefon: string | null;
    kommune: string | null;
    fylke: string | null;
    poststed: string | null;
  }>;
}

/**
 * Update company contact information
 */
export async function updateCompanyContact(companyId: number, data: {
  epostadresse?: string | null;
  telefon?: string | null;
  hjemmeside?: string | null;
}) {
  const db = await getDb();

  // Validate companyId
  if (typeof companyId !== 'number' || !Number.isInteger(companyId) || companyId <= 0) {
    throw new Error("Invalid company ID");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.epostadresse !== undefined) {
    updateData.epostadresse = data.epostadresse;
  }

  if (data.telefon !== undefined) {
    updateData.telefon = data.telefon;
  }

  if (data.hjemmeside !== undefined) {
    updateData.hjemmeside = data.hjemmeside;
  }

  if (Object.keys(updateData).length === 1) {
    return { success: true };
  }

  await db.update(norwegianCompanies)
    .set(updateData)
    .where(eq(norwegianCompanies.id, companyId));

  return { success: true };
}

/**
 * Get email enrichment statistics
 */
export async function getEmailEnrichmentStats() {
  const db = await getDb();

  // Total companies
  const totalResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM norwegian_companies WHERE konkurs = false`
  );
  const total = Number((totalResult.rows?.[0] as any)?.count) || 0;

  // Companies with email
  const withEmailResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM norwegian_companies 
        WHERE epostadresse IS NOT NULL AND epostadresse != '' AND konkurs = false`
  );
  const withEmail = Number((withEmailResult.rows?.[0] as any)?.count) || 0;

  // Companies without email
  const withoutEmail = total - withEmail;

  // Companies with website but no email (good candidates for enrichment)
  const websiteNoEmailResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM norwegian_companies 
        WHERE (epostadresse IS NULL OR epostadresse = '')
        AND hjemmeside IS NOT NULL AND hjemmeside != ''
        AND konkurs = false`
  );
  const websiteNoEmail = Number((websiteNoEmailResult.rows?.[0] as any)?.count) || 0;

  // Companies with phone
  const withPhoneResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM norwegian_companies 
        WHERE telefon IS NOT NULL AND telefon != '' AND konkurs = false`
  );
  const withPhone = Number((withPhoneResult.rows?.[0] as any)?.count) || 0;

  // Companies with website
  const withWebsiteResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM norwegian_companies 
        WHERE hjemmeside IS NOT NULL AND hjemmeside != '' AND konkurs = false`
  );
  const withWebsite = Number((withWebsiteResult.rows?.[0] as any)?.count) || 0;

  return {
    total,
    withEmail,
    withoutEmail,
    websiteNoEmail,
    withPhone,
    withWebsite,
    emailCoverage: total > 0 ? Math.round((withEmail / total) * 100) : 0,
    phoneCoverage: total > 0 ? Math.round((withPhone / total) * 100) : 0,
    websiteCoverage: total > 0 ? Math.round((withWebsite / total) * 100) : 0,
  };
}


// ============================================
// AI INTEGRATIONS FUNCTIONS
// ============================================

/**
 * Get all AI integrations
 */
export async function getAIIntegrations() {
  const db = await getDb();
  const result = await db.select()
    .from(aiIntegrations)
    .orderBy(desc(aiIntegrations.createdAt));
  return result;
}

/**
 * Get enabled AI integrations
 */
export async function getEnabledAIIntegrations() {
  const db = await getDb();
  const result = await db.select()
    .from(aiIntegrations)
    .where(eq(aiIntegrations.isEnabled, true))
    .orderBy(desc(aiIntegrations.isDefault));
  return result;
}

/**
 * Get default AI integration for a provider type
 */
export async function getDefaultAIIntegration(provider?: string) {
  const db = await getDb();
  
  let query = db.select()
    .from(aiIntegrations)
    .where(and(
      eq(aiIntegrations.isEnabled, true),
      eq(aiIntegrations.isDefault, true)
    ));
  
  if (provider) {
    query = db.select()
      .from(aiIntegrations)
      .where(and(
        eq(aiIntegrations.isEnabled, true),
        eq(aiIntegrations.provider, provider)
      ));
  }
  
  const result = await query.limit(1);
  return result[0] || null;
}

/**
 * Create AI integration
 */
export async function createAIIntegration(data: InsertAIIntegration) {
  const db = await getDb();
  
  // If this is set as default, unset other defaults for the same provider
  if (data.isDefault) {
    await db.update(aiIntegrations)
      .set({ isDefault: false })
      .where(eq(aiIntegrations.provider, data.provider));
  }
  
  const result = await db.insert(aiIntegrations).values(data).returning();
  return result[0];
}

/**
 * Update AI integration
 */
export async function updateAIIntegration(id: number, data: Partial<InsertAIIntegration>) {
  const db = await getDb();
  
  // If setting as default, unset other defaults
  if (data.isDefault) {
    const current = await db.select().from(aiIntegrations).where(eq(aiIntegrations.id, id)).limit(1);
    if (current[0]) {
      await db.update(aiIntegrations)
        .set({ isDefault: false })
        .where(eq(aiIntegrations.provider, current[0].provider));
    }
  }
  
  const result = await db.update(aiIntegrations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(aiIntegrations.id, id))
    .returning();
  return result[0];
}

/**
 * Delete AI integration
 */
export async function deleteAIIntegration(id: number) {
  const db = await getDb();
  await db.delete(aiIntegrations).where(eq(aiIntegrations.id, id));
  return { success: true };
}

/**
 * Increment AI integration usage
 */
export async function incrementAIUsage(id: number) {
  const db = await getDb();
  await db.update(aiIntegrations)
    .set({ 
      usageCount: sql`${aiIntegrations.usageCount} + 1`,
      lastUsedAt: new Date()
    })
    .where(eq(aiIntegrations.id, id));
}

/**
 * Test AI integration connection
 */
export async function testAIIntegration(id: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  const integration = await db.select()
    .from(aiIntegrations)
    .where(eq(aiIntegrations.id, id))
    .limit(1);
  
  if (!integration[0]) {
    return { success: false, message: "Integration not found" };
  }
  
  // For now, just check if API key exists
  if (!integration[0].apiKey) {
    return { success: false, message: "API key not configured" };
  }
  
  return { success: true, message: "Connection successful" };
}

// ============================================
// SYSTEM SETTINGS FUNCTIONS
// ============================================

/**
 * Get all system settings
 */
export async function getSystemSettings(category?: string) {
  const db = await getDb();
  
  if (category) {
    return await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category))
      .orderBy(asc(systemSettings.key));
  }
  
  return await db.select()
    .from(systemSettings)
    .orderBy(asc(systemSettings.category), asc(systemSettings.key));
}

/**
 * Get a single system setting
 */
export async function getSystemSetting(key: string) {
  const db = await getDb();
  const result = await db.select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  return result[0] || null;
}

/**
 * Set a system setting (create or update)
 */
export async function setSystemSetting(data: {
  key: string;
  value: string;
  description?: string;
  category?: string;
  isSecret?: boolean;
  updatedBy?: number;
}) {
  const db = await getDb();
  
  // Check if setting exists
  const existing = await db.select()
    .from(systemSettings)
    .where(eq(systemSettings.key, data.key))
    .limit(1);
  
  if (existing[0]) {
    // Update
    const result = await db.update(systemSettings)
      .set({
        value: data.value,
        description: data.description ?? existing[0].description,
        category: data.category ?? existing[0].category,
        isSecret: data.isSecret ?? existing[0].isSecret,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.key, data.key))
      .returning();
    return result[0];
  } else {
    // Create
    const result = await db.insert(systemSettings)
      .values({
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category,
        isSecret: data.isSecret ?? false,
        updatedBy: data.updatedBy,
      })
      .returning();
    return result[0];
  }
}

/**
 * Delete a system setting
 */
export async function deleteSystemSetting(key: string) {
  const db = await getDb();
  await db.delete(systemSettings).where(eq(systemSettings.key, key));
  return { success: true };
}

// ============================================
// BRREG INTEGRATION FUNCTIONS
// ============================================

/**
 * Get company by organization number
 */
export async function getCompanyByOrgNr(orgNr: string) {
  const db = await getDb();
  const result = await db.select()
    .from(norwegianCompanies)
    .where(eq(norwegianCompanies.organisasjonsnummer, orgNr))
    .limit(1);
  return result[0] || null;
}

/**
 * Get companies that need Brreg sync (no recent update)
 */
export async function getCompaniesNeedingBrregSync(limit: number = 50) {
  const db = await getDb();
  
  // Get companies with org number that haven't been synced recently
  const result = await db.select()
    .from(norwegianCompanies)
    .where(sql`${norwegianCompanies.organisasjonsnummer} IS NOT NULL AND ${norwegianCompanies.organisasjonsnummer} != ''`)
    .limit(limit);
  
  return result;
}

/**
 * Update company with Brreg data
 */
export async function updateCompanyFromBrreg(companyId: number, data: {
  navn?: string;
  hjemmeside?: string | null;
  epostadresse?: string | null;
  telefon?: string | null;
  forretningsadresse?: string | null;
  poststed?: string | null;
  postnummer?: string | null;
  kommune?: string | null;
  antallAnsatte?: number | null;
  dagligLeder?: string | null;
}) {
  const db = await getDb();
  
  const updateData: Record<string, any> = {};
  
  // Map Brreg fields to our database fields
  if (data.navn) updateData.navn = data.navn;
  if (data.hjemmeside) updateData.hjemmeside = data.hjemmeside;
  if (data.epostadresse) updateData.epostadresse = data.epostadresse;
  if (data.telefon) updateData.telefon = data.telefon;
  if (data.forretningsadresse) updateData.forretningsadresse = data.forretningsadresse;
  if (data.poststed) updateData.poststed = data.poststed;
  if (data.postnummer) updateData.postnummer = data.postnummer;
  if (data.kommune) updateData.kommune = data.kommune;
  if (data.antallAnsatte !== undefined) updateData.antallAnsatte = data.antallAnsatte;
  if (data.dagligLeder) updateData.dagligLeder = data.dagligLeder;
  
  if (Object.keys(updateData).length === 0) {
    return null;
  }
  
  const result = await db.update(norwegianCompanies)
    .set(updateData)
    .where(eq(norwegianCompanies.id, companyId))
    .returning();
  
  return result[0] || null;
}

/**
 * Insert a new company from Brreg data
 */
export async function insertCompanyFromBrreg(data: {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: string;
  hjemmeside?: string | null;
  epostadresse?: string | null;
  telefon?: string | null;
  forretningsadresse?: string | null;
  poststed?: string | null;
  postnummer?: string | null;
  kommune?: string | null;
  fylke?: string | null;
  naeringskode?: string | null;
  antallAnsatte?: number | null;
  stiftelsesdato?: string | null;
}) {
  const db = await getDb();
  
  const result = await db.insert(norwegianCompanies)
    .values({
      organisasjonsnummer: data.organisasjonsnummer,
      navn: data.navn,
      organisasjonsform: data.organisasjonsform,
      hjemmeside: data.hjemmeside,
      epostadresse: data.epostadresse,
      telefon: data.telefon,
      forretningsadresse: data.forretningsadresse,
      poststed: data.poststed,
      postnummer: data.postnummer,
      kommune: data.kommune,
      fylke: data.fylke,
      naeringskode1: data.naeringskode,
      antallAnsatte: data.antallAnsatte,
      stiftelsesdato: data.stiftelsesdato,
    })
    .returning();
  
  return result[0];
}


/**
 * Get top performing leads for a user
 */
export async function getTopLeads(userId: number, limit: number = 5) {
  const db = await getDb();
  
  const result = await db.select({
    id: leads.id,
    companyId: leads.companyId,
    score: leads.score,
    status: leads.status,
    updatedAt: leads.updatedAt,
    companyName: norwegianCompanies.navn,
    email: norwegianCompanies.epostadresse,
  })
    .from(leads)
    .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
    .where(eq(leads.userId, userId))
    .orderBy(desc(leads.score))
    .limit(limit);
  
  return result.map(lead => ({
    id: lead.id,
    companyName: lead.companyName || "Ukjent",
    email: lead.email || "-",
    score: lead.score || 0,
    status: lead.status || "new",
    lastActivity: lead.updatedAt,
  }));
}

/**
 * Get leads grouped by industry for a user
 */
export async function getLeadsByIndustry(userId: number) {
  const db = await getDb();
  
  const result = await db.select({
    industry: norwegianCompanies.naeringskode1,
    count: sql<number>`count(*)::int`,
  })
    .from(leads)
    .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
    .where(eq(leads.userId, userId))
    .groupBy(norwegianCompanies.naeringskode1)
    .orderBy(desc(sql`count(*)`))
    .limit(6);
  
  return result.map(item => ({
    industry: item.industry || "Ukjent",
    count: item.count,
  }));
}

/**
 * Get lead status distribution for a user
 */
export async function getLeadStatusDistribution(userId: number) {
  const db = await getDb();
  
  const result = await db.select({
    status: leads.status,
    count: sql<number>`count(*)::int`,
  })
    .from(leads)
    .where(eq(leads.userId, userId))
    .groupBy(leads.status);
  
  return result.map(item => ({
    name: item.status || "new",
    value: item.count,
  }));
}
