/**
 * Stripe Products and Pricing Configuration
 * Centralized product definitions for subscription plans
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  stripePriceId: string; // Set this after creating prices in Stripe Dashboard
  features: string[];
  popular?: boolean;
  limits: {
    companiesPerMonth: number;
    campaignsPerMonth: number;
    emailsPerMonth: number;
    sequences: number;
    templates: number;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    priceMonthly: 499,
    currency: "NOK",
    stripePriceId: process.env.STRIPE_PRICE_ID_BASIC || "price_basic_placeholder",
    features: [
      "Søk i 1.1M norske bedrifter",
      "Inntil 1,000 bedrifter per måned",
      "5 aktive kampanjer",
      "5,000 e-poster per måned",
      "Grunnleggende e-postmaler",
      "E-postsporing (åpninger, klikk)",
      "Grunnleggende analyse",
    ],
    limits: {
      companiesPerMonth: 1000,
      campaignsPerMonth: 5,
      emailsPerMonth: 5000,
      sequences: 3,
      templates: 10,
    },
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 1299,
    currency: "NOK",
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO || "price_pro_placeholder",
    popular: true,
    features: [
      "Alt i Basic, pluss:",
      "Ubegrenset søk i bedrifter",
      "Ubegrenset antall kampanjer",
      "25,000 e-poster per måned",
      "Avanserte e-postsekvenser",
      "Ubegrenset antall maler",
      "Avansert analyse og rapporter",
      "A/B testing av e-poster",
      "Prioritert support",
      "API-tilgang",
    ],
    limits: {
      companiesPerMonth: -1, // -1 = unlimited
      campaignsPerMonth: -1,
      emailsPerMonth: 25000,
      sequences: -1,
      templates: -1,
    },
  },
];

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}

/**
 * Get plan by Stripe Price ID
 */
export function getPlanByStripePriceId(stripePriceId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.stripePriceId === stripePriceId);
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = "NOK"): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
