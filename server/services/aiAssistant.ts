import { invokeLLM } from "../_core/llm";

/**
 * AI Sales Assistant Service
 * Provides conversational AI assistance for sales tasks
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AssistantContext {
  userId: number;
  userName?: string;
  companyContext?: {
    name: string;
    industry?: string;
    product?: string;
  };
  currentLeads?: Array<{
    name: string;
    industry?: string;
    status?: string;
  }>;
  recentActivity?: string[];
}

const ASSISTANT_SYSTEM_PROMPT_NO = `Du er en intelligent salgsassistent for NorskLeads - en plattform for lead-generering og salgsautomatisering.

Dine hovedoppgaver:
1. Hjelpe brukere med å finne og kvalifisere leads
2. Skrive og forbedre salgs-e-poster
3. Gi råd om salgsstrategier
4. Analysere leads og gi innsikt
5. Foreslå neste beste handling

Retningslinjer:
- Vær hjelpsom, profesjonell og konkret
- Gi handlingsrettede råd
- Bruk norsk (bokmål) som hovedspråk
- Tilpass svarene til brukerens kontekst
- Spør om mer informasjon når nødvendig

Du har tilgang til følgende funksjoner (nevn dem når relevant):
- Søk etter bedrifter i Norge
- Generere AI-drevne e-poster
- Analysere lead-kvalitet
- Lage e-postsekvenser
- Forske på bedrifter

Svar alltid på en hjelpsom og engasjerende måte.`;

const ASSISTANT_SYSTEM_PROMPT_EN = `You are an intelligent sales assistant for NorskLeads - a platform for lead generation and sales automation.

Your main tasks:
1. Help users find and qualify leads
2. Write and improve sales emails
3. Provide sales strategy advice
4. Analyze leads and provide insights
5. Suggest next best actions

Guidelines:
- Be helpful, professional, and concrete
- Give actionable advice
- Adapt responses to user context
- Ask for more information when needed

You have access to these functions (mention when relevant):
- Search for companies in Norway
- Generate AI-powered emails
- Analyze lead quality
- Create email sequences
- Research companies

Always respond in a helpful and engaging manner.`;

/**
 * Chat with the AI Sales Assistant
 */
