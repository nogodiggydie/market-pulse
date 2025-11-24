import type { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.log("[Webhook] No signature provided");
    return res.status(400).send("No signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.log(`[Webhook] Signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // CRITICAL: Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
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
        console.log(`[Webhook] Invoice paid: ${invoice.id}`);
        // Subscription is already active, no need to update
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing event:`, error);
    res.status(500).send("Webhook processing failed");
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier as "pro" | "premium";

  if (!userId || !tier) {
    console.error("[Webhook] Missing metadata in checkout session");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  // Update user with subscription info
  await db
    .update(users)
    .set({
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      subscriptionTier: tier,
      subscriptionStatus: "active",
    })
    .where(eq(users.id, parseInt(userId)));

  console.log(`[Webhook] User ${userId} subscribed to ${tier} tier`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  // Find user by subscription ID
  const result = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (result.length === 0) {
    console.error(`[Webhook] No user found for subscription ${subscription.id}`);
    return;
  }

  const user = result[0];

  // Map Stripe status to our status
  const status = subscription.status as
    | "active"
    | "canceled"
    | "past_due"
    | "trialing"
    | "incomplete";

  const endsAt = subscription.cancel_at_period_end && (subscription as any).current_period_end
    ? new Date((subscription as any).current_period_end * 1000)
    : null;

  await db
    .update(users)
    .set({
      subscriptionStatus: status,
      subscriptionEndsAt: endsAt,
    })
    .where(eq(users.id, user.id));

  console.log(
    `[Webhook] Subscription ${subscription.id} updated to status: ${status}`
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  // Find user by subscription ID
  const result = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (result.length === 0) {
    console.error(`[Webhook] No user found for subscription ${subscription.id}`);
    return;
  }

  const user = result[0];

  // Downgrade to free tier
  await db
    .update(users)
    .set({
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
      subscriptionEndsAt: null,
    })
    .where(eq(users.id, user.id));

  console.log(`[Webhook] User ${user.id} downgraded to free tier`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const subscriptionId = typeof (invoice as any).subscription === 'string' 
    ? (invoice as any).subscription 
    : (invoice as any).subscription?.id;
  
  if (!subscriptionId) {
    return;
  }

  // Find user by subscription ID
  const result = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (result.length === 0) {
    console.error(
      `[Webhook] No user found for subscription ${subscriptionId}`
    );
    return;
  }

  const user = result[0];

  // Mark subscription as past_due
  await db
    .update(users)
    .set({
      subscriptionStatus: "past_due",
    })
    .where(eq(users.id, user.id));

  console.log(`[Webhook] User ${user.id} payment failed, marked as past_due`);
}
