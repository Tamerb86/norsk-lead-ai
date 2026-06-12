import { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";

// Lazy singleton: constructing Stripe with an empty key throws, which would
// crash the whole process on the first webhook request when the key is unset.
let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

/**
 * Stripe Webhook Handler
 * Handles subscription events from Stripe
 */
// Idempotency: remember recently processed event ids so Stripe retries /
// replays don't re-run handlers (best-effort, in-memory).
const MAX_PROCESSED_EVENTS = 5000;
const processedStripeEvents = new Set<string>();

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).send("Missing signature");
  }

  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    // Never verify against an empty secret — fail closed.
    console.error("[Stripe Webhook] Stripe not configured - rejecting webhook");
    return res.status(503).send("Webhook not configured");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send("Webhook signature verification failed");
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  // Skip already-processed events (Stripe retries, replays)
  if (processedStripeEvents.has(event.id)) {
    console.log(`[Stripe Webhook] Event ${event.id} already processed, skipping`);
    return res.json({ received: true });
  }
  processedStripeEvents.add(event.id);
  if (processedStripeEvents.size > MAX_PROCESSED_EVENTS) {
    const it = processedStripeEvents.values();
    for (let i = 0; i < 500; i++) {
      const next = it.next();
      if (next.done) break;
      processedStripeEvents.delete(next.value);
    }
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).send("Webhook processing failed");
  }
}

/**
 * Handle checkout session completed
 * Creates or updates user subscription in database
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[Stripe] Checkout completed:", session.id);

  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !planId) {
    console.error("[Stripe] Missing metadata in checkout session");
    return;
  }

  try {
    // Update user subscription in database
    await db.updateUserSubscription({
      userId: parseInt(userId),
      planId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
    });

    console.log(`[Stripe] User ${userId} subscribed to plan ${planId}`);
  } catch (error) {
    console.error("[Stripe] Failed to update user subscription:", error);
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("[Stripe] Subscription created:", subscription.id);

  const customerId = subscription.customer as string;
  const status = subscription.status;
  // current_period_end moved to the subscription item in newer Stripe API versions
  const periodEndUnix =
    (subscription as any).current_period_end ??
    subscription.items?.data?.[0]?.current_period_end;
  const periodEnd = new Date(periodEndUnix * 1000);

  try {
    await db.updateSubscriptionByStripeCustomerId({
      stripeCustomerId: customerId,
      status,
      periodEnd,
    });
    console.log(`[Stripe] Customer ${customerId} subscription status: ${status}`);
  } catch (error) {
    console.error("[Stripe] Failed to update subscription:", error);
  }
}

/**
 * Handle subscription updated
 * Updates subscription status or plan changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("[Stripe] Subscription updated:", subscription.id);

  const customerId = subscription.customer as string;
  const status = subscription.status;
  // current_period_end moved to the subscription item in newer Stripe API versions
  const periodEndUnix =
    (subscription as any).current_period_end ??
    subscription.items?.data?.[0]?.current_period_end;
  const periodEnd = new Date(periodEndUnix * 1000);

  try {
    await db.updateSubscriptionByStripeCustomerId({
      stripeCustomerId: customerId,
      status,
      periodEnd,
    });
    console.log(`[Stripe] Customer ${customerId} subscription updated to: ${status}`);
  } catch (error) {
    console.error("[Stripe] Failed to update subscription:", error);
  }
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[Stripe] Subscription deleted:", subscription.id);

  const customerId = subscription.customer as string;

  try {
    await db.cancelSubscriptionByStripeCustomerId(customerId);
    console.log(`[Stripe] Customer ${customerId} subscription cancelled`);
  } catch (error) {
    console.error("[Stripe] Failed to cancel subscription:", error);
  }
}

/**
 * Handle invoice paid
 * Confirms successful payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("[Stripe] Invoice paid:", invoice.id);

  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;

  // Log payment
  console.log(`[Stripe] Customer ${customerId} paid invoice for subscription ${subscriptionId}`);
}

/**
 * Handle invoice payment failed
 * Notifies about failed payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("[Stripe] Invoice payment failed:", invoice.id);

  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;

  try {
    // Update subscription status to past_due
    await db.updateSubscriptionByStripeCustomerId({
      stripeCustomerId: customerId,
      status: 'past_due',
    });
    console.log(`[Stripe] Customer ${customerId} payment failed for subscription ${subscriptionId}`);
  } catch (error) {
    console.error("[Stripe] Failed to update subscription status:", error);
  }
}
