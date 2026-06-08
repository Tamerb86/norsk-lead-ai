import { eq, and, or, like, ilike, desc, asc, sql, inArray, gte, lte } from "drizzle-orm";
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
  InsertSystemSetting,
  notifications,
  calendarEvents
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
        // Connection pool optimization
        max: 20, // Maximum number of connections in the pool
        min: 2, // Minimum number of connections to keep open
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 10000, // Timeout for acquiring a connection
        maxUses: 7500, // Close connection after 7500 queries (prevents memory leaks)
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

  // Determine sort order (NULLS LAST so empty values don't dominate the top)
  let orderByClause;
  const dir = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

  switch (params.sortBy) {
    case 'name':
      orderByClause = sql`${norwegianCompanies.navn} ${sql.raw(dir)} NULLS LAST`;
      break;
    case 'age':
      // Company age: "desc" (most age) = oldest = earliest founding date (ASC).
      orderByClause = sql`${norwegianCompanies.stiftelsesdato} ${sql.raw(dir === 'DESC' ? 'ASC' : 'DESC')} NULLS LAST`;
      break;
    case 'founded':
      orderByClause = sql`${norwegianCompanies.stiftelsesdato} ${sql.raw(dir)} NULLS LAST`;
      break;
    case 'recent':
      orderByClause = sql`${norwegianCompanies.registreringsdato} ${sql.raw(dir)} NULLS LAST`;
      break;
    case 'revenue': // No revenue column in the dataset — fall back to employee count.
    case 'employees':
    default:
      orderByClause = sql`${norwegianCompanies.antallAnsatte} ${sql.raw(dir)} NULLS LAST`;
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
    .returning({ id: campaigns.id });

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

  const [inserted] = await db.insert(leads).values({
    ...data,
    trackingId,
    status: "pending",
    openCount: 0,
    clickCount: 0,
    followUpCount: 0,
  }).returning({ id: leads.id });

  return { id: inserted?.id, trackingId };
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
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return rows.length;
}

export async function markNotificationAsRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

  return { success: true };
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));

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


// ============================================
// CALENDAR FUNCTIONS
// ============================================

/**
 * Get calendar events for a user
 */
export async function getCalendarEvents(userId: number, params?: {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  status?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(calendarEvents.userId, userId)];
  if (params?.startDate) conditions.push(gte(calendarEvents.startTime, params.startDate));
  if (params?.endDate) conditions.push(lte(calendarEvents.startTime, params.endDate));
  if (params?.eventType) conditions.push(eq(calendarEvents.eventType, params.eventType));
  if (params?.status) conditions.push(eq(calendarEvents.status, params.status));

  return await db
    .select()
    .from(calendarEvents)
    .where(and(...conditions))
    .orderBy(asc(calendarEvents.startTime));
}

/**
 * Get single calendar event
 */
export async function getCalendarEvent(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(
    sql`SELECT ce.*, 
               nc.navn as company_name,
               l.email as lead_email,
               c.name as campaign_name
        FROM calendar_events ce
        LEFT JOIN norwegian_companies nc ON ce.company_id = nc.id
        LEFT JOIN leads l ON ce.lead_id = l.id
        LEFT JOIN campaigns c ON ce.campaign_id = c.id
        WHERE ce.id = ${eventId} AND ce.user_id = ${userId}`
  );

  return result.rows?.[0] || null;
}

/**
 * Create calendar event
 */
