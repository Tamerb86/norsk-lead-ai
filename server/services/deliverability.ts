/**
 * Email deliverability checker.
 *
 * Verifies that a sending domain is correctly configured so cold/marketing
 * emails land in the inbox rather than spam:
 *  - SPF   (TXT "v=spf1 ...")               — authorizes sending servers
 *  - DKIM  (selector._domainkey TXT/CNAME)  — cryptographic signature
 *  - DMARC (_dmarc TXT "v=DMARC1 ...")       — policy + alignment
 *  - MX                                      — domain can receive replies/bounces
 *
 * DNS records themselves must be added at the domain's DNS provider — this tool
 * reports what's present/missing and the exact records to add.
 */
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);
const resolveCname = promisify(dns.resolveCname);

export interface DeliverabilityCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  fix?: string;
}

export interface DeliverabilityReport {
  domain: string;
  score: number; // 0-100
  checks: DeliverabilityCheck[];
  summary: string;
}

function cleanDomain(input: string): string {
  let d = (input || "").trim().toLowerCase();
  if (d.includes("@")) d = d.split("@")[1];
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  return d;
}

async function getTxt(name: string): Promise<string[]> {
  try {
    const records = await resolveTxt(name);
    return records.map((parts) => parts.join(""));
  } catch {
    return [];
  }
}

export async function checkDeliverability(domainInput: string): Promise<DeliverabilityReport> {
  const domain = cleanDomain(domainInput);
  const checks: DeliverabilityCheck[] = [];

  // --- SPF ---
  const rootTxt = await getTxt(domain);
  const spf = rootTxt.find((r) => r.toLowerCase().startsWith("v=spf1"));
  if (spf) {
    checks.push({
      name: "SPF",
      status: "pass",
      detail: spf,
    });
  } else {
    checks.push({
      name: "SPF",
      status: "fail",
      detail: "Ingen SPF-record funnet.",
      fix: `Legg til en TXT-record på ${domain}: "v=spf1 include:sendgrid.net ~all" (juster include for din e-postleverandør).`,
    });
  }

  // --- DMARC ---
  const dmarcTxt = await getTxt(`_dmarc.${domain}`);
  const dmarc = dmarcTxt.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
  if (dmarc) {
    const policyMatch = dmarc.match(/p=(none|quarantine|reject)/i);
    const policy = policyMatch ? policyMatch[1].toLowerCase() : "none";
    checks.push({
      name: "DMARC",
      status: policy === "none" ? "warn" : "pass",
      detail: dmarc,
      fix:
        policy === "none"
          ? "DMARC finnes, men p=none gir ingen beskyttelse. Vurder p=quarantine når du har verifisert at SPF/DKIM er riktige."
          : undefined,
    });
  } else {
    checks.push({
      name: "DMARC",
      status: "fail",
      detail: "Ingen DMARC-record funnet.",
      fix: `Legg til TXT på _dmarc.${domain}: "v=DMARC1; p=none; rua=mailto:dmarc@${domain}" (start med p=none for overvåking).`,
    });
  }

  // --- DKIM (common SendGrid selectors s1/s2, plus generic 'default') ---
  let dkimFound = false;
  for (const sel of ["s1", "s2", "default", "k1"]) {
    const cnameOk = await resolveCname(`${sel}._domainkey.${domain}`).then(
      (r) => r.length > 0,
      () => false
    );
    const txtOk = (await getTxt(`${sel}._domainkey.${domain}`)).some((r) =>
      r.toLowerCase().includes("dkim") || r.toLowerCase().includes("p=")
    );
    if (cnameOk || txtOk) {
      dkimFound = true;
      checks.push({ name: `DKIM (${sel})`, status: "pass", detail: `DKIM-record funnet for selector "${sel}".` });
      break;
    }
  }
  if (!dkimFound) {
    checks.push({
      name: "DKIM",
      status: "fail",
      detail: "Ingen DKIM-record funnet for vanlige selectors (s1, s2, default).",
      fix:
        "Aktiver domain authentication hos e-postleverandøren (SendGrid: Settings → Sender Authentication) og legg til CNAME-recordene de oppgir (s1._domainkey, s2._domainkey).",
    });
  }

  // --- MX ---
  const mx = await resolveMx(domain).catch(() => []);
  checks.push(
    mx && mx.length > 0
      ? { name: "MX", status: "pass", detail: `${mx.length} MX-record(er) funnet.` }
      : {
          name: "MX",
          status: "warn",
          detail: "Ingen MX-record. Domenet kan ikke motta svar/bounces.",
          fix: "Sett opp MX hvis du vil motta svar på denne adressen.",
        }
  );

  // --- Score ---
  const weights: Record<string, number> = { SPF: 30, DMARC: 25, MX: 15 };
  let score = 0;
  for (const c of checks) {
    const key = c.name.startsWith("DKIM") ? "DKIM" : c.name;
    const w = key === "DKIM" ? 30 : weights[key] ?? 0;
    if (c.status === "pass") score += w;
    else if (c.status === "warn") score += Math.round(w * 0.5);
  }

  const fails = checks.filter((c) => c.status === "fail").length;
  const summary =
    fails === 0
      ? "Domenet er godt konfigurert for e-postutsending."
      : `${fails} kritiske mangler. Fiks disse før du sender kalde e-poster for å unngå spam-mappen.`;

  return { domain, score, checks, summary };
}
