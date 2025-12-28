/**
 * Lead Scoring Service
 * 
 * Calculates a quality score (0-100) for companies based on various factors.
 * Higher scores indicate better potential leads.
 */

export interface CompanyData {
  id: number;
  navn: string;
  organisasjonsform?: string | null;
  naeringskode1?: string | null;
  naeringsbeskrivelse1?: string | null;
  antallAnsatte?: number | null;
  epostadresse?: string | null;
  telefon?: string | null;
  hjemmeside?: string | null;
  fylke?: string | null;
  kommune?: string | null;
  stiftelsesdato?: string | null;
  registreringsdatoEnhetsregisteret?: string | null;
}

export interface LeadScore {
  companyId: number;
  totalScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: {
    contactInfo: number;      // 0-25 points
    companySize: number;      // 0-20 points
    companyAge: number;       // 0-15 points
    industryMatch: number;    // 0-20 points
    location: number;         // 0-10 points
    dataCompleteness: number; // 0-10 points
  };
  signals: string[];
  recommendations: string[];
}

// Priority industries for B2B sales in Norway
const PRIORITY_INDUSTRIES = new Map([
  ["62", 15], // IT og informasjonstjenester
  ["70", 15], // Hovedkontortjenester; administrativ rådgivning
  ["69", 12], // Juridisk og regnskapsmessig tjenesteyting
  ["71", 12], // Arkitektvirksomhet og teknisk konsulentvirksomhet
  ["74", 12], // Annen faglig, vitenskapelig og teknisk virksomhet
  ["41", 10], // Oppføring av bygninger
  ["43", 10], // Spesialisert bygge- og anleggsvirksomhet
  ["46", 10], // Agentur- og engroshandel
  ["64", 10], // Finansieringsvirksomhet
  ["86", 8],  // Helsetjenester
  ["47", 8],  // Detaljhandel
  ["55", 6],  // Overnattingsvirksomhet
  ["56", 6],  // Serveringsvirksomhet
]);

// Priority locations (major business hubs)
const PRIORITY_LOCATIONS = new Map([
  ["Oslo", 10],
  ["Bergen", 8],
  ["Trondheim", 8],
  ["Stavanger", 7],
  ["Kristiansand", 6],
  ["Tromsø", 6],
  ["Drammen", 5],
  ["Fredrikstad", 5],
  ["Sandnes", 5],
  ["Bærum", 7],
  ["Asker", 6],
]);

/**
 * Calculate contact info score (0-25)
 */
function scoreContactInfo(company: CompanyData): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  if (company.epostadresse) {
    score += 10;
    signals.push("✅ Har e-postadresse");
    
    // Bonus for direct email (not info@, post@)
    const email = company.epostadresse.toLowerCase();
    if (!email.startsWith("info@") && !email.startsWith("post@") && !email.startsWith("kontakt@")) {
      score += 3;
      signals.push("✅ Direkte e-postadresse (ikke generisk)");
    }
  } else {
    signals.push("❌ Mangler e-postadresse");
  }

  if (company.telefon) {
    score += 7;
    signals.push("✅ Har telefonnummer");
  } else {
    signals.push("❌ Mangler telefonnummer");
  }

  if (company.hjemmeside) {
    score += 5;
    signals.push("✅ Har nettside");
  } else {
    signals.push("⚠️ Mangler nettside");
  }

  return { score: Math.min(score, 25), signals };
}

/**
 * Calculate company size score (0-20)
 */
function scoreCompanySize(company: CompanyData): { score: number; signals: string[] } {
  const employees = company.antallAnsatte || 0;
  const signals: string[] = [];
  let score = 0;

  if (employees >= 50) {
    score = 20;
    signals.push(`✅ Stor bedrift (${employees} ansatte)`);
  } else if (employees >= 20) {
    score = 16;
    signals.push(`✅ Mellomstor bedrift (${employees} ansatte)`);
  } else if (employees >= 10) {
    score = 12;
    signals.push(`✅ Liten bedrift (${employees} ansatte)`);
  } else if (employees >= 5) {
    score = 8;
    signals.push(`⚠️ Mikrobedrift (${employees} ansatte)`);
  } else if (employees >= 1) {
    score = 4;
    signals.push(`⚠️ Enkeltpersonforetak (${employees} ansatte)`);
  } else {
    score = 0;
    signals.push("❌ Ukjent antall ansatte");
  }

  return { score, signals };
}