export async function createCalendarEvent(data: {
  userId: number;
  title: string;
  description?: string;
  eventType: string;
  startTime: Date;
  endTime?: Date;
  allDay?: boolean;
  location?: string;
  companyId?: number;
  leadId?: number;
  campaignId?: number;
  reminderMinutes?: number;
  isRecurring?: boolean;
  recurrenceRule?: string;
  color?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(
    sql`INSERT INTO calendar_events (
          user_id, title, description, event_type, start_time, end_time,
          all_day, location, company_id, lead_id, campaign_id,
          reminder_minutes, is_recurring, recurrence_rule, color, notes,
          status, "createdAt", "updatedAt"
        ) VALUES (
          ${data.userId}, ${data.title}, ${data.description || null}, ${data.eventType},
          ${data.startTime}, ${data.endTime || null}, ${data.allDay || false},
          ${data.location || null}, ${data.companyId || null}, ${data.leadId || null},
          ${data.campaignId || null}, ${data.reminderMinutes || 30},
          ${data.isRecurring || false}, ${data.recurrenceRule || null},
          ${data.color || '#6366f1'}, ${data.notes || null},
          'scheduled', NOW(), NOW()
        ) RETURNING *`
  );

  return result.rows?.[0];
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(eventId: number, userId: number, data: {
  title?: string;
  description?: string;
  eventType?: string;
  startTime?: Date;
  endTime?: Date;
  allDay?: boolean;
  location?: string;
  companyId?: number;
  leadId?: number;
  campaignId?: number;
  status?: string;
  reminderMinutes?: number;
  color?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) updates.push(`title = $${values.push(data.title)}`);
  if (data.description !== undefined) updates.push(`description = $${values.push(data.description)}`);
  if (data.eventType !== undefined) updates.push(`event_type = $${values.push(data.eventType)}`);
  if (data.startTime !== undefined) updates.push(`start_time = $${values.push(data.startTime)}`);
  if (data.endTime !== undefined) updates.push(`end_time = $${values.push(data.endTime)}`);
  if (data.allDay !== undefined) updates.push(`all_day = $${values.push(data.allDay)}`);
  if (data.location !== undefined) updates.push(`location = $${values.push(data.location)}`);
  if (data.companyId !== undefined) updates.push(`company_id = $${values.push(data.companyId)}`);
  if (data.leadId !== undefined) updates.push(`lead_id = $${values.push(data.leadId)}`);
  if (data.campaignId !== undefined) updates.push(`campaign_id = $${values.push(data.campaignId)}`);
  if (data.status !== undefined) updates.push(`status = $${values.push(data.status)}`);
  if (data.reminderMinutes !== undefined) updates.push(`reminder_minutes = $${values.push(data.reminderMinutes)}`);
  if (data.color !== undefined) updates.push(`color = $${values.push(data.color)}`);
  if (data.notes !== undefined) updates.push(`notes = $${values.push(data.notes)}`);

  if (updates.length === 0) return { success: true };

  await db.execute(
    sql`UPDATE calendar_events 
        SET ${sql.raw(updates.join(', '))}, "updatedAt" = NOW()
        WHERE id = ${eventId} AND user_id = ${userId}`
  );

  return { success: true };
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`DELETE FROM calendar_events WHERE id = ${eventId} AND user_id = ${userId}`
  );

  return { success: true };
}

/**
 * Get upcoming events for reminders
 */
export async function getUpcomingEventsForReminders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(
    sql`SELECT ce.*, u.email as user_email, u.name as user_name
        FROM calendar_events ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.status = 'scheduled'
        AND ce.reminder_sent = false
        AND ce.start_time <= NOW() + (ce.reminder_minutes || 30) * INTERVAL '1 minute'
        AND ce.start_time > NOW()`
  );

  return result.rows || [];
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE calendar_events SET reminder_sent = true WHERE id = ${eventId}`
  );

  return { success: true };
}

/**
 * Get events count by type for dashboard
 */
export async function getEventsCountByType(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(
    sql`SELECT event_type, COUNT(*) as count
        FROM calendar_events
        WHERE user_id = ${userId}
        AND start_time >= NOW()
        AND status = 'scheduled'
        GROUP BY event_type`
  );

  return result.rows || [];
}


/**
 * Update user's two-factor authentication settings
 */
export async function updateUserTwoFactor(
  openId: string,
  data: {
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string | null;
    twoFactorBackupCodes?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const setClauses: string[] = [];
  
  if (data.twoFactorEnabled !== undefined) {
    setClauses.push(`two_factor_enabled = ${data.twoFactorEnabled}`);
  }
  if (data.twoFactorSecret !== undefined) {
    if (data.twoFactorSecret === null) {
      setClauses.push(`two_factor_secret = NULL`);
    } else {
      setClauses.push(`two_factor_secret = '${data.twoFactorSecret.replace(/'/g, "''")}'`);
    }
  }
  if (data.twoFactorBackupCodes !== undefined) {
    if (data.twoFactorBackupCodes === null) {
      setClauses.push(`two_factor_backup_codes = NULL`);
    } else {
      setClauses.push(`two_factor_backup_codes = '${data.twoFactorBackupCodes.replace(/'/g, "''")}'`);
    }
  }
  
  if (setClauses.length === 0) return;
  
  setClauses.push(`"updatedAt" = NOW()`);
  
  await db.execute(
    sql`UPDATE users SET ${sql.raw(setClauses.join(", "))} WHERE "openId" = ${openId}`
  );
}


// ============ Activity Log Functions ============

