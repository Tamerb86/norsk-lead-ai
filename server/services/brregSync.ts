/**
 * Brreg (Brønnøysundregistrene) data synchronization.
 *
 * Keeps the local norwegian_companies table fresh against the official
 * open-data API at https://data.brreg.no/enhetsregisteret/api
 *
 * Two modes:
 *  - syncBrregUpdates(): incremental — pulls only entities changed since the
 *    last run via the /oppdateringer/enheter feed (efficient, run daily).
 *  - Full refresh is intentionally chunked through the same upsert path.
 *
 * Note: the Enhetsregisteret open data does NOT include email addresses, so
 * email enrichment is handled separately; this sync refreshes name, org form,
 * website, phone, address, industry codes, employee count, founding date and
 * bankruptcy/dissolution status.
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { norwegianCompanies } from "../../drizzle/schema";
import { getBrregCompany, getBrregUpdates, convertBrregToCompany } from "./brregIntegration";
import { getSystemSetting, setSystemSetting } from "../db";

const LAST_SYNC_KEY = "brreg_last_sync";
const LAST_OPPID_KEY = "brreg_last_oppdateringsid";

function toDateOrNull(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Insert or update a single company from a Brreg entity payload.
 */
export async function upsertCompanyFromBrreg(brreg: any): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const c = convertBrregToCompany(brreg);

  const row = {
    organisasjonsnummer: c.organisasjonsnummer,
    navn: c.navn,
    organisasjonsform: c.organisasjonsform,
    naeringskode1: c.naeringskode,
    naeringsbeskrivelse1: c.naeringsbeskrivelse,
    antallAnsatte: c.antallAnsatte,
    forretningsadresse: c.forretningsadresse,
    poststed: c.poststed,
    postnummer: c.postnummer,
    kommune: c.kommune,
    fylke: c.fylke,
    epostadresse: c.epostadresse,
    telefon: c.telefon,
    hjemmeside: c.hjemmeside,
    stiftelsesdato: c.stiftelsesdato as any,
    konkurs: !!c.konkurs,
    underAvvikling: !!c.underAvvikling,
    updatedAt: new Date(),
  };

  await db
    .insert(norwegianCompanies)
    .values(row as any)
    .onConflictDoUpdate({
      target: norwegianCompanies.organisasjonsnummer,
      set: {
        navn: row.navn,
        organisasjonsform: row.organisasjonsform,
        naeringskode1: row.naeringskode1,
        naeringsbeskrivelse1: row.naeringsbeskrivelse1,
        antallAnsatte: row.antallAnsatte,
        forretningsadresse: row.forretningsadresse,
        poststed: row.poststed,
        postnummer: row.postnummer,
        kommune: row.kommune,
        fylke: row.fylke,
        // Only overwrite contact fields when Brreg actually has a value,
        // so we don't wipe data added by enrichment.
        ...(row.epostadresse ? { epostadresse: row.epostadresse } : {}),
        ...(row.telefon ? { telefon: row.telefon } : {}),
        ...(row.hjemmeside ? { hjemmeside: row.hjemmeside } : {}),
        konkurs: row.konkurs,
        underAvvikling: row.underAvvikling,
        updatedAt: row.updatedAt,
      },
    });
}

export interface BrregSyncResult {
  processed: number;
  updated: number;
  deletedFlagged: number;
  errors: number;
  fromDate: string;
  lastOppdateringsid: number | null;
  finishedAt: string;
}

/**
 * Incremental sync: fetch entities changed since the last run and upsert them.
 * @param opts.since  ISO date to start from (defaults to stored last-sync, then 24h ago)
 * @param opts.maxRecords  safety cap on how many changed entities to process in one run
 */