/**
 * Calculate company age score (0-15)
 */
function scoreCompanyAge(company: CompanyData): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  const dateStr = company.stiftelsesdato || company.registreringsdatoEnhetsregisteret;
  if (!dateStr) {
    return { score: 5, signals: ["⚠️ Ukjent stiftelsesdato"] };
  }

  const founded = new Date(dateStr);
  const now = new Date();
  const yearsOld = (now.getTime() - founded.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (yearsOld >= 10) {
    score = 15;
    signals.push(`✅ Etablert bedrift (${Math.floor(yearsOld)} år)`);
  } else if (yearsOld >= 5) {
    score = 12;
    signals.push(`✅ Moden bedrift (${Math.floor(yearsOld)} år)`);
  } else if (yearsOld >= 2) {
    score = 8;
    signals.push(`⚠️ Ung bedrift (${Math.floor(yearsOld)} år)`);
  } else if (yearsOld >= 1) {
    score = 4;
    signals.push(`⚠️ Nystartet bedrift (${Math.floor(yearsOld)} år)`);
  } else {
    score = 2;
    signals.push(`⚠️ Veldig ny bedrift (<1 år)`);
  }

  return { score, signals };
}

/**
 * Calculate industry match score (0-20)
 */
function scoreIndustry(company: CompanyData, targetIndustries?: string[]): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  const industryCode = company.naeringskode1?.substring(0, 2);
  
  if (!industryCode) {
    return { score: 5, signals: ["⚠️ Ukjent bransje"] };
  }

  // Check if it matches target industries (if specified)
  if (targetIndustries && targetIndustries.length > 0) {
    const matches = targetIndustries.some(code => industryCode.startsWith(code.substring(0, 2)));
    if (matches) {
      score = 20;
      signals.push(`✅ Matcher målbransje: ${company.naeringsbeskrivelse1 || industryCode}`);
      return { score, signals };
    }
  }

  // Default industry scoring
  const priorityScore = PRIORITY_INDUSTRIES.get(industryCode);
  if (priorityScore) {
    score = priorityScore;
    signals.push(`✅ Prioritert bransje: ${company.naeringsbeskrivelse1 || industryCode}`);
  } else {
    score = 5;
    signals.push(`⚠️ Standard bransje: ${company.naeringsbeskrivelse1 || industryCode}`);
  }

  return { score, signals };
}

/**
 * Calculate location score (0-10)
 */
function scoreLocation(company: CompanyData, targetLocations?: string[]): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  const location = company.kommune || company.fylke;
  
  if (!location) {
    return { score: 3, signals: ["⚠️ Ukjent lokasjon"] };
  }

  // Check if it matches target locations (if specified)
  if (targetLocations && targetLocations.length > 0) {
    const matches = targetLocations.some(loc => 
      location.toLowerCase().includes(loc.toLowerCase())
    );
    if (matches) {
      score = 10;
      signals.push(`✅ Matcher mållokasjon: ${location}`);
      return { score, signals };
    }
  }

  // Default location scoring
  const priorityScore = PRIORITY_LOCATIONS.get(location);
  if (priorityScore) {
    score = priorityScore;
    signals.push(`✅ Prioritert lokasjon: ${location}`);
  } else {
    score = 3;
    signals.push(`⚠️ Standard lokasjon: ${location}`);
  }

  return { score, signals };
}

/**
 * Calculate data completeness score (0-10)
 */