export interface CreateActivityLogData {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  details?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createActivityLog(data: CreateActivityLogData) {
  const db = await getDb();
  const result = await db.execute(sql`
    INSERT INTO activity_logs (
      user_id, action, entity_type, entity_id, entity_name,
      details, old_values, new_values, ip_address, user_agent
    ) VALUES (
      ${data.userId},
      ${data.action},
      ${data.entityType},
      ${data.entityId || null},
      ${data.entityName || null},
      ${data.details ? JSON.stringify(data.details) : null},
      ${data.oldValues ? JSON.stringify(data.oldValues) : null},
      ${data.newValues ? JSON.stringify(data.newValues) : null},
      ${data.ipAddress || null},
      ${data.userAgent || null}
    )
    RETURNING *
  `);
  return result.rows[0];
}

export async function getActivityLogs(options: {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  const conditions: string[] = [];
  
  if (options.userId) {
    conditions.push(`al.user_id = ${options.userId}`);
  }
  if (options.entityType) {
    conditions.push(`al.entity_type = '${options.entityType}'`);
  }
  if (options.entityId) {
    conditions.push(`al.entity_id = ${options.entityId}`);
  }
  if (options.action) {
    conditions.push(`al.action = '${options.action}'`);
  }
  if (options.startDate) {
    conditions.push(`al."createdAt" >= '${options.startDate.toISOString()}'`);
  }
  if (options.endDate) {
    conditions.push(`al."createdAt" <= '${options.endDate.toISOString()}'`);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  const result = await db.execute(sql`
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${sql.raw(whereClause)}
    ORDER BY al."createdAt" DESC
    LIMIT ${limit} OFFSET ${offset}
  `);
  
  return result.rows;
}

export async function getActivityLogStats(userId?: number, days: number = 30) {
  const db = await getDb();
  const userCondition = userId ? `WHERE user_id = ${userId}` : "";
  
  const result = await db.execute(sql`
    SELECT 
      action,
      entity_type,
      COUNT(*) as count
    FROM activity_logs
    ${sql.raw(userCondition)}
    ${sql.raw(userCondition ? "AND" : "WHERE")} "createdAt" >= NOW() - INTERVAL '${sql.raw(String(days))} days'
    GROUP BY action, entity_type
    ORDER BY count DESC
  `);
  
  return result.rows;
}


// ============= Referral Functions =============

export async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getOrCreateReferralStats(userId: number) {
  const db = await getDb();
  
  // Check if stats exist
  const existing = await db.execute(sql`
    SELECT * FROM referral_stats WHERE user_id = ${userId}
  `);
  
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  
  // Create new stats with unique code
  const code = await generateReferralCode();
  const result = await db.execute(sql`
    INSERT INTO referral_stats (user_id, referral_code, total_invites, total_signups, total_conversions, total_rewards_earned, pending_rewards)
    VALUES (${userId}, ${code}, 0, 0, 0, 0, 0)
    RETURNING *
  `);
  
  return result.rows[0];
}

export async function getReferralStats(userId: number) {
  const db = await getDb();
  const result = await db.execute(sql`
    SELECT * FROM referral_stats WHERE user_id = ${userId}
  `);
  return result.rows[0] || null;
}

export async function getReferralsByUser(userId: number) {
  const db = await getDb();
  const result = await db.execute(sql`
    SELECT r.*, u.name as referred_name, u.email as referred_user_email
    FROM referrals r
    LEFT JOIN users u ON r.referred_id = u.id
    WHERE r.referrer_id = ${userId}
    ORDER BY r."createdAt" DESC
  `);
  return result.rows;
}

export async function createReferralInvite(referrerId: number, email: string) {
  const db = await getDb();
  const code = await generateReferralCode();
  
  const result = await db.execute(sql`
    INSERT INTO referrals (referrer_id, referral_code, referred_email, status)
    VALUES (${referrerId}, ${code}, ${email}, 'pending')
    RETURNING *
  `);
  
  // Update stats
  await db.execute(sql`
    UPDATE referral_stats 
    SET total_invites = total_invites + 1, "updatedAt" = NOW()
    WHERE user_id = ${referrerId}
  `);
  
  return result.rows[0];
}

export async function findReferralByCode(code: string) {
  const db = await getDb();
  const result = await db.execute(sql`
    SELECT * FROM referral_stats WHERE referral_code = ${code}
  `);
  return result.rows[0] || null;
}

export async function processReferralSignup(referralCode: string, newUserId: number, newUserEmail: string) {
  const db = await getDb();
  
  // Find the referral stats by code
  const statsResult = await db.execute(sql`
    SELECT * FROM referral_stats WHERE referral_code = ${referralCode}
  `);
  
  if (statsResult.rows.length === 0) return null;
  
  const stats = statsResult.rows[0] as any;
  
  // Create referral record
  await db.execute(sql`
    INSERT INTO referrals (referrer_id, referred_id, referral_code, referred_email, status, signed_up_at, reward_type, reward_amount)
    VALUES (${stats.user_id}, ${newUserId}, ${referralCode}, ${newUserEmail}, 'signed_up', NOW(), 'credits', 100)
  `);
  
  // Update stats
  await db.execute(sql`
    UPDATE referral_stats 
    SET total_signups = total_signups + 1, pending_rewards = pending_rewards + 100, "updatedAt" = NOW()
    WHERE user_id = ${stats.user_id}
  `);
  
  return stats;
}

export async function claimReferralReward(userId: number, referralId: number) {
  const db = await getDb();
  
  // Get the referral
  const refResult = await db.execute(sql`
    SELECT * FROM referrals WHERE id = ${referralId} AND referrer_id = ${userId} AND reward_claimed = false
  `);
  
  if (refResult.rows.length === 0) return null;
  
  const referral = refResult.rows[0] as any;
  
  // Mark as claimed
  await db.execute(sql`
    UPDATE referrals 
    SET reward_claimed = true, rewarded_at = NOW()
    WHERE id = ${referralId}
  `);
  
  // Update stats
  await db.execute(sql`
    UPDATE referral_stats 
    SET total_rewards_earned = total_rewards_earned + ${referral.reward_amount || 0},
        pending_rewards = pending_rewards - ${referral.reward_amount || 0},
        "updatedAt" = NOW()
    WHERE user_id = ${userId}
  `);
  
  return referral;
}


// ============================================
// A/B TESTING FUNCTIONS
// ============================================

export async function createAbTest(data: {
  campaignId: number;
  userId: number;
  name: string;
  testType: string;
  sampleSize: number;
  winningCriteria: string;
  autoSelectWinner: boolean;
  testDurationHours: number;
  variantA: { subject?: string; body?: string; senderName?: string; senderEmail?: string };
  variantB: { subject?: string; body?: string; senderName?: string; senderEmail?: string };
}) {
  const db = await getDb();
  
  // Create the test
  const testResult = await db.execute(sql`
    INSERT INTO ab_tests (campaign_id, user_id, name, test_type, sample_size, winning_criteria, auto_select_winner, test_duration_hours, status)
    VALUES (${data.campaignId}, ${data.userId}, ${data.name}, ${data.testType}, ${data.sampleSize}, ${data.winningCriteria}, ${data.autoSelectWinner}, ${data.testDurationHours}, 'draft')
    RETURNING id
  `);
  
  const testId = (testResult.rows[0] as any).id;
  
  // Create variant A
  await db.execute(sql`
    INSERT INTO ab_test_variants (test_id, variant_id, subject, body, sender_name, sender_email)
    VALUES (${testId}, 'A', ${data.variantA.subject || null}, ${data.variantA.body || null}, ${data.variantA.senderName || null}, ${data.variantA.senderEmail || null})
  `);
  
  // Create variant B
  await db.execute(sql`
    INSERT INTO ab_test_variants (test_id, variant_id, subject, body, sender_name, sender_email)
    VALUES (${testId}, 'B', ${data.variantB.subject || null}, ${data.variantB.body || null}, ${data.variantB.senderName || null}, ${data.variantB.senderEmail || null})
  `);
  
  return { id: testId };
}

export async function getAbTests(userId: number) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    SELECT t.*, c.name as campaign_name
    FROM ab_tests t
    LEFT JOIN campaigns c ON t.campaign_id = c.id
    WHERE t.user_id = ${userId}
    ORDER BY t.created_at DESC
  `);
  
  return result.rows || [];
}

export async function getAbTestById(testId: number, userId: number) {
  const db = await getDb();
  
  const testResult = await db.execute(sql`
    SELECT t.*, c.name as campaign_name
    FROM ab_tests t
    LEFT JOIN campaigns c ON t.campaign_id = c.id
    WHERE t.id = ${testId} AND t.user_id = ${userId}
  `);
  
  if (testResult.rows.length === 0) return null;
  
  const variantsResult = await db.execute(sql`
    SELECT * FROM ab_test_variants WHERE test_id = ${testId}
  `);
  
  return {
    ...testResult.rows[0],
    variants: variantsResult.rows || [],
  };
}

export async function startAbTest(testId: number, userId: number) {
  const db = await getDb();
  
  await db.execute(sql`
    UPDATE ab_tests 
    SET status = 'running', started_at = NOW(), "updatedAt" = NOW()
    WHERE id = ${testId} AND user_id = ${userId}
  `);
  
  return { success: true };
}

export async function updateAbTestVariantStats(testId: number, variantId: string, stats: {
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  repliedCount?: number;
  bouncedCount?: number;
}) {
  const db = await getDb();
  
  const updates: string[] = [];
  if (stats.sentCount !== undefined) updates.push(`sent_count = sent_count + ${stats.sentCount}`);
  if (stats.deliveredCount !== undefined) updates.push(`delivered_count = delivered_count + ${stats.deliveredCount}`);
  if (stats.openedCount !== undefined) updates.push(`opened_count = opened_count + ${stats.openedCount}`);
  if (stats.clickedCount !== undefined) updates.push(`clicked_count = clicked_count + ${stats.clickedCount}`);
  if (stats.repliedCount !== undefined) updates.push(`replied_count = replied_count + ${stats.repliedCount}`);
  if (stats.bouncedCount !== undefined) updates.push(`bounced_count = bounced_count + ${stats.bouncedCount}`);
  
  if (updates.length > 0) {
    await db.execute(sql.raw(`
      UPDATE ab_test_variants 
      SET ${updates.join(', ')}, 
          open_rate = CASE WHEN delivered_count > 0 THEN (opened_count::float / delivered_count) * 100 ELSE 0 END,
          click_rate = CASE WHEN delivered_count > 0 THEN (clicked_count::float / delivered_count) * 100 ELSE 0 END,
          reply_rate = CASE WHEN delivered_count > 0 THEN (replied_count::float / delivered_count) * 100 ELSE 0 END,
          "updatedAt" = NOW()
      WHERE test_id = ${testId} AND variant_id = '${variantId}'
    `));
  }
  
  return { success: true };
}

export async function selectAbTestWinner(testId: number, userId: number, winnerId: string) {
  const db = await getDb();
  
  await db.execute(sql`
    UPDATE ab_tests 
    SET winner_id = ${winnerId}, winner_selected_at = NOW(), status = 'completed', completed_at = NOW(), "updatedAt" = NOW()
    WHERE id = ${testId} AND user_id = ${userId}
  `);
  
  return { success: true };
}

// ============================================
// LEAD SCORING FUNCTIONS
// ============================================

export async function getOrCreateLeadScore(leadId: number, companyId: number, userId: number) {
  const db = await getDb();
  
  // Check if score exists
  const existing = await db.execute(sql`
    SELECT * FROM lead_scores WHERE lead_id = ${leadId}
  `);
  
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  
  // Create new score
  await db.execute(sql`
    INSERT INTO lead_scores (lead_id, company_id, user_id, total_score, engagement_score, company_score, behavior_score, tier)
    VALUES (${leadId}, ${companyId}, ${userId}, 0, 0, 0, 0, 'cold')
  `);
  
  const result = await db.execute(sql`
    SELECT * FROM lead_scores WHERE lead_id = ${leadId}
  `);
  
  return result.rows[0];
}

export async function updateLeadScore(leadId: number, scoreChange: number, reason: string, ruleId?: number) {
  const db = await getDb();
  
  // Get current score
  const current = await db.execute(sql`
    SELECT * FROM lead_scores WHERE lead_id = ${leadId}
  `);
  
  if (current.rows.length === 0) return null;
  
  const currentScore = current.rows[0] as any;
  const newScore = Math.max(0, currentScore.total_score + scoreChange);
  
  // Determine tier based on score
  let tier = 'cold';
  if (newScore >= 80) tier = 'very_hot';
  else if (newScore >= 50) tier = 'hot';
  else if (newScore >= 25) tier = 'warm';
  
  // Update score
  await db.execute(sql`
    UPDATE lead_scores 
    SET total_score = ${newScore}, 
        engagement_score = engagement_score + ${scoreChange > 0 ? scoreChange : 0},
        tier = ${tier},
        last_engagement_at = NOW(),
        last_score_update = NOW(),
        "updatedAt" = NOW()
    WHERE lead_id = ${leadId}
  `);
  
  // Record history
  await db.execute(sql`
    INSERT INTO score_history (lead_score_id, previous_score, new_score, change_reason, rule_id)
    VALUES (${currentScore.id}, ${currentScore.total_score}, ${newScore}, ${reason}, ${ruleId || null})
  `);
  
  return { previousScore: currentScore.total_score, newScore, tier };
}

export async function getLeadScores(userId: number, options?: { tier?: string; minScore?: number; limit?: number }) {
  const db = await getDb();
  
  let query = sql`
    SELECT ls.*, l.status as lead_status, c.navn as company_name
    FROM lead_scores ls
    LEFT JOIN leads l ON ls.lead_id = l.id
    LEFT JOIN norwegian_companies c ON ls.company_id = c.id
    WHERE ls.user_id = ${userId}
  `;
  
  if (options?.tier) {
    query = sql`${query} AND ls.tier = ${options.tier}`;
  }
  
  if (options?.minScore) {
    query = sql`${query} AND ls.total_score >= ${options.minScore}`;
  }
  
  query = sql`${query} ORDER BY ls.total_score DESC`;
  
  if (options?.limit) {
    query = sql`${query} LIMIT ${options.limit}`;
  }
  
  const result = await db.execute(query);
  return result.rows || [];
}

export async function getScoringRules(userId: number) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    SELECT * FROM scoring_rules WHERE user_id = ${userId} ORDER BY priority DESC, created_at DESC
  `);
  
  return result.rows || [];
}

export async function createScoringRule(data: {
  userId: number;
  name: string;
  description?: string;
  ruleType: string;
  condition: string;
  operator: string;
  value: string;
  scoreChange: number;
  priority?: number;
}) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    INSERT INTO scoring_rules (user_id, name, description, rule_type, condition, operator, value, score_change, priority)
    VALUES (${data.userId}, ${data.name}, ${data.description || null}, ${data.ruleType}, ${data.condition}, ${data.operator}, ${data.value}, ${data.scoreChange}, ${data.priority || 0})
    RETURNING id
  `);
  
  return { id: (result.rows[0] as any).id };
}

export async function updateScoringRule(ruleId: number, userId: number, data: Partial<{
  name: string;
  description: string;
  isActive: boolean;
  condition: string;
  operator: string;
  value: string;
  scoreChange: number;
  priority: number;
}>) {
  const db = await getDb();
  
  const updates: string[] = [];
  if (data.name !== undefined) updates.push(`name = '${data.name}'`);
  if (data.description !== undefined) updates.push(`description = '${data.description}'`);
  if (data.isActive !== undefined) updates.push(`is_active = ${data.isActive}`);
  if (data.condition !== undefined) updates.push(`condition = '${data.condition}'`);
  if (data.operator !== undefined) updates.push(`operator = '${data.operator}'`);
  if (data.value !== undefined) updates.push(`value = '${data.value}'`);
  if (data.scoreChange !== undefined) updates.push(`score_change = ${data.scoreChange}`);
  if (data.priority !== undefined) updates.push(`priority = ${data.priority}`);
  
  if (updates.length > 0) {
    await db.execute(sql.raw(`
      UPDATE scoring_rules 
      SET ${updates.join(', ')}, "updatedAt" = NOW()
      WHERE id = ${ruleId} AND user_id = ${userId}
    `));
  }
  
  return { success: true };
}

export async function deleteScoringRule(ruleId: number, userId: number) {
  const db = await getDb();
  
  await db.execute(sql`
    DELETE FROM scoring_rules WHERE id = ${ruleId} AND user_id = ${userId}
  `);
  
  return { success: true };
}

// ============================================
// WEBHOOKS FUNCTIONS
// ============================================

export async function createWebhook(data: {
  userId: number;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  customHeaders?: Record<string, string>;
}) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    INSERT INTO webhooks (user_id, name, url, secret, events, custom_headers)
    VALUES (${data.userId}, ${data.name}, ${data.url}, ${data.secret || null}, ${JSON.stringify(data.events)}, ${data.customHeaders ? JSON.stringify(data.customHeaders) : null})
    RETURNING id
  `);
  
  return { id: (result.rows[0] as any).id };
}

