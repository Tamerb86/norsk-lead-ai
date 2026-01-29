import { db, companies, enrichmentJobs, enrichmentQueue } from "../db";
import { eq, and, isNull, lt, sql } from "drizzle-orm";
import { researchCompany, generateLeadInsights } from "./aiInsights";
import { enrichCompanyData } from "./brregIntegration";

/**
 * Auto Enrichment Service
 * 
 * Automatically enriches company data in the background using:
 * 1. Brreg API for official Norwegian company data
 * 2. AI for missing data (email, phone, pain points, etc.)
 * 3. Web scraping for additional information
 */

export interface EnrichmentJobStatus {
  id: number;
  companyId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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

/**
 * Add companies to enrichment queue
 */
export async function queueCompaniesForEnrichment(
  companyIds: number[],
  priority: 'low' | 'normal' | 'high' = 'normal'
): Promise<number> {
  const priorityValue = { low: 1, normal: 5, high: 10 }[priority];
  
  const jobs = companyIds.map(companyId => ({
    companyId,
    status: 'pending' as const,
    priority: priorityValue,
    attempts: 0,
    createdAt: new Date(),
  }));

  const result = await db.insert(enrichmentQueue).values(jobs);
  return result.rowCount || 0;
}

/**
 * Process next enrichment job from queue
 */
export async function processNextEnrichmentJob(): Promise<boolean> {
  // Get next pending job with highest priority
  const [job] = await db
    .select()
    .from(enrichmentQueue)
    .where(
      and(
        eq(enrichmentQueue.status, 'pending'),
        lt(enrichmentQueue.attempts, 3) // Max 3 attempts
      )
    )
    .orderBy(enrichmentQueue.priority, enrichmentQueue.createdAt)
    .limit(1);

  if (!job) {
    return false; // No jobs to process
  }

  try {
    // Update status to processing
    await db
      .update(enrichmentQueue)
      .set({
        status: 'processing',
        startedAt: new Date(),
        attempts: job.attempts + 1,
      })
      .where(eq(enrichmentQueue.id, job.id));

    // Get company data
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, job.companyId));

    if (!company) {
      throw new Error(`Company ${job.companyId} not found`);
    }

    // Enrich company data
    const enrichedData = await enrichCompany(company);

    // Update company with enriched data
    await db
      .update(companies)
      .set({
        ...enrichedData,
        lastEnrichedAt: new Date(),
      })
      .where(eq(companies.id, job.companyId));

    // Mark job as completed
    await db
      .update(enrichmentQueue)
      .set({
        status: 'completed',
        completedAt: new Date(),
        enrichedFields: JSON.stringify(Object.keys(enrichedData)),
      })
      .where(eq(enrichmentQueue.id, job.id));

    return true;
  } catch (error) {
    // Mark job as failed
    await db
      .update(enrichmentQueue)
      .set({
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(enrichmentQueue.id, job.id));

    console.error(`Enrichment job ${job.id} failed:`, error);
    return false;
  }
}

/**
 * Enrich a single company
 */
async function enrichCompany(company: any): Promise<Partial<typeof company>> {
  const enriched: any = {};

  // 1. Enrich with Brreg if orgNr is available
  if (company.orgNr && !company.lastEnrichedAt) {
    try {
      const brregData = await enrichCompanyData(company.orgNr);
      Object.assign(enriched, brregData);
    } catch (error) {
      console.error(`Brreg enrichment failed for ${company.orgNr}:`, error);
    }
  }

  // 2. Use AI to fill missing data
  const missingFields: string[] = [];
  
  if (!company.email) missingFields.push('email');
  if (!company.phone) missingFields.push('phone');
  if (!company.website) missingFields.push('website');
  if (!company.linkedin) missingFields.push('linkedin');
  if (!company.painPoints) missingFields.push('painPoints');

  if (missingFields.length > 0) {
    try {
      const aiData = await researchCompany({
        companyName: company.name,
        industry: company.industry || company.naeringskodeBeskrivelse,
        website: company.website || enriched.website,
        orgNr: company.orgNr,
      });

      // Map AI data to company fields
      if (aiData.email && !company.email) enriched.email = aiData.email;
      if (aiData.phone && !company.phone) enriched.phone = aiData.phone;
      if (aiData.website && !company.website) enriched.website = aiData.website;
      if (aiData.linkedin && !company.linkedin) enriched.linkedin = aiData.linkedin;
      if (aiData.painPoints) enriched.painPoints = JSON.stringify(aiData.painPoints);
      if (aiData.keyContacts) enriched.keyContacts = JSON.stringify(aiData.keyContacts);
    } catch (error) {
      console.error(`AI enrichment failed for ${company.name}:`, error);
    }
  }

  // 3. Generate lead insights if not exists
  if (!company.leadInsights) {
    try {
      const insights = await generateLeadInsights({
        companyName: company.name,
        industry: company.industry || enriched.industry,
        size: company.employees || enriched.employees,
        website: company.website || enriched.website,
        recentActivity: company.recentActivity,
      });

      enriched.leadInsights = JSON.stringify(insights);
    } catch (error) {
      console.error(`Lead insights generation failed for ${company.name}:`, error);
    }
  }

  return enriched;
}

/**
 * Get enrichment statistics
 */
export async function getEnrichmentStats(): Promise<EnrichmentStats> {
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
    total: Number(stats.total) || 0,
    pending: Number(stats.pending) || 0,
    processing: Number(stats.processing) || 0,
    completed: Number(stats.completed) || 0,
    failed: Number(stats.failed) || 0,
    averageTime: Number(stats.averageTime) || 0,
  };
}

/**
 * Get enrichment job status
 */
export async function getEnrichmentJobStatus(jobId: number): Promise<EnrichmentJobStatus | null> {
  const [job] = await db
    .select()
    .from(enrichmentQueue)
    .where(eq(enrichmentQueue.id, jobId));

  if (!job) return null;

  return {
    id: job.id,
    companyId: job.companyId,
    status: job.status,
    progress: job.status === 'completed' ? 100 : job.status === 'processing' ? 50 : 0,
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
  const result = await db
    .update(enrichmentQueue)
    .set({
      status: 'pending',
      attempts: 0,
      error: null,
    })
    .where(eq(enrichmentQueue.status, 'failed'));

  return result.rowCount || 0;
}

/**
 * Clear completed enrichment jobs older than X days
 */
export async function clearOldJobs(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db
    .delete(enrichmentQueue)
    .where(
      and(
        eq(enrichmentQueue.status, 'completed'),
        lt(enrichmentQueue.completedAt, cutoffDate)
      )
    );

  return result.rowCount || 0;
}

/**
 * Auto-enrich all companies without enrichment
 */
export async function autoEnrichAllCompanies(): Promise<number> {
  // Find companies that haven't been enriched yet
  const unenrichedCompanies = await db
    .select({ id: companies.id })
    .from(companies)
    .where(isNull(companies.lastEnrichedAt))
    .limit(1000); // Process in batches

  const companyIds = unenrichedCompanies.map(c => c.id);
  
  if (companyIds.length === 0) {
    return 0;
  }

  return await queueCompaniesForEnrichment(companyIds, 'normal');
}

/**
 * Background worker - process enrichment queue
 * Call this function periodically (e.g., every minute)
 */
export async function enrichmentWorker(): Promise<void> {
  console.log('[Enrichment Worker] Starting...');
  
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
