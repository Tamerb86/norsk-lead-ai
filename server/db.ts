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
  activities,
  dataUpdateLogs,
  savedFilters
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

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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
    conditions.push(
      or(
        like(norwegianCompanies.navn, `%${params.query}%`),
        like(norwegianCompanies.organisasjonsnummer, `%${params.query}%`)
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
    conditions.push(like(norwegianCompanies.poststed, `%${params.poststed}%`));
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
    conditions.push(like(norwegianCompanies.organisasjonsform, `%${params.organisasjonsform}%`));
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
  });

  const insertId = (result as any).insertId;
  return { id: Number(insertId) };
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
 * User passwords table (stored separately for security)
 */
const userPasswordsCache = new Map<string, string>();

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] || null;
}

export async function setUserPassword(openId: string, passwordHash: string) {
  // In production, store in a separate passwords table
  // For now, we'll use a simple in-memory cache (not recommended for production)
  userPasswordsCache.set(openId, passwordHash);
  
  // TODO: Create a passwords table and store there
  // const db = await getDb();
  // await db.insert(userPasswords).values({ openId, passwordHash }).onDuplicateKeyUpdate({ set: { passwordHash } });
}

export async function getUserPassword(openId: string): Promise<string | null> {
  return userPasswordsCache.get(openId) || null;
}

export async function getAllUsers() {
  const db = await getDb();
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: 'admin' | 'manager' | 'viewer') {
  const db = await getDb();
  await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  await db.delete(users).where(eq(users.id, userId));
}

export async function getAdminStats() {
  const db = await getDb();
  
  const [userStats] = await db
    .select({
      totalUsers: sql<number>`count(*)`,
      adminCount: sql<number>`sum(case when role = 'admin' then 1 else 0 end)`,
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
      activeCampaigns: sql<number>`sum(case when status = 'sending' then 1 else 0 end)`,
    })
    .from(campaigns);

  const [leadStats] = await db
    .select({
      totalLeads: sql<number>`count(*)`,
    })
    .from(leads);

  return {
    users: userStats,
    companies: companyStats,
    campaigns: campaignStats,
    leads: leadStats,
  };
}