export async function getWebhooks(userId: number) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    SELECT * FROM webhooks WHERE user_id = ${userId} ORDER BY created_at DESC
  `);
  
  return result.rows || [];
}

export async function getWebhookById(webhookId: number, userId: number) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    SELECT * FROM webhooks WHERE id = ${webhookId} AND user_id = ${userId}
  `);
  
  return result.rows[0] || null;
}

export async function updateWebhook(webhookId: number, userId: number, data: Partial<{
  name: string;
  url: string;
  secret: string;
  isActive: boolean;
  events: string[];
  customHeaders: Record<string, string>;
}>) {
  const db = await getDb();
  
  const updates: string[] = [];
  if (data.name !== undefined) updates.push(`name = '${data.name}'`);
  if (data.url !== undefined) updates.push(`url = '${data.url}'`);
  if (data.secret !== undefined) updates.push(`secret = '${data.secret}'`);
  if (data.isActive !== undefined) updates.push(`is_active = ${data.isActive}`);
  if (data.events !== undefined) updates.push(`events = '${JSON.stringify(data.events)}'`);
  if (data.customHeaders !== undefined) updates.push(`custom_headers = '${JSON.stringify(data.customHeaders)}'`);
  
  if (updates.length > 0) {
    await db.execute(sql.raw(`
      UPDATE webhooks 
      SET ${updates.join(', ')}, "updatedAt" = NOW()
      WHERE id = ${webhookId} AND user_id = ${userId}
    `));
  }
  
  return { success: true };
}

