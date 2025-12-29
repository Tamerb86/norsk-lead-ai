/**
 * Reply Classifier System
 * تصنيف الردود باستخدام Regular Expressions
 */

import { db, createEmailEventNotification } from "../db";
import { emails, leads, emailEvents, campaigns } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendWebhook } from "./webhooks";
import { createScheduledJob, JOB_TYPES } from "./scheduledJobs";

// تصنيفات الردود
export const REPLY_CATEGORIES = {
  INTERESTED: "interested",           // مهتم
  NOT_INTERESTED: "not_interested",   // غير مهتم
  MEETING_REQUEST: "meeting_request", // طلب اجتماع
  MORE_INFO: "more_info",             // طلب معلومات إضافية
  UNSUBSCRIBE: "unsubscribe",         // إلغاء الاشتراك
  OUT_OF_OFFICE: "out_of_office",     // خارج المكتب
  BOUNCE: "bounce",                   // ارتداد
  REFERRAL: "referral",               // إحالة لشخص آخر
  PRICING: "pricing",                 // استفسار عن السعر
  NEUTRAL: "neutral",                 // محايد
  SPAM: "spam",                       // بريد مزعج
} as const;

export type ReplyCategory = typeof REPLY_CATEGORIES[keyof typeof REPLY_CATEGORIES];

// قواعد التصنيف (Regex patterns)
interface ClassificationRule {
  category: ReplyCategory;
  patterns: RegExp[];
  priority: number; // أعلى = أولوية أكبر
  action?: string;  // إجراء تلقائي
}

// قواعد التصنيف باللغة الإنجليزية والنرويجية
const CLASSIFICATION_RULES: ClassificationRule[] = [
  // إلغاء الاشتراك (أعلى أولوية)
  {
    category: REPLY_CATEGORIES.UNSUBSCRIBE,
    patterns: [
      /\b(unsubscribe|remove me|stop (emailing|contacting)|opt[- ]?out)\b/i,
      /\b(avmeld|fjern meg|slutt å (sende|kontakte)|ikke kontakt)\b/i,
      /\b(ta meg av listen|ikke interessert lenger)\b/i,
    ],
    priority: 100,
    action: "unsubscribe_lead",
  },

  // خارج المكتب
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

  // ارتداد
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

  // طلب اجتماع
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
    action: "notify_sales",
  },

  // مهتم
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
    action: "notify_sales",
  },

  // استفسار عن السعر
  {
    category: REPLY_CATEGORIES.PRICING,
    patterns: [
      /\b(price|pricing|cost|how much|quote|budget)\b/i,
      /\b(what (does it|do you) (cost|charge)|rates|fees)\b/i,
      /\b(pris|kostnad|hvor mye|tilbud|budsjett)\b/i,
      /\b(hva koster|prisliste|prisforespørsel)\b/i,
    ],
    priority: 65,
    action: "send_pricing",
  },

  // طلب معلومات إضافية
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
    action: "send_info",
  },

  // إحالة لشخص آخر
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
    action: "update_contact",
  },

  // غير مهتم
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
    priority: 50,
    action: "mark_not_interested",
  },

  // بريد مزعج
  {
    category: REPLY_CATEGORIES.SPAM,
    patterns: [
      /\b(spam|junk|reported|blocked|blacklist)\b/i,
      /\b(stop spamming|harassment|legal action)\b/i,
      /\b(søppelpost|blokkert|rapportert)\b/i,
    ],
    priority: 95,
    action: "unsubscribe_lead",
  },
];

// نتيجة التصنيف
export interface ClassificationResult {
  category: ReplyCategory;
  confidence: number;      // 0-100
  matchedPatterns: string[];
  suggestedAction: string | null;
  sentiment: "positive" | "negative" | "neutral";
}

/**
 * تصنيف رد البريد الإلكتروني
 */
