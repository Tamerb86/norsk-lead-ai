import { enrichmentWorker, autoEnrichAllCompanies, getEnrichmentStats } from "./autoEnrichment";

/**
 * Enrichment Scheduler
 * 
 * Manages background jobs for automatic company enrichment
 */

let workerInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Start the enrichment scheduler
 * Runs the worker every minute
 */
export function startEnrichmentScheduler(): void {
  if (isRunning) {
    console.log('[Enrichment Scheduler] Already running');
    return;
  }

  console.log('[Enrichment Scheduler] Starting...');
  isRunning = true;

  // Run immediately
  enrichmentWorker().catch(error => {
    console.error('[Enrichment Scheduler] Worker error:', error);
  });

  // Then run every minute
  workerInterval = setInterval(() => {
    enrichmentWorker().catch(error => {
      console.error('[Enrichment Scheduler] Worker error:', error);
    });
  }, 60 * 1000); // Every 1 minute

  console.log('[Enrichment Scheduler] Started successfully');
}

/**
 * Stop the enrichment scheduler
 */
export function stopEnrichmentScheduler(): void {
  if (!isRunning) {
    console.log('[Enrichment Scheduler] Not running');
    return;
  }

  console.log('[Enrichment Scheduler] Stopping...');
  
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }

  isRunning = false;
  console.log('[Enrichment Scheduler] Stopped');
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return isRunning;
}

/**
 * Auto-enrich scheduler
 * Runs daily to queue unenriched companies
 */
let autoEnrichInterval: NodeJS.Timeout | null = null;

export function startAutoEnrichScheduler(): void {
  console.log('[Auto-Enrich Scheduler] Starting...');

  // Run immediately
  autoEnrichAllCompanies().then(count => {
    console.log(`[Auto-Enrich Scheduler] Queued ${count} companies for enrichment`);
  }).catch(error => {
    console.error('[Auto-Enrich Scheduler] Error:', error);
  });

  // Then run every 24 hours
  autoEnrichInterval = setInterval(() => {
    autoEnrichAllCompanies().then(count => {
      console.log(`[Auto-Enrich Scheduler] Queued ${count} companies for enrichment`);
    }).catch(error => {
      console.error('[Auto-Enrich Scheduler] Error:', error);
    });
  }, 24 * 60 * 60 * 1000); // Every 24 hours

  console.log('[Auto-Enrich Scheduler] Started successfully');
}

export function stopAutoEnrichScheduler(): void {
  console.log('[Auto-Enrich Scheduler] Stopping...');
  
  if (autoEnrichInterval) {
    clearInterval(autoEnrichInterval);
    autoEnrichInterval = null;
  }

  console.log('[Auto-Enrich Scheduler] Stopped');
}

/**
 * Get scheduler status
 */
export async function getSchedulerStatus() {
  const stats = await getEnrichmentStats();
  
  return {
    workerRunning: isRunning,
    autoEnrichRunning: autoEnrichInterval !== null,
    stats,
  };
}

/**
 * Initialize all schedulers
 * Call this when the server starts
 */
export function initializeSchedulers(): void {
  console.log('[Schedulers] Initializing...');
  
  // Start enrichment worker
  startEnrichmentScheduler();
  
  // Start auto-enrich scheduler
  startAutoEnrichScheduler();
  
  console.log('[Schedulers] Initialized successfully');
}

/**
 * Shutdown all schedulers
 * Call this when the server stops
 */
export function shutdownSchedulers(): void {
  console.log('[Schedulers] Shutting down...');
  
  stopEnrichmentScheduler();
  stopAutoEnrichScheduler();
  
  console.log('[Schedulers] Shut down successfully');
}

// Handle process termination
process.on('SIGTERM', shutdownSchedulers);
process.on('SIGINT', shutdownSchedulers);