export async function deleteWebhook(webhookId: number, userId: number) {
  const db = await getDb();
  
  await db.execute(sql`
    DELETE FROM webhooks WHERE id = ${webhookId} AND user_id = ${userId}
  `);
  
  return { success: true };
}

export async function getActiveWebhooksForEvent(eventType: string) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    SELECT * FROM webhooks 
    WHERE is_active = true AND events::jsonb ? ${eventType}
  `);
  
  return result.rows || [];
}

export async function createWebhookDelivery(data: {
  webhookId: number;
  eventType: string;
  payload: any;
}) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status)
    VALUES (${data.webhookId}, ${data.eventType}, ${JSON.stringify(data.payload)}, 'pending')
    RETURNING id
  `);
  
  return { id: (result.rows[0] as any).id };
}

export async function updateWebhookDelivery(deliveryId: number, data: {
  status: string;
  responseStatus?: number;
  responseBody?: string;
  responseTime?: number;
  errorMessage?: string;
  attempts?: number;
  nextRetryAt?: Date;
}) {
  const db = await getDb();
  
  await db.execute(sql`
    UPDATE webhook_deliveries 
    SET status = ${data.status},
        response_status = ${data.responseStatus || null},
        response_body = ${data.responseBody || null},
        response_time = ${data.responseTime || null},
        error_message = ${data.errorMessage || null},
        attempts = COALESCE(${data.attempts}, attempts + 1),
        next_retry_at = ${data.nextRetryAt || null},
        delivered_at = CASE WHEN ${data.status} = 'success' THEN NOW() ELSE delivered_at END
    WHERE id = ${deliveryId}
  `);
  
  // Update webhook stats
  if (data.status === 'success' || data.status === 'failed') {
    await db.execute(sql`
      UPDATE webhooks 
      SET total_deliveries = total_deliveries + 1,
          successful_deliveries = successful_deliveries + CASE WHEN ${data.status} = 'success' THEN 1 ELSE 0 END,
          failed_deliveries = failed_deliveries + CASE WHEN ${data.status} = 'failed' THEN 1 ELSE 0 END,
          last_delivery_at = NOW(),
          last_delivery_status = ${data.status}
      WHERE id = (SELECT webhook_id FROM webhook_deliveries WHERE id = ${deliveryId})
    `);
  }
  
  return { success: true };
}