function scoreDataCompleteness(company: CompanyData): { score: number; signals: string[] } {
  const signals: string[] = [];
  let filledFields = 0;
  const totalFields = 10;

  if (company.navn) filledFields++;
  if (company.organisasjonsform) filledFields++;
  if (company.naeringskode1) filledFields++;
  if (company.antallAnsatte) filledFields++;
  if (company.epostadresse) filledFields++;
  if (company.telefon) filledFields++;
  if (company.hjemmeside) filledFields++;
  if (company.fylke) filledFields++;
  if (company.kommune) filledFields++;
  if (company.stiftelsesdato) filledFields++;

  const completeness = filledFields / totalFields;
  const score = Math.round(completeness * 10);

  if (completeness >= 0.8) {
    signals.push(`✅ Høy datakvalitet (${Math.round(completeness * 100)}%)`);
  } else if (completeness >= 0.5) {
    signals.push(`⚠️ Middels datakvalitet (${Math.round(completeness * 100)}%)`);
  } else {
    signals.push(`❌ Lav datakvalitet (${Math.round(completeness * 100)}%)`);
  }

  return { score, signals };
}

/**
 * Convert score to grade
 */
function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

/**
 * Generate recommendations based on score breakdown
 */
function generateRecommendations(breakdown: LeadScore["breakdown"], signals: string[]): string[] {
  const recommendations: string[] = [];

  if (breakdown.contactInfo < 15) {
    recommendations.push("Finn e-postadresse via Email Finder");
  }

  if (breakdown.companySize >= 12) {
    recommendations.push("Prioriter denne leaden - god bedriftsstørrelse");
  }

  if (breakdown.industryMatch >= 15) {
    recommendations.push("Høy bransjematch - tilpass budskapet");
  }

  if (breakdown.contactInfo >= 20 && breakdown.companySize >= 12) {
    recommendations.push("🔥 Hot lead - kontakt snarest!");
  }

  return recommendations;
}

/**
 * Calculate lead score for a single company
 */
export function calculateLeadScore(
  company: CompanyData,
  options?: {
    targetIndustries?: string[];
    targetLocations?: string[];
  }
): LeadScore {
  const contactResult = scoreContactInfo(company);
  const sizeResult = scoreCompanySize(company);
  const ageResult = scoreCompanyAge(company);
  const industryResult = scoreIndustry(company, options?.targetIndustries);
  const locationResult = scoreLocation(company, options?.targetLocations);
  const completenessResult = scoreDataCompleteness(company);

  const breakdown = {
    contactInfo: contactResult.score,
    companySize: sizeResult.score,
    companyAge: ageResult.score,
    industryMatch: industryResult.score,
    location: locationResult.score,
    dataCompleteness: completenessResult.score,
  };

  const totalScore = 
    breakdown.contactInfo +
    breakdown.companySize +
    breakdown.companyAge +
    breakdown.industryMatch +
    breakdown.location +
    breakdown.dataCompleteness;

  const signals = [
    ...contactResult.signals,
    ...sizeResult.signals,
    ...ageResult.signals,
    ...industryResult.signals,
    ...locationResult.signals,
    ...completenessResult.signals,
  ];

  const recommendations = generateRecommendations(breakdown, signals);

  return {
    companyId: company.id,
    totalScore,
    grade: scoreToGrade(totalScore),
    breakdown,
    signals,
    recommendations,
  };
}

/**
 * Calculate lead scores for multiple companies
 */
export function calculateLeadScoresBatch(
  companies: CompanyData[],
  options?: {
    targetIndustries?: string[];
    targetLocations?: string[];
  }
): LeadScore[] {
  return companies.map(company => calculateLeadScore(company, options));
}

/**
 * Sort companies by lead score
 */
export function sortByLeadScore(
  companies: CompanyData[],
  options?: {
    targetIndustries?: string[];
    targetLocations?: string[];
  }
): Array<CompanyData & { leadScore: LeadScore }> {
  const scored = companies.map(company => ({
    ...company,
    leadScore: calculateLeadScore(company, options),
  }));

  return scored.sort((a, b) => b.leadScore.totalScore - a.leadScore.totalScore);
}
