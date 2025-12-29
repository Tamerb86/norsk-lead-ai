import { invokeLLM } from "../_core/llm";

/**
 * AI-Powered Lead Insights Service
 * Provides intelligent analysis and recommendations for leads
 */

export interface LeadData {
  companyName: string;
  industry?: string;
  location?: string;
  employees?: number;
  revenue?: string;
  website?: string;
  description?: string;
  contactName?: string;
  contactTitle?: string;
  emailHistory?: Array<{
    subject: string;
    status: "sent" | "opened" | "clicked" | "replied" | "bounced";
    date: string;
  }>;
  score?: number;
  tags?: string[];
}

export interface LeadInsight {
  summary: string;
  strengths: string[];
  opportunities: string[];
  risks: string[];
  recommendedActions: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    reason: string;
  }>;
  bestTimeToContact: string;
  suggestedTalkingPoints: string[];
  competitorMentions?: string[];
  industryTrends?: string[];
}

export interface EmailSequenceStep {
  day: number;
  subject: string;
  body: string;
  purpose: string;
  waitCondition?: string;
}

export interface EmailSequence {
  name: string;
  description: string;
  steps: EmailSequenceStep[];
  tips: string[];
}

export interface CompanyResearch {
  overview: string;
  recentNews: string[];
  keyPeople: Array<{
    name: string;
    title: string;
    linkedIn?: string;
  }>;
  painPoints: string[];
  opportunities: string[];
  competitors: string[];
  talkingPoints: string[];
}

/**
 * Generate AI-powered insights for a lead
 */
export async function generateLeadInsights(
  lead: LeadData,
  language: "norwegian" | "english" = "norwegian"
): Promise<LeadInsight> {
  const systemPrompt = language === "norwegian"
    ? `Du er en erfaren salgsanalytiker som gir innsiktsfulle analyser av potensielle kunder.
       Analyser bedriften og gi konkrete, handlingsrettede anbefalinger.
       
       Svar alltid i JSON-format:
       {
         "summary": "Kort oppsummering av leadet",
         "strengths": ["Styrke 1", "Styrke 2"],
         "opportunities": ["Mulighet 1", "Mulighet 2"],
         "risks": ["Risiko 1", "Risiko 2"],
         "recommendedActions": [
           {"action": "Handling", "priority": "high|medium|low", "reason": "Begrunnelse"}
         ],
         "bestTimeToContact": "Anbefalt tidspunkt",
         "suggestedTalkingPoints": ["Samtalepunkt 1", "Samtalepunkt 2"],
         "industryTrends": ["Trend 1", "Trend 2"]
       }`
    : `You are an experienced sales analyst providing insightful analysis of potential customers.
       Analyze the company and provide concrete, actionable recommendations.
       
       Always respond in JSON format:
       {
         "summary": "Brief summary of the lead",
         "strengths": ["Strength 1", "Strength 2"],
         "opportunities": ["Opportunity 1", "Opportunity 2"],
         "risks": ["Risk 1", "Risk 2"],
         "recommendedActions": [
           {"action": "Action", "priority": "high|medium|low", "reason": "Reason"}
         ],
         "bestTimeToContact": "Recommended time",
         "suggestedTalkingPoints": ["Talking point 1", "Talking point 2"],
         "industryTrends": ["Trend 1", "Trend 2"]
       }`;

  const leadContext = `
    Bedrift: ${lead.companyName}
    ${lead.industry ? `Bransje: ${lead.industry}` : ''}
    ${lead.location ? `Lokasjon: ${lead.location}` : ''}
    ${lead.employees ? `Ansatte: ${lead.employees}` : ''}
    ${lead.revenue ? `Omsetning: ${lead.revenue}` : ''}
    ${lead.website ? `Nettside: ${lead.website}` : ''}
    ${lead.description ? `Beskrivelse: ${lead.description}` : ''}
    ${lead.contactName ? `Kontakt: ${lead.contactName}${lead.contactTitle ? ` (${lead.contactTitle})` : ''}` : ''}
    ${lead.score !== undefined ? `Lead Score: ${lead.score}` : ''}
    ${lead.tags?.length ? `Tags: ${lead.tags.join(', ')}` : ''}
    ${lead.emailHistory?.length ? `E-posthistorikk: ${lead.emailHistory.map(e => `${e.subject} (${e.status})`).join(', ')}` : ''}
  `.trim();

  const userPrompt = language === "norwegian"
    ? `Analyser denne potensielle kunden og gi innsikt:\n\n${leadContext}`
    : `Analyze this potential customer and provide insights:\n\n${leadContext}`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      responseFormat: { type: "json_object" }
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response from AI");
    }

    return JSON.parse(content) as LeadInsight;
  } catch (error) {
    console.error("[AI Insights] Error:", error);
    throw new Error("Failed to generate lead insights.");
  }
}