export function classifyReply(content: string): ClassificationResult {
  const normalizedContent = normalizeText(content);
  const matches: { rule: ClassificationRule; patterns: string[] }[] = [];

  // البحث عن التطابقات
  for (const rule of CLASSIFICATION_RULES) {
    const matchedPatterns: string[] = [];
    
    for (const pattern of rule.patterns) {
      if (pattern.test(normalizedContent)) {
        matchedPatterns.push(pattern.source);
      }
    }

    if (matchedPatterns.length > 0) {
      matches.push({ rule, patterns: matchedPatterns });
    }
  }

  // إذا لم يوجد تطابق
  if (matches.length === 0) {
    return {
      category: REPLY_CATEGORIES.NEUTRAL,
      confidence: 50,
      matchedPatterns: [],
      suggestedAction: null,
      sentiment: "neutral",
    };
  }

  // اختيار التصنيف الأعلى أولوية
  matches.sort((a, b) => b.rule.priority - a.rule.priority);
  const bestMatch = matches[0];

  // حساب الثقة
  const confidence = calculateConfidence(bestMatch.patterns.length, bestMatch.rule.priority);

  // تحديد المشاعر
  const sentiment = determineSentiment(bestMatch.rule.category);

  return {
    category: bestMatch.rule.category,
    confidence,
    matchedPatterns: bestMatch.patterns,
    suggestedAction: bestMatch.rule.action || null,
    sentiment,
  };
}

/**
 * تطبيع النص
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .trim();
}

/**
 * حساب مستوى الثقة
 */
function calculateConfidence(matchCount: number, priority: number): number {
  // الثقة الأساسية من الأولوية
  let confidence = Math.min(priority, 80);
  
  // زيادة الثقة بناءً على عدد التطابقات
  confidence += Math.min(matchCount * 5, 20);
  
  return Math.min(confidence, 100);
}

/**
 * تحديد المشاعر
 */
function determineSentiment(category: ReplyCategory): "positive" | "negative" | "neutral" {
  const positive = [
    REPLY_CATEGORIES.INTERESTED,
    REPLY_CATEGORIES.MEETING_REQUEST,
    REPLY_CATEGORIES.MORE_INFO,
    REPLY_CATEGORIES.PRICING,
  ];
  
  const negative = [
    REPLY_CATEGORIES.NOT_INTERESTED,
    REPLY_CATEGORIES.UNSUBSCRIBE,
    REPLY_CATEGORIES.SPAM,
    REPLY_CATEGORIES.BOUNCE,
  ];

  if (positive.includes(category)) return "positive";
  if (negative.includes(category)) return "negative";
  return "neutral";
}

/**
 * معالجة رد البريد الإلكتروني
 */
export async function processEmailReply(
  emailId: number,
  replyContent: string,
  replyFrom: string
): Promise<ClassificationResult> {
  // تصنيف الرد
  const classification = classifyReply(replyContent);

  // الحصول على معلومات البريد الأصلي
  const [email] = await db
    .select()
    .from(emails)
    .where(eq(emails.id, emailId))
    .limit(1);

  if (!email) {
    console.error(`[Classifier] Email ${emailId} not found`);
    return classification;
  }

  // تسجيل حدث الرد
  await db.insert(emailEvents).values({
    emailId,
    eventType: "replied",
    occurredAt: new Date(),
    metadata: JSON.stringify({
      classification,
      replyFrom,
      replyPreview: replyContent.substring(0, 200),
    }),
  });

  // تحديث حالة البريد
  await db
    .update(emails)
    .set({
      status: "replied",
      repliedAt: new Date(),
      replyCategory: classification.category,
    })
    .where(eq(emails.id, emailId));

  // تنفيذ الإجراء المقترح
  if (classification.suggestedAction && email.leadId) {
    await executeAction(classification.suggestedAction, email.leadId, email.campaignId, classification);
  }

  // إنشاء إشعار للمستخدم
  try {
    if (email.campaignId) {
      const campaign = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, email.campaignId),
      });
      if (campaign && campaign.userId) {
        await createEmailEventNotification({
          userId: campaign.userId,
          eventType: 'reply',
          companyName: email.recipientName || 'Ukjent',
          email: email.recipientEmail,
          campaignId: email.campaignId,
        });
      }
    }
  } catch (notifError) {
    console.error('[Classifier] Error creating reply notification:', notifError);
  }

  // إرسال Webhook
  await sendWebhook("email.replied", {
    emailId,
    campaignId: email.campaignId,
    leadId: email.leadId,
    classification,
    repliedAt: new Date().toISOString(),
  });

  console.log(
    `[Classifier] Email ${emailId} classified as ${classification.category} ` +
    `(confidence: ${classification.confidence}%, sentiment: ${classification.sentiment})`
  );

  return classification;
}