export async function getWebhookDeliveries(webhookId: number, userId: number, limit: number = 50) {
  const db = await getDb();
  
  const result = await db.execute(sql`
    SELECT d.* 
    FROM webhook_deliveries d
    JOIN webhooks w ON d.webhook_id = w.id
    WHERE d.webhook_id = ${webhookId} AND w.user_id = ${userId}
    ORDER BY d.created_at DESC
    LIMIT ${limit}
  `);
  
  return result.rows || [];
}

// Webhook event dispatcher
export async function dispatchWebhookEvent(eventType: string, payload: any) {
  const webhooks = await getActiveWebhooksForEvent(eventType);
  
  for (const webhook of webhooks) {
    try {
      const delivery = await createWebhookDelivery({
        webhookId: (webhook as any).id,
        eventType,
        payload,
      });
      
      // Send webhook asynchronously
      sendWebhook((webhook as any), delivery.id, eventType, payload).catch(console.error);
    } catch (error) {
      console.error(`Failed to create webhook delivery for webhook ${(webhook as any).id}:`, error);
    }
  }
}

async function sendWebhook(webhook: any, deliveryId: number, eventType: string, payload: any) {
  const startTime = Date.now();
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': eventType,
      'X-Webhook-Delivery': String(deliveryId),
    };
    
    // Add custom headers
    if (webhook.custom_headers) {
      const customHeaders = typeof webhook.custom_headers === 'string' 
        ? JSON.parse(webhook.custom_headers) 
        : webhook.custom_headers;
      Object.assign(headers, customHeaders);
    }
    
    // Add signature if secret is set
    if (webhook.secret) {
      const crypto = await import('crypto');
      const signature = crypto.createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }
    
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    });
    
    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();
    
    await updateWebhookDelivery(deliveryId, {
      status: response.ok ? 'success' : 'failed',
      responseStatus: response.status,
      responseBody: responseBody.substring(0, 1000), // Limit response body
      responseTime,
      errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await updateWebhookDelivery(deliveryId, {
      status: 'failed',
      responseTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================
// Leads + saved-companies API used by the tRPC routers
// ============================================

export async function toggleSaveCompany(userId: number, companyId: number) {
  const isSaved = await checkCompanySaved(userId, companyId);
  if (isSaved) {
    await removeSavedCompany(userId, companyId);
    return { saved: false };
  }
  await saveCompany({ userId, companyId, listName: "default" });
  return { saved: true };
}

export async function getLeads(
  userId: number,
  campaignId?: number,
  status?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(leads.userId, userId)];
  if (campaignId !== undefined) conditions.push(eq(leads.campaignId, campaignId));
  if (status) conditions.push(eq(leads.status, status));

  return await db
    .select({
      lead: leads,
      company: norwegianCompanies,
    })
    .from(leads)
    .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt));
}

export async function getLeadById(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db
    .select({
      lead: leads,
      company: norwegianCompanies,
    })
    .from(leads)
    .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
    .where(and(eq(leads.id, id), eq(leads.userId, userId)))
    .limit(1);

  return row || null;
}

export async function createLead(data: {
  userId: number;
  campaignId?: number;
  companyId: number;
  status?: string;
  email?: string;
  name?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.campaignId === undefined) {
    throw new Error("campaignId is required to create a lead");
  }

  const { generateTrackingId } = await import("./emailTracking");
  const trackingId = generateTrackingId();

  const [row] = await db
    .insert(leads)
    .values({
      userId: data.userId,
      campaignId: data.campaignId,
      companyId: data.companyId,
      status: (data.status as any) || "pending",
      trackingId,
      openCount: 0,
      clickCount: 0,
      followUpCount: 0,
    })
    .returning();

  return row;
}

export async function bulkUpdateLeadStatus(
  ids: number[],
  userId: number,
  status: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (ids.length === 0) return { success: true, updated: 0 };

  const result = await db
    .update(leads)
    .set({ status: status as any, updatedAt: new Date() })
    .where(and(inArray(leads.id, ids), eq(leads.userId, userId)));

  return { success: true, updated: (result as any).rowCount || 0 };
}

export async function getLeadStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      sent: sql<number>`sum(case when status = 'sent' then 1 else 0 end)`,
      opened: sql<number>`sum(case when status = 'opened' then 1 else 0 end)`,
      clicked: sql<number>`sum(case when status = 'clicked' then 1 else 0 end)`,
      replied: sql<number>`sum(case when status = 'replied' then 1 else 0 end)`,
      bounced: sql<number>`sum(case when status = 'bounced' then 1 else 0 end)`,
    })
    .from(leads)
    .where(eq(leads.userId, userId));

  return {
    total: Number(stats?.total) || 0,
    pending: Number(stats?.pending) || 0,
    sent: Number(stats?.sent) || 0,
    opened: Number(stats?.opened) || 0,
    clicked: Number(stats?.clicked) || 0,
    replied: Number(stats?.replied) || 0,
    bounced: Number(stats?.bounced) || 0,
  };
}