/**
 * Generate a personalized email sequence for a lead
 */
export async function generateEmailSequence(
  lead: LeadData,
  goal: "nurture" | "conversion" | "reengagement" | "onboarding",
  steps: number = 5,
  language: "norwegian" | "english" = "norwegian"
): Promise<EmailSequence> {
  const goalDescriptions = {
    nurture: language === "norwegian" ? "bygge relasjon og tillit over tid" : "build relationship and trust over time",
    conversion: language === "norwegian" ? "konvertere til betalende kunde" : "convert to paying customer",
    reengagement: language === "norwegian" ? "gjenoppta kontakt med inaktiv lead" : "re-engage inactive lead",
    onboarding: language === "norwegian" ? "introdusere produktet/tjenesten" : "introduce the product/service"
  };

  const systemPrompt = language === "norwegian"
    ? `Du er en ekspert på e-postmarkedsføring og drip-kampanjer.
       Lag en effektiv e-postsekvens som er personlig og engasjerende.
       
       Svar i JSON-format:
       {
         "name": "Sekvensens navn",
         "description": "Kort beskrivelse",
         "steps": [
           {
             "day": 0,
             "subject": "Emnelinje",
             "body": "E-postinnhold med {{variabler}}",
             "purpose": "Formålet med denne e-posten",
             "waitCondition": "Valgfri betingelse før neste steg"
           }
         ],
         "tips": ["Tips for å forbedre resultatene"]
       }`
    : `You are an expert in email marketing and drip campaigns.
       Create an effective email sequence that is personal and engaging.
       
       Respond in JSON format:
       {
         "name": "Sequence name",
         "description": "Brief description",
         "steps": [
           {
             "day": 0,
             "subject": "Subject line",
             "body": "Email content with {{variables}}",
             "purpose": "Purpose of this email",
             "waitCondition": "Optional condition before next step"
           }
         ],
         "tips": ["Tips to improve results"]
       }`;

  const userPrompt = language === "norwegian"
    ? `Lag en ${steps}-stegs e-postsekvens for:
       
       Bedrift: ${lead.companyName}
       ${lead.industry ? `Bransje: ${lead.industry}` : ''}
       ${lead.contactName ? `Kontakt: ${lead.contactName}` : ''}
       
       Mål: ${goalDescriptions[goal]}
       
       Krav:
       - Hver e-post skal være kort (maks 100 ord)
       - Bruk {{company_name}}, {{contact_name}}, {{industry}} som variabler
       - Varier mellom verdi-basert og direkte kommunikasjon
       - Inkluder tydelige call-to-actions`
    : `Create a ${steps}-step email sequence for:
       
       Company: ${lead.companyName}
       ${lead.industry ? `Industry: ${lead.industry}` : ''}
       ${lead.contactName ? `Contact: ${lead.contactName}` : ''}
       
       Goal: ${goalDescriptions[goal]}
       
       Requirements:
       - Each email should be short (max 100 words)
       - Use {{company_name}}, {{contact_name}}, {{industry}} as variables
       - Vary between value-based and direct communication
       - Include clear call-to-actions`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      responseFormat: { type: "json_object" }
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response from AI");
    }

    return JSON.parse(content) as EmailSequence;
  } catch (error) {
    console.error("[AI Insights] Sequence error:", error);
    throw new Error("Failed to generate email sequence.");
  }
}

/**
 * Research a company and provide detailed information
 */
