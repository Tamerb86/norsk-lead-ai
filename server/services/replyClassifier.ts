/**
 * Reply Classifier — pure, dependency-free classification of inbound email
 * replies (Norwegian + English). Extracted from the dead `smartRules` module
 * and stripped of its MySQL/`emails`-table coupling so it can back the lead
 * follow-up agent on Postgres.
 *
 * This module performs NO database or network I/O — it only maps reply text to
 * a category, confidence, sentiment, and a suggested agent action. Callers
 * decide what to do with the result.
 */

export const REPLY_CATEGORIES = {
  INTERESTED: "interested",
  NOT_INTERESTED: "not_interested",
  MEETING_REQUEST: "meeting_request",
  MORE_INFO: "more_info",
  UNSUBSCRIBE: "unsubscribe",
  OUT_OF_OFFICE: "out_of_office",
  BOUNCE: "bounce",
  REFERRAL: "referral",
  PRICING: "pricing",
  NEUTRAL: "neutral",
  SPAM: "spam",
} as const;

export type ReplyCategory = (typeof REPLY_CATEGORIES)[keyof typeof REPLY_CATEGORIES];

/**
 * Agent action suggested per category. The orchestrator maps these to concrete
 * behaviour (draft a reply, stop the lead, notify the owner, etc.).
 */
export type SuggestedAction =
  | "stop_unsubscribe"
  | "stop_not_interested"
  | "mark_invalid_email"
  | "draft_meeting"
  | "draft_reply"
  | "draft_pricing"
  | "draft_info"
  | "notify_owner_referral"
  | "schedule_followup"
  | "review";