export async function chatWithAssistant(
  messages: Message[],
  context: AssistantContext,
  language: "norwegian" | "english" = "norwegian"
): Promise<string> {
  const systemPrompt = language === "norwegian" 
    ? ASSISTANT_SYSTEM_PROMPT_NO 
    : ASSISTANT_SYSTEM_PROMPT_EN;

  // Build context string
  let contextInfo = "";
  if (context.userName) {
    contextInfo += language === "norwegian" 
      ? `\nBruker: ${context.userName}` 
      : `\nUser: ${context.userName}`;
  }
  if (context.companyContext) {
    contextInfo += language === "norwegian"
      ? `\nBrukerens bedrift: ${context.companyContext.name}${context.companyContext.industry ? ` (${context.companyContext.industry})` : ''}${context.companyContext.product ? `, tilbyr: ${context.companyContext.product}` : ''}`
      : `\nUser's company: ${context.companyContext.name}${context.companyContext.industry ? ` (${context.companyContext.industry})` : ''}${context.companyContext.product ? `, offers: ${context.companyContext.product}` : ''}`;
  }
  if (context.currentLeads?.length) {
    const leadsList = context.currentLeads.slice(0, 5).map(l => l.name).join(', ');
    contextInfo += language === "norwegian"
      ? `\nAktive leads: ${leadsList}`
      : `\nActive leads: ${leadsList}`;
  }
  if (context.recentActivity?.length) {
    contextInfo += language === "norwegian"
      ? `\nNylig aktivitet: ${context.recentActivity.slice(0, 3).join(', ')}`
      : `\nRecent activity: ${context.recentActivity.slice(0, 3).join(', ')}`;
  }

  const fullSystemPrompt = systemPrompt + (contextInfo ? `\n\nKontekst:${contextInfo}` : '');

  // Ensure system message is first
  const fullMessages: Message[] = [
    { role: "system", content: fullSystemPrompt },
    ...messages.filter(m => m.role !== "system")
  ];

  try {
    const result = await invokeLLM({
      messages: fullMessages
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response from AI");
    }

    return content;
  } catch (error) {
    console.error("[AI Assistant] Error:", error);
    throw new Error("Failed to get assistant response.");
  }
}

/**
 * Get quick suggestions based on current context
 */
export async function getQuickSuggestions(
  context: AssistantContext,
  language: "norwegian" | "english" = "norwegian"
): Promise<string[]> {
  const systemPrompt = language === "norwegian"
    ? `Du er en salgsassistent. Basert på konteksten, foreslå 4-5 korte handlinger brukeren kan ta.
       Svar i JSON-format: { "suggestions": ["Forslag 1", "Forslag 2", ...] }
       Hold forslagene korte (maks 50 tegn hver).`
    : `You are a sales assistant. Based on context, suggest 4-5 short actions the user can take.
       Respond in JSON format: { "suggestions": ["Suggestion 1", "Suggestion 2", ...] }
       Keep suggestions short (max 50 chars each).`;

  let contextInfo = "";
  if (context.currentLeads?.length) {
    contextInfo += `Leads: ${context.currentLeads.length} aktive\n`;
  }
  if (context.recentActivity?.length) {
    contextInfo += `Aktivitet: ${context.recentActivity.join(', ')}\n`;
  }

  const userPrompt = language === "norwegian"
    ? `Gi meg forslag til hva jeg kan gjøre nå.\n\n${contextInfo || 'Ingen spesifikk kontekst.'}`
    : `Give me suggestions for what I can do now.\n\n${contextInfo || 'No specific context.'}`;

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

    const parsed = JSON.parse(content) as { suggestions: string[] };
    return parsed.suggestions;
  } catch (error) {
    console.error("[AI Assistant] Suggestions error:", error);
    // Return default suggestions on error
    return language === "norwegian"
      ? [
          "Søk etter nye leads",
          "Skriv en salgs-e-post",
          "Se på lead-statistikk",
          "Analyser beste leads"
        ]
      : [
          "Search for new leads",
          "Write a sales email",
          "View lead statistics",
          "Analyze best leads"
        ];
  }
}

/**
 * Analyze a sales conversation and provide coaching
 */
export async function analyzeConversation(
  conversation: string,
  language: "norwegian" | "english" = "norwegian"
): Promise<{
  sentiment: "positive" | "neutral" | "negative";
  keyPoints: string[];
  objections: string[];
  opportunities: string[];
  suggestedResponses: string[];
  coachingTips: string[];
}> {
  const systemPrompt = language === "norwegian"
    ? `Du er en salgscoach som analyserer samtaler.
       Gi konstruktiv tilbakemelding og forslag.
       
       Svar i JSON-format:
       {
         "sentiment": "positive|neutral|negative",
         "keyPoints": ["Hovedpunkt 1", "Hovedpunkt 2"],
         "objections": ["Innvending 1", "Innvending 2"],
         "opportunities": ["Mulighet 1", "Mulighet 2"],
         "suggestedResponses": ["Forslag til svar 1", "Forslag til svar 2"],
         "coachingTips": ["Tips 1", "Tips 2"]
       }`
    : `You are a sales coach analyzing conversations.
       Provide constructive feedback and suggestions.
       
       Respond in JSON format:
       {
         "sentiment": "positive|neutral|negative",
         "keyPoints": ["Key point 1", "Key point 2"],
         "objections": ["Objection 1", "Objection 2"],
         "opportunities": ["Opportunity 1", "Opportunity 2"],
         "suggestedResponses": ["Suggested response 1", "Suggested response 2"],
         "coachingTips": ["Tip 1", "Tip 2"]
       }`;

  const userPrompt = language === "norwegian"
    ? `Analyser denne salgssamtalen:\n\n${conversation}`
    : `Analyze this sales conversation:\n\n${conversation}`;

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
    console.error("[AI Assistant] Conversation analysis error:", error);
    throw new Error("Failed to analyze conversation.");
  }
}

/**
 * Generate objection handling responses
 */