export async function researchCompany(
  companyName: string,
  website?: string,
  additionalInfo?: string,
  language: "norwegian" | "english" = "norwegian"
): Promise<CompanyResearch> {
  const systemPrompt = language === "norwegian"
    ? `Du er en forretningsanalytiker som forsker på bedrifter.
       Gi en detaljert analyse basert på tilgjengelig informasjon.
       Vær realistisk - ikke finn på informasjon du ikke har.
       
       Svar i JSON-format:
       {
         "overview": "Oversikt over bedriften",
         "recentNews": ["Nyhet 1", "Nyhet 2"],
         "keyPeople": [{"name": "Navn", "title": "Tittel"}],
         "painPoints": ["Smertepunkt 1", "Smertepunkt 2"],
         "opportunities": ["Mulighet 1", "Mulighet 2"],
         "competitors": ["Konkurrent 1", "Konkurrent 2"],
         "talkingPoints": ["Samtalepunkt 1", "Samtalepunkt 2"]
       }`
    : `You are a business analyst researching companies.
       Provide detailed analysis based on available information.
       Be realistic - don't make up information you don't have.
       
       Respond in JSON format:
       {
         "overview": "Company overview",
         "recentNews": ["News 1", "News 2"],
         "keyPeople": [{"name": "Name", "title": "Title"}],
         "painPoints": ["Pain point 1", "Pain point 2"],
         "opportunities": ["Opportunity 1", "Opportunity 2"],
         "competitors": ["Competitor 1", "Competitor 2"],
         "talkingPoints": ["Talking point 1", "Talking point 2"]
       }`;

  const userPrompt = language === "norwegian"
    ? `Analyser denne bedriften:
       
       Navn: ${companyName}
       ${website ? `Nettside: ${website}` : ''}
       ${additionalInfo ? `Tilleggsinformasjon: ${additionalInfo}` : ''}
       
       Gi en grundig analyse med fokus på:
       - Hva bedriften gjør
       - Potensielle smertepunkter
       - Muligheter for samarbeid
       - Relevante samtalepunkter for salg`
    : `Analyze this company:
       
       Name: ${companyName}
       ${website ? `Website: ${website}` : ''}
       ${additionalInfo ? `Additional info: ${additionalInfo}` : ''}
       
       Provide thorough analysis focusing on:
       - What the company does
       - Potential pain points
       - Collaboration opportunities
       - Relevant talking points for sales`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      responseFormat: { type: "json_object" }
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response from AI");
    }

    return JSON.parse(content) as CompanyResearch;
  } catch (error) {
    console.error("[AI Insights] Research error:", error);
    throw new Error("Failed to research company.");
  }
}

/**
 * Analyze email performance and suggest improvements
 */
export async function analyzeEmailPerformance(
  emails: Array<{
    subject: string;
    body: string;
    openRate: number;
    clickRate: number;
    replyRate: number;
  }>,
  language: "norwegian" | "english" = "norwegian"
): Promise<{
  analysis: string;
  topPerformers: string[];
  improvements: Array<{
    area: string;
    suggestion: string;
    expectedImpact: string;
  }>;
  subjectLinePatterns: string[];
  contentPatterns: string[];
}> {
  const systemPrompt = language === "norwegian"
    ? `Du er en ekspert på e-postmarkedsføring og analyse.
       Analyser e-postytelsen og gi konkrete forbedringsforslag.
       
       Svar i JSON-format:
       {
         "analysis": "Overordnet analyse",
         "topPerformers": ["Beste e-post 1", "Beste e-post 2"],
         "improvements": [
           {"area": "Område", "suggestion": "Forslag", "expectedImpact": "Forventet effekt"}
         ],
         "subjectLinePatterns": ["Mønster som fungerer"],
         "contentPatterns": ["Innholdsmønstre som fungerer"]
       }`
    : `You are an expert in email marketing and analytics.
       Analyze email performance and provide concrete improvement suggestions.
       
       Respond in JSON format:
       {
         "analysis": "Overall analysis",
         "topPerformers": ["Best email 1", "Best email 2"],
         "improvements": [
           {"area": "Area", "suggestion": "Suggestion", "expectedImpact": "Expected impact"}
         ],
         "subjectLinePatterns": ["Patterns that work"],
         "contentPatterns": ["Content patterns that work"]
       }`;

  const emailSummary = emails.map((e, i) => 
    `E-post ${i + 1}:
     Emne: ${e.subject}
     Åpningsrate: ${(e.openRate * 100).toFixed(1)}%
     Klikkrate: ${(e.clickRate * 100).toFixed(1)}%
     Svarrate: ${(e.replyRate * 100).toFixed(1)}%`
  ).join('\n\n');

  const userPrompt = language === "norwegian"
    ? `Analyser disse e-postene og gi forbedringsforslag:\n\n${emailSummary}`
    : `Analyze these emails and provide improvement suggestions:\n\n${emailSummary}`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      responseFormat: { type: "json_object" }
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response from AI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("[AI Insights] Performance analysis error:", error);
    throw new Error("Failed to analyze email performance.");
  }
}

/**
 * Generate personalized outreach message based on context
 */