interface ClassificationRule {
  category: ReplyCategory;
  patterns: RegExp[];
  priority: number; // higher wins
  action: SuggestedAction;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    category: REPLY_CATEGORIES.UNSUBSCRIBE,
    patterns: [
      /\b(unsubscribe|remove me|stop (emailing|contacting)|opt[- ]?out)\b/i,
      /\b(avmeld|fjern meg|slutt å (sende|kontakte)|ikke kontakt)\b/i,
      /\b(ta meg av listen|ikke interessert lenger)\b/i,
    ],
    priority: 100,
    action: "stop_unsubscribe",
  },
  {
    category: REPLY_CATEGORIES.SPAM,
    patterns: [
      /\b(spam|junk|reported|blocked|blacklist)\b/i,
      /\b(stop spamming|harassment|legal action)\b/i,
      /\b(søppelpost|blokkert|rapportert)\b/i,
    ],
    priority: 95,
    action: "stop_unsubscribe",
  },
  {
    category: REPLY_CATEGORIES.OUT_OF_OFFICE,
    patterns: [
      /\b(out of (the )?office|on (vacation|holiday|leave)|away from|auto[- ]?reply)\b/i,
      /\b(ikke på kontoret|på ferie|borte fra|automatisk svar)\b/i,
      /\b(tilbake (den|\d)|kommer tilbake|fraværende)\b/i,
      /\b(will (be back|return)|currently (unavailable|away))\b/i,
    ],
    priority: 90,
    action: "schedule_followup",
  },
  {
    category: REPLY_CATEGORIES.BOUNCE,
    patterns: [
      /\b(delivery (failed|status)|undeliverable|mailbox (full|not found))\b/i,
      /\b(address rejected|user unknown|does not exist)\b/i,
      /\b(permanent (failure|error)|550|553|554)\b/i,
      /\b(kunne ikke leveres|ukjent adresse|postboks full)\b/i,
    ],
    priority: 85,
    action: "mark_invalid_email",
  },
  {
    category: REPLY_CATEGORIES.MEETING_REQUEST,
    patterns: [
      /\b(schedule|book|set up|arrange).{0,20}(meeting|call|demo|appointment)\b/i,
      /\b(let'?s (meet|talk|discuss|connect)|available (for|to meet))\b/i,
      /\b(can we (meet|talk|schedule)|when (are you|can we) (free|available))\b/i,
      /\b(avtal|book|sett opp).{0,20}(møte|samtale|demo)\b/i,
      /\b(la oss (møtes|snakke)|når (passer|kan vi))\b/i,
      /\b(send (me|over) (your|a) calendar|calendly|book a time)\b/i,
    ],
    priority: 80,
    action: "draft_meeting",
  },
  {
    category: REPLY_CATEGORIES.INTERESTED,
    patterns: [
      /\b(interested|sounds (good|great|interesting)|tell me more)\b/i,
      /\b(yes[,!]? (please|i'?m|we'?re)|definitely|absolutely)\b/i,
      /\b(love to (learn|hear|know)|would like to|want to (know|learn))\b/i,
      /\b(interessert|høres (bra|interessant) ut|fortell meg mer)\b/i,
      /\b(ja[,!]? (gjerne|takk)|absolutt|definitivt)\b/i,
      /\b(vil gjerne (vite|høre|lære)|ønsker å)\b/i,
      /\b(this is (exactly|just) what|perfect (timing|fit))\b/i,
    ],
    priority: 70,
    action: "draft_reply",
  },
  {
    category: REPLY_CATEGORIES.PRICING,
    patterns: [
      /\b(price|pricing|cost|how much|quote|budget)\b/i,
      /\b(what (does it|do you) (cost|charge)|rates|fees)\b/i,
      /\b(pris|kostnad|hvor mye|tilbud|budsjett)\b/i,
      /\b(hva koster|prisliste|prisforespørsel)\b/i,
    ],
    priority: 65,
    action: "draft_pricing",
  },
  {
    category: REPLY_CATEGORIES.MORE_INFO,
    patterns: [
      /\b(more (info|information|details)|can you (explain|elaborate|clarify))\b/i,
      /\b(how (does it|do you)|what (is|are)|tell me (about|more))\b/i,
      /\b(send (me|over|us) (more|some|the) (info|details|documentation))\b/i,
      /\b(mer (info|informasjon|detaljer)|kan du (forklare|utdype))\b/i,
      /\b(hvordan (fungerer|virker)|hva (er|betyr)|fortell (om|mer))\b/i,
      /\b(brochure|datasheet|case study|whitepaper)\b/i,
    ],
    priority: 60,
    action: "draft_info",
  },
  {
    category: REPLY_CATEGORIES.REFERRAL,
    patterns: [
      /\b(contact|reach out to|speak (with|to)|forward.{0,10}to)\b.{0,30}(colleague|manager|boss|team)\b/i,
      /\b(not the right person|wrong (person|department)|try contacting)\b/i,
      /\b(cc'?ing|copying|looping in|adding)\b.{0,20}(colleague|manager)\b/i,
      /\b(kontakt|snakk med|videresend til).{0,20}(kollega|sjef|leder)\b/i,
      /\b(feil person|feil avdeling|prøv å kontakte)\b/i,
    ],
    priority: 55,
    action: "notify_owner_referral",
  },
  {
    category: REPLY_CATEGORIES.NOT_INTERESTED,
    patterns: [
      /\b(not interested|no thanks?|don'?t (need|want)|pass on this)\b/i,
      /\b(we'?re (good|all set|not looking)|already (have|using|working with))\b/i,
      /\b(not (a good fit|right for us|what we need)|doesn'?t (fit|work))\b/i,
      /\b(ikke interessert|nei takk|trenger ikke|har allerede)\b/i,
      /\b(passer ikke|ikke aktuelt|ikke relevant)\b/i,
      /\b(maybe (later|next year|in the future)|not (now|at this time))\b/i,
    ],
    // Must outrank INTERESTED (70): the negations "not interested" / "ikke
    // interessert" both contain the positive token "interested"/"interessert",
    // so without higher priority a rejection would be misread as interest and
    // could trigger an automated reply. Stopping wins ties.
    priority: 72,
    action: "stop_not_interested",
  },
];

export interface ClassificationResult {
  category: ReplyCategory;
  confidence: number; // 0-100
  matchedPatterns: string[];
  suggestedAction: SuggestedAction;
  sentiment: "positive" | "negative" | "neutral";
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}

function calculateConfidence(matchCount: number, priority: number): number {
  let confidence = Math.min(priority, 80);
  confidence += Math.min(matchCount * 5, 20);
  return Math.min(confidence, 100);
}

const POSITIVE: ReplyCategory[] = [
  REPLY_CATEGORIES.INTERESTED,
  REPLY_CATEGORIES.MEETING_REQUEST,
  REPLY_CATEGORIES.MORE_INFO,
  REPLY_CATEGORIES.PRICING,
];
const NEGATIVE: ReplyCategory[] = [
  REPLY_CATEGORIES.NOT_INTERESTED,
  REPLY_CATEGORIES.UNSUBSCRIBE,
  REPLY_CATEGORIES.SPAM,
  REPLY_CATEGORIES.BOUNCE,
];

function determineSentiment(category: ReplyCategory): "positive" | "negative" | "neutral" {
  if (POSITIVE.includes(category)) return "positive";
  if (NEGATIVE.includes(category)) return "negative";
  return "neutral";
}

/**
 * Categories whose suggested action stops/changes the lead WITHOUT sending an
 * automated reply — used by the orchestrator's "stop on negative" guardrail.
 */
export function isTerminalCategory(category: ReplyCategory): boolean {
  return (
    category === REPLY_CATEGORIES.UNSUBSCRIBE ||
    category === REPLY_CATEGORIES.SPAM ||
    category === REPLY_CATEGORIES.NOT_INTERESTED ||
    category === REPLY_CATEGORIES.BOUNCE
  );
}

/**
 * Classify a reply body. Pure function — safe to unit test and call anywhere.
 */
export function classifyReply(content: string): ClassificationResult {
  const normalized = normalizeText(content || "");
  const matches: { rule: ClassificationRule; patterns: string[] }[] = [];

  for (const rule of CLASSIFICATION_RULES) {
    const matchedPatterns: string[] = [];
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) matchedPatterns.push(pattern.source);
    }
    if (matchedPatterns.length > 0) matches.push({ rule, patterns: matchedPatterns });
  }

  if (matches.length === 0) {
    return {
      category: REPLY_CATEGORIES.NEUTRAL,
      confidence: 50,
      matchedPatterns: [],
      suggestedAction: "review",
      sentiment: "neutral",
    };
  }

  matches.sort((a, b) => b.rule.priority - a.rule.priority);
  const best = matches[0];

  return {
    category: best.rule.category,
    confidence: calculateConfidence(best.patterns.length, best.rule.priority),
    matchedPatterns: best.patterns,
    suggestedAction: best.rule.action,
    sentiment: determineSentiment(best.rule.category),
  };
}

/**
 * Strip quoted history from a reply so classification (and later, the LLM)
 * sees only the new message. Handles common Norwegian + English quote markers.
 */
export function stripQuotedReply(body: string): string {
  if (!body) return "";
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  const cutMarkers = [
    /^>/, // quoted line
    /^On .+ wrote:$/i,
    /^.+ skrev:$/i, // Norwegian "X wrote:"
    /^-+\s*Original Message\s*-+/i,
    /^_{5,}$/, // Outlook divider
    /^Fra:\s/i, // Norwegian "From:"
    /^From:\s/i,
    /^Sendt:\s/i,
  ];
  for (const line of lines) {
    if (cutMarkers.some((re) => re.test(line.trim()))) break;
    out.push(line);
  }
  return out.join("\n").trim() || body.trim();
}
