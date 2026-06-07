import { eq, and, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "../db";
import { norwegianCompanies, enrichmentQueue } from "../../drizzle/schema";
import { getBrregCompany, convertBrregToCompany } from "./brregIntegration";

/**
 * Auto Enrichment Service
 *
 * Automatically enriches company data in the background using the
 * official Brreg (Brønnøysundregistrene) API.
 */

export interface EnrichmentJobStatus {
  id: number;
  companyId: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  enrichedFields: string[];
}

export interface EnrichmentStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageTime: number; // in seconds
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

/**
 * Add companies to enrichment queue
 */
export async function queueCompaniesForEnrichment(
  companyIds: number[],
  priority: "low" | "normal" | "high" = "normal"
): Promise<number> {
  if (companyIds.length === 0) return 0;
  const db = await requireDb();
  const priorityValue = { low: 1, normal: 5, high: 10 }[priority];

  const jobs = companyIds.map(companyId => ({
    companyId,
    status: "pending" as const,
    priority: priorityValue,
    attempts: 0,
    createdAt: new Date(),
  }));

  const result = await db.insert(enrichmentQueue).values(jobs);
  return (result as any).rowCount ?? jobs.length;
}

/**
 * Process next enrichment job from queue
 */
export async function processNextEnrichmentJob(): Promise<boolean> {
  const db = await requireDb();

  const [job] = await db
    .select()
    .from(enrichmentQueue)
    .where(
      and(
        eq(enrichmentQueue.status, "pending"),
        lt(enrichmentQueue.attempts, 3) // Max 3 attempts
      )
    )
    .orderBy(enrichmentQueue.priority, enrichmentQueue.createdAt)
    .limit(1);

  if (!job) {
    return false; // No jobs to process
  }

  try {
    await db
      .update(enrichmentQueue)
      .set({
        status: "processing",
        startedAt: new Date(),
        attempts: job.attempts + 1,
      })
      .where(eq(enrichmentQueue.id, job.id));

    const [company] = await db
      .select()
      .from(norwegianCompanies)
      .where(eq(norwegianCompanies.id, job.companyId));

    if (!company) {
      throw new Error(`Company ${job.companyId} not found`);
    }

    const enrichedData = await enrichCompany(company);

    if (Object.keys(enrichedData).length > 0) {
      await db
        .update(norwegianCompanies)
        .set({
          ...enrichedData,
          updatedAt: new Date(),
        })
        .where(eq(norwegianCompanies.id, job.companyId));
    }

    await db
      .update(enrichmentQueue)
      .set({
        status: "completed",
        completedAt: new Date(),
        enrichedFields: JSON.stringify(Object.keys(enrichedData)),
      })
      .where(eq(enrichmentQueue.id, job.id));

    return true;
  } catch (error) {
    await db
      .update(enrichmentQueue)
      .set({
        status: "failed",
        completedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(enrichmentQueue.id, job.id));

    console.error(`Enrichment job ${job.id} failed:`, error);
    return false;
  }
}

type NorwegianCompany = typeof norwegianCompanies.$inferSelect;

/**
 * Enrich a single company from Brreg. Only fills fields that are missing.
 */
async function enrichCompany(
  company: NorwegianCompany
): Promise<Partial<NorwegianCompany>> {
  const enriched: Partial<NorwegianCompany> = {};

  if (!company.organisasjonsnummer) return enriched;

  const brreg = await getBrregCompany(company.organisasjonsnummer);
  if (!brreg) return enriched;

  const data = convertBrregToCompany(brreg);

  if (data.epostadresse && !company.epostadresse) enriched.epostadresse = data.epostadresse;
  if (data.telefon && !company.telefon) enriched.telefon = data.telefon;
  if (data.hjemmeside && !company.hjemmeside) enriched.hjemmeside = data.hjemmeside;
  if (data.forretningsadresse && !company.forretningsadresse) enriched.forretningsadresse = data.forretningsadresse;
  if (data.poststed && !company.poststed) enriched.poststed = data.poststed;
  if (data.postnummer && !company.postnummer) enriched.postnummer = data.postnummer;
  if (data.kommune && !company.kommune) enriched.kommune = data.kommune;
  if (data.fylke && !company.fylke) enriched.fylke = data.fylke;
  if (data.naeringskode && !company.naeringskode1) enriched.naeringskode1 = data.naeringskode;
  if (data.naeringsbeskrivelse && !company.naeringsbeskrivelse1) enriched.naeringsbeskrivelse1 = data.naeringsbeskrivelse;
  if (data.antallAnsatte != null && company.antallAnsatte == null) enriched.antallAnsatte = data.antallAnsatte;
  if (typeof data.konkurs === "boolean") enriched.konkurs = data.konkurs;
  if (typeof data.underAvvikling === "boolean") enriched.underAvvikling = data.underAvvikling;

  return enriched;
}

/**
 * Get enrichment statistics
 */
export async function getEnrichmentStats(): Promise<EnrichmentStats> {
  const db = await requireDb();
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      processing: sql<number>`sum(case when status = 'processing' then 1 else 0 end)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
      averageTime: sql<number>`avg(extract(epoch from (completed_at - started_at)))`,
    })
    .from(enrichmentQueue);

  return {
    total: Number(stats?.total) || 0,
    pending: Number(stats?.pending) || 0,
    processing: Number(stats?.processing) || 0,
    completed: Number(stats?.completed) || 0,
    failed: Number(stats?.failed) || 0,
    averageTime: Number(stats?.averageTime) || 0,
  };
}

/**
 * Get enrichment job status
 */
export async function getEnrichmentJobStatus(
  jobId: number
): Promise<EnrichmentJobStatus | null> {
  const db = await requireDb();
  const [job] = await db
    .select()
    .from(enrichmentQueue)
    .where(eq(enrichmentQueue.id, jobId));

  if (!job) return null;

  return {
    id: job.id,
    companyId: job.companyId,
    status: job.status,
    progress: job.status === "completed" ? 100 : job.status === "processing" ? 50 : 0,
    startedAt: job.startedAt || undefined,
    completedAt: job.completedAt || undefined,
    error: job.error || undefined,
    enrichedFields: job.enrichedFields ? JSON.parse(job.enrichedFields) : [],
  };
}

/**
 * Retry failed enrichment jobs
 */
export async function retryFailedJobs(): Promise<number> {
  const db = await requireDb();
  const result = await db
    .update(enrichmentQueue)
    .set({
      status: "pending",
      attempts: 0,
      error: null,
    })
    .where(eq(enrichmentQueue.status, "failed"));

  return (result as any).rowCount || 0;
}

/**
 * Clear completed enrichment jobs older than X days
 */
export async function clearOldJobs(daysOld: number = 30): Promise<number> {
  const db = await requireDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db
    .delete(enrichmentQueue)
    .where(
      and(
        eq(enrichmentQueue.status, "completed"),
        lt(enrichmentQueue.completedAt, cutoffDate)
      )
    );

  return (result as any).rowCount || 0;
}

/**
 * Auto-enrich companies that are missing contact info
 */
export async function autoEnrichAllCompanies(): Promise<number> {
  const db = await requireDb();
  const candidates = await db
    .select({ id: norwegianCompanies.id })
    .from(norwegianCompanies)
    .where(isNull(norwegianCompanies.epostadresse))
    .limit(1000); // Process in batches

  const companyIds = candidates.map(c => c.id);
  if (companyIds.length === 0) return 0;

  return await queueCompaniesForEnrichment(companyIds, "normal");
}

/**
 * Background worker - process enrichment queue
 * Call this function periodically (e.g., every minute)
 */
export async function enrichmentWorker(): Promise<void> {
  console.log("[Enrichment Worker] Starting...");

  let processed = 0;
  let hasMore = true;

  // Process up to 10 jobs per run
  while (hasMore && processed < 10) {
    hasMore = await processNextEnrichmentJob();
    if (hasMore) {
      processed++;
      // Small delay between jobs to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`[Enrichment Worker] Processed ${processed} jobs`);
}