// ============================================
// Team API used by the tRPC team router (delegates to teamDb)
// ============================================

export async function getTeamInfo(userId: number) {
  const user = await getUserById(userId);
  if (!user?.teamId) return null;

  const teamDb = await import("./teamDb");
  const team = await teamDb.getTeamById(user.teamId);
  if (!team) return null;

  const members = await teamDb.getTeamMembers(user.teamId);
  const invitations = await teamDb.getTeamInvitations(user.teamId);

  return {
    team,
    members: members.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      lastSignedIn: m.lastSignedIn,
    })),
    invitations,
  };
}

export async function inviteTeamMember(userId: number, email: string, role: string) {
  const user = await getUserById(userId);
  if (!user?.teamId) throw new Error("You are not part of a team");

  const allowedRoles = ["admin", "manager", "viewer"] as const;
  if (!allowedRoles.includes(role as any)) throw new Error("Invalid role");

  const teamDb = await import("./teamDb");
  const team = await teamDb.getTeamById(user.teamId);
  if (team?.ownerId !== userId && user.role !== "admin") {
    throw new Error("Only the team owner or an admin can invite members");
  }

  return await teamDb.createInvitation({
    teamId: user.teamId,
    email: email.toLowerCase(),
    role: role as (typeof allowedRoles)[number],
    invitedBy: userId,
  });
}

export async function removeTeamMember(userId: number, memberId: number) {
  const user = await getUserById(userId);
  if (!user?.teamId) throw new Error("You are not part of a team");

  const teamDb = await import("./teamDb");
  const team = await teamDb.getTeamById(user.teamId);
  if (team?.ownerId !== userId && user.role !== "admin") {
    throw new Error("Only the team owner or an admin can remove members");
  }
  if (memberId === team?.ownerId) {
    throw new Error("The team owner cannot be removed");
  }

  return await teamDb.removeMember(memberId, user.teamId);
}
