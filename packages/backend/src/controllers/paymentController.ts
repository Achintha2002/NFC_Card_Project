// ============================================================
//  TAGIT — Payment Controller (Stripe)
//  Handles: checkout session creation and Stripe webhook events.
//  Webhook signature verification is required for all webhook calls.
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/responseHelper';

// ── Stripe setup ─────────────────────────────────────────────
// Stripe is imported conditionally so the server doesn't crash if
// STRIPE_SECRET_KEY is not yet configured in the environment.

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured in environment variables.');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require('stripe');
  return new Stripe(secretKey, { apiVersion: '2024-06-20' });
}

// ── Tier Mapping ─────────────────────────────────────────────

const PRICE_TO_TIER: Record<string, 'PREMIUM' | 'CORPORATE'> = {
  [process.env.STRIPE_PRICE_PREMIUM ?? '']: 'PREMIUM',
  [process.env.STRIPE_PRICE_CORPORATE ?? '']: 'CORPORATE',
};

// ============================================================
//  POST /api/v1/payments/create-checkout-session
//  PROTECTED — Creates a Stripe Checkout session for upgrading.
// ============================================================

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  try {
    const stripe = getStripe();
    const { userId, email } = req.user!;
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      sendError(res, 'priceId is required.', 400);
      return;
    }

    // Find or create Stripe customer
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    let stripeCustomerId = user?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl ?? `${process.env.WEB_BASE_URL}/profile?upgraded=true`,
      cancel_url: cancelUrl ?? `${process.env.WEB_BASE_URL}/profile`,
      metadata: { userId },
    });

    sendSuccess(res, { url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    sendError(res, (error as Error).message || 'Failed to create checkout session.', 500);
  }
}

// ============================================================
//  POST /api/v1/payments/webhook
//  PUBLIC (Stripe) — Receives and processes Stripe webhook events.
//  Must use raw body (express.raw) before this handler.
// ============================================================

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set.');
    res.status(500).json({ error: 'Webhook secret not configured.' });
    return;
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
    return;
  }

  const sig = req.headers['stripe-signature'];
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.warn('⚠️ Stripe webhook signature verification failed:', (err as Error).message);
    res.status(400).json({ error: `Webhook Error: ${(err as Error).message}` });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Record<string, unknown>;
        const userId = (session.metadata as Record<string, string>)?.userId;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          // Retrieve subscription to get price ID and period end
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id ?? '';
          const tier = PRICE_TO_TIER[priceId] ?? 'PREMIUM';

          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionId,
              subscriptionStatus: subscription.status,
              subscriptionTier: tier,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
          console.log(`✅ Subscription activated for user ${userId} (${tier})`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Record<string, unknown>;
        const customerId = sub.customer as string;

        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
        if (user) {
          const priceId = (sub as Record<string, unknown> & { items: { data: { price: { id: string } }[] } })
            .items.data[0]?.price?.id ?? '';
          const tier = PRICE_TO_TIER[priceId] ?? user.subscriptionTier;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: sub.status as string,
              subscriptionTier: tier,
              currentPeriodEnd: new Date((sub.current_period_end as number) * 1000),
            },
          });
          console.log(`🔄 Subscription updated for user ${user.email} — status: ${sub.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Record<string, unknown>;
        const customerId = sub.customer as string;

        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'canceled',
              subscriptionTier: 'FREE',
              subscriptionId: null,
              currentPeriodEnd: null,
            },
          });
          console.log(`❌ Subscription canceled for user ${user.email}. Reverted to FREE.`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Record<string, unknown>;
        const customerId = invoice.customer as string;

        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'past_due' },
          });
          console.warn(`⚠️ Payment failed for user ${user.email}`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    res.status(500).json({ error: 'Internal webhook processing error.' });
    return;
  }

  // Acknowledge receipt to Stripe
  res.json({ received: true });
}

// ============================================================
//  GET /api/v1/payments/subscription
//  PROTECTED — Returns the current subscription status for the user.
// ============================================================

export async function getSubscriptionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.user!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionId: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      sendError(res, 'User not found.', 404);
      return;
    }

    sendSuccess(res, {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus ?? 'none',
      isActive: user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing',
      currentPeriodEnd: user.currentPeriodEnd,
      hasStripeAccount: !!user.stripeCustomerId,
    });
  } catch (error) {
    console.error('getSubscriptionStatus error:', error);
    sendError(res, 'Failed to fetch subscription status.', 500);
  }
}