export async function handleObjection(
  objection: string,
  context: {
    product?: string;
    industry?: string;
    previousResponses?: string[];
  },
  language: "norwegian" | "english" = "norwegian"
): Promise<{
  responses: Array<{
    approach: string;
    response: string;
    followUp: string;
  }>;
  tips: string[];
}> {
  const systemPrompt = language === "norwegian"
    ? `Du er en ekspert på å håndtere salgsinnvendinger.
       Gi flere alternative svar med forskjellige tilnærminger.
       
       Svar i JSON-format:
       {
         "responses": [
           {
             "approach": "Tilnærming (f.eks. 'Empatisk', 'Fakta-basert')",
             "response": "Foreslått svar",
             "followUp": "Oppfølgingsspørsmål"
           }
         ],
         "tips": ["Tips for å håndtere denne typen innvending"]
       }`
    : `You are an expert at handling sales objections.
       Provide multiple alternative responses with different approaches.
       
       Respond in JSON format:
       {
         "responses": [
           {
             "approach": "Approach (e.g., 'Empathetic', 'Fact-based')",
             "response": "Suggested response",
             "followUp": "Follow-up question"
           }
         ],
         "tips": ["Tips for handling this type of objection"]
       }`;

  const userPrompt = language === "norwegian"
    ? `Innvending: "${objection}"
       ${context.product ? `Produkt: ${context.product}` : ''}
       ${context.industry ? `Bransje: ${context.industry}` : ''}
       
       Gi meg 3 forskjellige måter å håndtere denne innvendingen på.`
    : `Objection: "${objection}"
       ${context.product ? `Product: ${context.product}` : ''}
       ${context.industry ? `Industry: ${context.industry}` : ''}
       
       Give me 3 different ways to handle this objection.`;

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
    console.error("[AI Assistant] Objection handling error:", error);
    throw new Error("Failed to generate objection responses.");
  }
}

/**
 * Generate a sales pitch based on context
 */
export async function generatePitch(
  context: {
    product: string;
    targetAudience: string;
    uniqueSellingPoints: string[];
    duration: "30s" | "60s" | "2min";
  },
  language: "norwegian" | "english" = "norwegian"
): Promise<{
  pitch: string;
  keyMessages: string[];
  callToAction: string;
  tips: string[];
}> {
  const durationGuide = {
    "30s": language === "norwegian" ? "30 sekunder (ca. 75 ord)" : "30 seconds (about 75 words)",
    "60s": language === "norwegian" ? "60 sekunder (ca. 150 ord)" : "60 seconds (about 150 words)",
    "2min": language === "norwegian" ? "2 minutter (ca. 300 ord)" : "2 minutes (about 300 words)"
  };

  const systemPrompt = language === "norwegian"
    ? `Du er en ekspert på å lage overbevisende salgspitcher.
       Lag en pitch som er engasjerende og fokusert på verdi.
       
       Svar i JSON-format:
       {
         "pitch": "Selve pitchen",
         "keyMessages": ["Hovedbudskap 1", "Hovedbudskap 2"],
         "callToAction": "Call-to-action",
         "tips": ["Tips for leveransen"]
       }`
    : `You are an expert at creating compelling sales pitches.
       Create a pitch that is engaging and value-focused.
       
       Respond in JSON format:
       {
         "pitch": "The pitch itself",
         "keyMessages": ["Key message 1", "Key message 2"],
         "callToAction": "Call-to-action",
         "tips": ["Delivery tips"]
       }`;

  const userPrompt = language === "norwegian"
    ? `Lag en salgspitch:
       
       Produkt/tjeneste: ${context.product}
       Målgruppe: ${context.targetAudience}
       Unike salgsargumenter: ${context.uniqueSellingPoints.join(', ')}
       Varighet: ${durationGuide[context.duration]}
       
       Pitchen skal være naturlig å si høyt og engasjerende.`
    : `Create a sales pitch:
       
       Product/service: ${context.product}
       Target audience: ${context.targetAudience}
       Unique selling points: ${context.uniqueSellingPoints.join(', ')}
       Duration: ${durationGuide[context.duration]}
       
       The pitch should be natural to say out loud and engaging.`;

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
    console.error("[AI Assistant] Pitch generation error:", error);
    throw new Error("Failed to generate pitch.");
  }
}