export async function generatePersonalizedOutreach(
  lead: LeadData,
  context: {
    trigger?: string; // e.g., "company raised funding", "new hire", "product launch"
    yourProduct: string;
    valueProposition: string;
  },
  language: "norwegian" | "english" = "norwegian"
): Promise<{
  subject: string;
  body: string;
  linkedInMessage?: string;
  followUpSuggestion: string;
}> {
  const systemPrompt = language === "norwegian"
    ? `Du er en ekspert på personalisert salgsutreach.
       Lag meldinger som er relevante, personlige og ikke-påtrengende.
       
       Svar i JSON-format:
       {
         "subject": "Personalisert emnelinje",
         "body": "E-postinnhold",
         "linkedInMessage": "Kort LinkedIn-melding (maks 300 tegn)",
         "followUpSuggestion": "Forslag til oppfølging"
       }`
    : `You are an expert in personalized sales outreach.
       Create messages that are relevant, personal, and non-intrusive.
       
       Respond in JSON format:
       {
         "subject": "Personalized subject line",
         "body": "Email content",
         "linkedInMessage": "Short LinkedIn message (max 300 chars)",
         "followUpSuggestion": "Follow-up suggestion"
       }`;

  const userPrompt = language === "norwegian"
    ? `Lag personalisert outreach for:
       
       Bedrift: ${lead.companyName}
       ${lead.industry ? `Bransje: ${lead.industry}` : ''}
       ${lead.contactName ? `Kontakt: ${lead.contactName}${lead.contactTitle ? ` (${lead.contactTitle})` : ''}` : ''}
       ${context.trigger ? `Trigger/Anledning: ${context.trigger}` : ''}
       
       Ditt produkt: ${context.yourProduct}
       Verdiforslag: ${context.valueProposition}
       
       Krav:
       - Referer til triggeren hvis oppgitt
       - Fokuser på verdi, ikke funksjoner
       - Hold det kort og profesjonelt
       - Inkluder en myk call-to-action`
    : `Create personalized outreach for:
       
       Company: ${lead.companyName}
       ${lead.industry ? `Industry: ${lead.industry}` : ''}
       ${lead.contactName ? `Contact: ${lead.contactName}${lead.contactTitle ? ` (${lead.contactTitle})` : ''}` : ''}
       ${context.trigger ? `Trigger/Occasion: ${context.trigger}` : ''}
       
       Your product: ${context.yourProduct}
       Value proposition: ${context.valueProposition}
       
       Requirements:
       - Reference the trigger if provided
       - Focus on value, not features
       - Keep it short and professional
       - Include a soft call-to-action`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      responseFormat: { type: "json_object" }
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response from AI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("[AI Insights] Outreach error:", error);
    throw new Error("Failed to generate personalized outreach.");
  }
}

/**
 * Score and prioritize leads using AI
 */
export async function aiScoreLeads(
  leads: LeadData[],
  criteria: {
    idealCustomerProfile: string;
    priorities: string[];
  },
  language: "norwegian" | "english" = "norwegian"
): Promise<Array<{
  companyName: string;
  score: number;
  reasoning: string;
  nextBestAction: string;
}>> {
  const systemPrompt = language === "norwegian"
    ? `Du er en salgsanalytiker som scorer og prioriterer leads.
       Gi en score fra 0-100 basert på hvor godt leadet matcher ideell kundeprofil.
       
       Svar i JSON-format:
       {
         "scoredLeads": [
           {
             "companyName": "Bedriftsnavn",
             "score": 85,
             "reasoning": "Begrunnelse for scoren",
             "nextBestAction": "Anbefalt neste handling"
           }
         ]
       }`
    : `You are a sales analyst who scores and prioritizes leads.
       Give a score from 0-100 based on how well the lead matches the ideal customer profile.
       
       Respond in JSON format:
       {
         "scoredLeads": [
           {
             "companyName": "Company name",
             "score": 85,
             "reasoning": "Reasoning for the score",
             "nextBestAction": "Recommended next action"
           }
         ]
       }`;

  const leadsContext = leads.map(l => 
    `- ${l.companyName}${l.industry ? ` (${l.industry})` : ''}${l.employees ? `, ${l.employees} ansatte` : ''}${l.location ? `, ${l.location}` : ''}`
  ).join('\n');

  const userPrompt = language === "norwegian"
    ? `Score disse leadsene basert på:
       
       Ideell kundeprofil: ${criteria.idealCustomerProfile}
       Prioriteringer: ${criteria.priorities.join(', ')}
       
       Leads:
       ${leadsContext}`
    : `Score these leads based on:
       
       Ideal customer profile: ${criteria.idealCustomerProfile}
       Priorities: ${criteria.priorities.join(', ')}
       
       Leads:
       ${leadsContext}`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      responseFormat: { type: "json_object" }
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response from AI");
    }

    const parsed = JSON.parse(content) as { scoredLeads: Array<{
      companyName: string;
      score: number;
      reasoning: string;
      nextBestAction: string;
    }> };

    return parsed.scoredLeads;
  } catch (error) {
    console.error("[AI Insights] Scoring error:", error);
    throw new Error("Failed to score leads.");
  }
}