export async function syncBrregUpdates(opts: { since?: string; maxRecords?: number } = {}): Promise<BrregSyncResult> {
  const maxRecords = opts.maxRecords ?? 5000;

  let fromDate = opts.since;
  if (!fromDate) {
    const stored = await getSystemSetting(LAST_SYNC_KEY).catch(() => null);
    fromDate = stored?.value || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }

  const seen = new Set<string>();
  const deletions = new Set<string>();
  let lastOppId: number | null = null;
  let cursorDate = fromDate;
  const PAGE = 1000;

  // 1) Walk the date-anchored updates feed, advancing the cursor to the last
  //    timestamp of each batch until we exhaust changes or hit the safety cap.
  while (seen.size + deletions.size < maxRecords) {
    let resp: any;
    try {
      resp = await getBrregUpdates({ dato: cursorDate, size: PAGE });
    } catch (e) {
      break;
    }
    const items = resp?._embedded?.oppdaterteEnheter || [];
    if (items.length === 0) break;

    for (const it of items) {
      lastOppId = it.oppdateringsid ?? lastOppId;
      const orgnr = it.organisasjonsnummer;
      if (!orgnr) continue;
      if (it.endringstype === "Sletting" || it.endringstype === "Fjernet") {
        deletions.add(orgnr);
      } else {
        seen.add(orgnr);
      }
    }

    // Advance cursor 1ms past the last item's date to avoid re-fetching it.
    const lastDato = items[items.length - 1]?.dato;
    if (!lastDato) break;
    const next = new Date(new Date(lastDato).getTime() + 1).toISOString();
    if (next === cursorDate) break; // no progress
    cursorDate = next;

    if (items.length < PAGE) break; // last batch
  }

  // 2) Upsert each changed entity
  let processed = 0, updated = 0, errors = 0;
  for (const orgnr of seen) {
    try {
      const enhet = await getBrregCompany(orgnr);
      if (enhet) {
        await upsertCompanyFromBrreg(enhet);
        updated += 1;
      }
    } catch (e) {
      errors += 1;
    }
    processed += 1;
    // gentle pacing to respect the public API
    if (processed % 25 === 0) await new Promise(r => setTimeout(r, 250));
  }

  // 3) Flag deletions (mark as under dissolution rather than hard-deleting)
  let deletedFlagged = 0;
  const db = await getDb();
  if (db) {
    for (const orgnr of deletions) {
      try {
        await db.update(norwegianCompanies)
          .set({ underAvvikling: true, updatedAt: new Date() })
          .where(eq(norwegianCompanies.organisasjonsnummer, orgnr));
        deletedFlagged += 1;
      } catch { /* ignore */ }
    }
  }

  // 4) Persist progress
  const finishedAt = new Date().toISOString();
  await setSystemSetting({ key: LAST_SYNC_KEY, value: finishedAt, category: "brreg", description: "Last Brreg sync timestamp" }).catch(() => {});
  if (lastOppId != null) {
    await setSystemSetting({ key: LAST_OPPID_KEY, value: String(lastOppId), category: "brreg", description: "Last Brreg oppdateringsid" }).catch(() => {});
  }

  return { processed, updated, deletedFlagged, errors, fromDate, lastOppdateringsid: lastOppId, finishedAt };
}

/**
 * Refresh a specific list of organisasjonsnummer immediately (used by the
 * per-company "refresh from Brreg" action).
 */
export async function refreshCompaniesByOrgNr(orgNumbers: string[]): Promise<{ updated: number; errors: number }> {
  let updated = 0, errors = 0;
  for (const orgnr of orgNumbers) {
    try {
      const enhet = await getBrregCompany(orgnr);
      if (enhet) { await upsertCompanyFromBrreg(enhet); updated += 1; }
    } catch { errors += 1; }
  }
  return { updated, errors };
}

export async function getBrregSyncStatus() {
  const last = await getSystemSetting(LAST_SYNC_KEY).catch(() => null);
  const lastId = await getSystemSetting(LAST_OPPID_KEY).catch(() => null);
  return {
    lastSync: last?.value || null,
    lastOppdateringsid: lastId?.value ? Number(lastId.value) : null,
  };
}
