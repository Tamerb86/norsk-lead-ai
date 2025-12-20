import { Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

/**
 * Stripe Webhook Handler
 * Handles subscription events from Stripe
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
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

  // TODO: Update user subscription in database
  // await db.updateUserSubscription({
  //   userId: parseInt(userId),
  //   planId,
  //   stripeCustomerId: customerId,
  //   stripeSubscriptionId: subscriptionId,
  //   status: 'active',
  // });

  console.log(`[Stripe] User ${userId} subscribed to plan ${planId}`);
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("[Stripe] Subscription created:", subscription.id);

  const customerId = subscription.customer as string;
  const status = subscription.status;

  // TODO: Update subscription status in database
  console.log(`[Stripe] Customer ${customerId} subscription status: ${status}`);
}

/**
 * Handle subscription updated
 * Updates subscription status or plan changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("[Stripe] Subscription updated:", subscription.id);

  const customerId = subscription.customer as string;
  const status = subscription.status;

  // TODO: Update subscription status in database
  console.log(`[Stripe] Customer ${customerId} subscription updated to: ${status}`);
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[Stripe] Subscription deleted:", subscription.id);

  const customerId = subscription.customer as string;

  // TODO: Update subscription status to cancelled in database
  console.log(`[Stripe] Customer ${customerId} subscription cancelled`);
}

/**
 * Handle invoice paid
 * Confirms successful payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("[Stripe] Invoice paid:", invoice.id);

  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;

  // TODO: Log payment in database
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

  // TODO: Notify user about failed payment
  // TODO: Update subscription status if needed
  console.log(`[Stripe] Customer ${customerId} payment failed for subscription ${subscriptionId}`);
}