/**
 * تنفيذ الإجراء التلقائي
 */
async function executeAction(
  action: string,
  leadId: number,
  campaignId: number | null,
  classification: ClassificationResult
): Promise<void> {
  console.log(`[Classifier] Executing action: ${action} for lead ${leadId}`);

  switch (action) {
    case "unsubscribe_lead":
      await db
        .update(leads)
        .set({
          status: "unsubscribed",
          unsubscribedAt: new Date(),
        })
        .where(eq(leads.id, leadId));
      break;

    case "mark_not_interested":
      await db
        .update(leads)
        .set({
          status: "not_interested",
          lastContactedAt: new Date(),
        })
        .where(eq(leads.id, leadId));
      break;

    case "mark_invalid_email":
      await db
        .update(leads)
        .set({
          emailValid: false,
          status: "invalid",
        })
        .where(eq(leads.id, leadId));
      break;

    case "notify_sales":
      // إنشاء إشعار للمبيعات
      await sendWebhook("lead.hot", {
        leadId,
        campaignId,
        classification,
        priority: "high",
      });
      break;

    case "schedule_followup":
      // جدولة متابعة بعد أسبوع
      await createScheduledJob(
        JOB_TYPES.FOLLOW_UP,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        {
          leadId,
          campaignId,
          reason: "out_of_office_return",
        }
      );
      break;

    case "send_pricing":
      // جدولة إرسال معلومات الأسعار
      await createScheduledJob(
        JOB_TYPES.SEND_EMAIL,
        new Date(),
        {
          leadId,
          templateId: "pricing_template",
          campaignId,
        }
      );
      break;

    case "send_info":
      // جدولة إرسال معلومات إضافية
      await createScheduledJob(
        JOB_TYPES.SEND_EMAIL,
        new Date(),
        {
          leadId,
          templateId: "more_info_template",
          campaignId,
        }
      );
      break;

    case "update_contact":
      // تحديث حالة جهة الاتصال
      await db
        .update(leads)
        .set({
          status: "referral",
          notes: "Referred to another contact",
        })
        .where(eq(leads.id, leadId));
      break;
  }
}

/**
 * تحليل مجموعة من الردود
 */
export async function analyzeReplies(emailIds: number[]): Promise<{
  total: number;
  byCategory: Record<ReplyCategory, number>;
  bySentiment: Record<string, number>;
  avgConfidence: number;
}> {
  const results: ClassificationResult[] = [];

  for (const emailId of emailIds) {
    const [email] = await db
      .select()
      .from(emails)
      .where(eq(emails.id, emailId))
      .limit(1);

    if (email?.replyContent) {
      results.push(classifyReply(email.replyContent));
    }
  }

  // إحصائيات
  const byCategory: Record<string, number> = {};
  const bySentiment: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };
  let totalConfidence = 0;

  for (const result of results) {
    byCategory[result.category] = (byCategory[result.category] || 0) + 1;
    bySentiment[result.sentiment]++;
    totalConfidence += result.confidence;
  }

  return {
    total: results.length,
    byCategory: byCategory as Record<ReplyCategory, number>,
    bySentiment,
    avgConfidence: results.length > 0 ? totalConfidence / results.length : 0,
  };
}

/**
 * إضافة قاعدة تصنيف مخصصة
 */
export function addCustomRule(
  category: ReplyCategory,
  patterns: string[],
  priority: number = 50,
  action?: string
): void {
  const regexPatterns = patterns.map(p => new RegExp(p, "i"));
  
  CLASSIFICATION_RULES.push({
    category,
    patterns: regexPatterns,
    priority,
    action,
  });

  // إعادة ترتيب القواعد حسب الأولوية
  CLASSIFICATION_RULES.sort((a, b) => b.priority - a.priority);
}

export default {
  classifyReply,
  processEmailReply,
  analyzeReplies,
  addCustomRule,
  REPLY_CATEGORIES,
};
