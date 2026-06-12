import { invokeLLM } from "../_core/llm";

export interface EmailGenerationRequest {
  companyName: string;
  industry?: string;
  location?: string;
  contactName?: string;
  purpose: "sales" | "partnership" | "introduction" | "followup" | "custom";
  customPurpose?: string;
  tone: "formal" | "friendly" | "professional";
  language: "norwegian" | "english";
  additionalContext?: string;
  productOrService?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  tips?: string[];
}

/**
 * Defense-in-depth against prompt injection: third-party data (company names
 * come from BRREG/website scraping) is flattened to a single line and
 * length-capped before being embedded in prompts.
 */
function sanitizePromptField(text: string, maxLength: number = 300): string {
  return text
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

const TONE_DESCRIPTIONS = {
  formal: "formelt og profesjonelt",
  friendly: "vennlig og uformelt",
  professional: "profesjonelt men tilgjengelig"
};

const PURPOSE_DESCRIPTIONS = {
  sales: "selge et produkt eller tjeneste",
  partnership: "foreslå et samarbeid eller partnerskap",
  introduction: "introdusere deg selv og din bedrift",
  followup: "følge opp en tidligere samtale eller møte",
  custom: ""
};

export async function generateEmail(request: EmailGenerationRequest): Promise<GeneratedEmail> {
  const { purpose, tone, language } = request;
  const companyName = sanitizePromptField(request.companyName);
  const industry = request.industry && sanitizePromptField(request.industry);
  const location = request.location && sanitizePromptField(request.location);
  const contactName = request.contactName && sanitizePromptField(request.contactName);
  const customPurpose = request.customPurpose && sanitizePromptField(request.customPurpose, 500);
  const additionalContext = request.additionalContext && sanitizePromptField(request.additionalContext, 1000);
  const productOrService = request.productOrService && sanitizePromptField(request.productOrService, 500);

  const toneDesc = TONE_DESCRIPTIONS[tone];
  const purposeDesc = purpose === "custom" ? customPurpose : PURPOSE_DESCRIPTIONS[purpose];

  const systemPrompt = language === "norwegian" 
    ? `Du er en ekspert på å skrive profesjonelle forretnings-e-poster på norsk (bokmål).
       Du skal skrive e-poster som er:
       - Klare og konsise
       - Kulturelt passende for det norske markedet
       - Effektive for å oppnå målet
       
       Svar alltid i JSON-format med følgende struktur:
       {
         "subject": "E-postens emnelinje",
         "body": "E-postens innhold",
         "tips": ["Tips 1", "Tips 2"]
       }`
    : `You are an expert at writing professional business emails.
       You write emails that are:
       - Clear and concise
       - Culturally appropriate
       - Effective at achieving the goal
       
       Always respond in JSON format with this structure:
       {
         "subject": "Email subject line",
         "body": "Email body content",
         "tips": ["Tip 1", "Tip 2"]
       }`;

  const userPrompt = language === "norwegian"
    ? `Skriv en ${toneDesc} e-post til ${companyName}${contactName ? ` (kontaktperson: ${contactName})` : ''}.
       
       Formål: ${purposeDesc}
       ${industry ? `Bransje: ${industry}` : ''}
       ${location ? `Lokasjon: ${location}` : ''}
       ${productOrService ? `Produkt/tjeneste å tilby: ${productOrService}` : ''}
       ${additionalContext ? `Tilleggsinformasjon: ${additionalContext}` : ''}
       
       Viktig:
       - Hold e-posten kort og presis (maks 150 ord)
       - Inkluder en tydelig call-to-action
       - Bruk profesjonell norsk
       - Ikke bruk for mye "jeg" - fokuser på verdien for mottakeren`
    : `Write a ${tone} email to ${companyName}${contactName ? ` (contact: ${contactName})` : ''}.
       
       Purpose: ${purposeDesc}
       ${industry ? `Industry: ${industry}` : ''}
       ${location ? `Location: ${location}` : ''}
       ${productOrService ? `Product/service to offer: ${productOrService}` : ''}
       ${additionalContext ? `Additional context: ${additionalContext}` : ''}
       
       Important:
       - Keep the email short and concise (max 150 words)
       - Include a clear call-to-action
       - Focus on value for the recipient`;

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

    const parsed = JSON.parse(content) as GeneratedEmail;
    return parsed;
  } catch (error) {
    console.error("[AI Email Writer] Error:", error);
    throw new Error("Failed to generate email. Please try again.");
  }
}

export async function improveEmail(
  originalEmail: string,
  instruction: string,
  language: "norwegian" | "english" = "norwegian"
): Promise<GeneratedEmail> {
  const systemPrompt = language === "norwegian"
    ? `Du er en ekspert på å forbedre forretnings-e-poster på norsk.
       Svar alltid i JSON-format:
       {
         "subject": "Forbedret emnelinje",
         "body": "Forbedret e-postinnhold",
         "tips": ["Hva som ble forbedret"]
       }`
    : `You are an expert at improving business emails.
       Always respond in JSON format:
       {
         "subject": "Improved subject line",
         "body": "Improved email content",
         "tips": ["What was improved"]
       }`;

  const userPrompt = language === "norwegian"
    ? `Forbedre denne e-posten basert på instruksjonen:
       
       Original e-post:
       ${originalEmail}
       
       Instruksjon: ${instruction}`
    : `Improve this email based on the instruction:
       
       Original email:
       ${originalEmail}
       
       Instruction: ${instruction}`;

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

    return JSON.parse(content) as GeneratedEmail;
  } catch (error) {
    console.error("[AI Email Writer] Improve error:", error);
    throw new Error("Failed to improve email. Please try again.");
  }
}

export async function generateSubjectVariants(
  emailBody: string,
  count: number = 3,
  language: "norwegian" | "english" = "norwegian"
): Promise<string[]> {
  const systemPrompt = language === "norwegian"
    ? `Du er en ekspert på å skrive fengende e-postemnelinjer.
       Svar alltid i JSON-format: { "subjects": ["Emnelinje 1", "Emnelinje 2", ...] }`
    : `You are an expert at writing compelling email subject lines.
       Always respond in JSON format: { "subjects": ["Subject 1", "Subject 2", ...] }`;

  const userPrompt = language === "norwegian"
    ? `Generer ${count} forskjellige emnelinjer for denne e-posten:
       
       ${emailBody}
       
       Krav:
       - Korte og fengende (maks 50 tegn)
       - Variér mellom spørsmål, tall, og direkte utsagn
       - Unngå spam-ord`
    : `Generate ${count} different subject lines for this email:
       
       ${emailBody}
       
       Requirements:
       - Short and compelling (max 50 characters)
       - Vary between questions, numbers, and direct statements
       - Avoid spam words`;

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

    const parsed = JSON.parse(content) as { subjects: string[] };
    return parsed.subjects;
  } catch (error) {
    console.error("[AI Email Writer] Subject variants error:", error);
    throw new Error("Failed to generate subject variants.");
  }
}
