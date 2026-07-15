// ============================================================
//  TAGIT — Payment & Subscription Gateway Controller
//  Supports Stripe Checkout + Webhooks & PayHere (Sri Lanka)
// ============================================================

import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { SubscriptionTier } from '@prisma/client';

// Initialize Stripe (uses mock secret if not configured in .env)
const stripeSecret = process.env.STRIPE_SECRET_KEY ?? 'sk_test_mock_secret_key';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2025-01-27.acacia' as any,
});

// PayHere Merchant configuration for Sri Lanka LKR payments
const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID ?? '1220000';
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET ?? '4W8u6D1S3K9L2M5N8P0Q';

/**
 * POST /api/v1/payments/checkout-session
 * Generates Stripe Checkout Session URL or PayHere Payment Hash for LKR transactions.
 */
export async function createCheckoutSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { tier, gateway = 'stripe', billingPeriod = 'annual' } = req.body;
    if (!tier || !['PREMIUM', 'CORPORATE'].includes(tier)) {
      res.status(400).json({ success: false, error: 'Valid tier (PREMIUM or CORPORATE) is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profiles: true },
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const defaultProfile = user.profiles.find((p) => p.isDefault) ?? user.profiles[0];
    const prices: Record<string, { usd: number; lkr: number }> = {
      PREMIUM: { usd: billingPeriod === 'annual' ? 49 : 5, lkr: billingPeriod === 'annual' ? 14500 : 1500 },
      CORPORATE: { usd: billingPeriod === 'annual' ? 199 : 25, lkr: billingPeriod === 'annual' ? 59000 : 6500 },
    };
    const priceInfo = prices[tier];

    // ── 1. STRIPE GATEWAY ────────────────────────────────────────────────
    if (gateway.toLowerCase() === 'stripe') {
      if (stripeSecret.startsWith('sk_test_mock')) {
        // Return simulated checkout session for local development when Stripe keys aren't set
        res.status(200).json({
          success: true,
          data: {
            gateway: 'stripe',
            url: `http://localhost:3000/profile?upgradeSuccess=true&tier=${tier}&simulated=true`,
            sessionId: `cs_test_simulated_${Date.now()}`,
          },
        });
        return;
      }

      // Ensure customer ID
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: defaultProfile?.displayName ?? user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `TAGIT ${tier} Plan (${billingPeriod.toUpperCase()})`,
                description: `Unlock Full-Granularity Analytics, Custom Branding & NFC Studio for ${defaultProfile?.displayName ?? 'Your Card'}`,
              },
              unit_amount: priceInfo.usd * 100, // cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000'}/profile?upgradeSuccess=true&tier=${tier}`,
        cancel_url: `${process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000'}/pricing?cancelled=true`,
        metadata: { userId, tier, billingPeriod },
      });

      res.status(200).json({
        success: true,
        data: {
          gateway: 'stripe',
          url: session.url,
          sessionId: session.id,
        },
      });
      return;
    }

    // ── 2. PAYHERE GATEWAY (SRI LANKA LKR) ──────────────────────────────
    if (gateway.toLowerCase() === 'payhere') {
      const orderId = `TAGIT-${tier}-${userId.slice(-6)}-${Date.now()}`;
      const amountFormatted = priceInfo.lkr.toFixed(2);
      const currency = 'LKR';

      // PayHere MD5 Hash requirement:
      // strtoupper(md5(merchant_id + order_id + amount + currency + strtoupper(md5(merchant_secret))))
      const secretHash = crypto
        .createHash('md5')
        .update(PAYHERE_MERCHANT_SECRET)
        .digest('hex')
        .toUpperCase();

      const combinedString = `${PAYHERE_MERCHANT_ID}${orderId}${amountFormatted}${currency}${secretHash}`;
      const hash = crypto
        .createHash('md5')
        .update(combinedString)
        .digest('hex')
        .toUpperCase();

      res.status(200).json({
        success: true,
        data: {
          gateway: 'payhere',
          merchant_id: PAYHERE_MERCHANT_ID,
          return_url: `${process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000'}/profile?upgradeSuccess=true&tier=${tier}&payhere=1`,
          cancel_url: `${process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000'}/pricing?cancelled=true`,
          notify_url: `${process.env.API_PUBLIC_URL ?? 'http://localhost:4000'}/api/v1/payments/payhere/notify`,
          order_id: orderId,
          items: `TAGIT ${tier} Plan (${billingPeriod.toUpperCase()})`,
          currency,
          amount: amountFormatted,
          first_name: defaultProfile?.displayName?.split(' ')[0] ?? 'TAGIT',
          last_name: defaultProfile?.displayName?.split(' ').slice(1).join(' ') ?? 'User',
          email: user.email,
          phone: defaultProfile?.phone ?? '0770000000',
          address: 'Colombo, Sri Lanka',
          city: 'Colombo',
          country: 'Sri Lanka',
          hash,
          custom_1: userId,
          custom_2: tier,
        },
      });
      return;
    }

    res.status(400).json({ success: false, error: 'Unsupported payment gateway' });
  } catch (error: any) {
    next(error);
  }
}

/**
 * POST /api/v1/payments/webhook
 * Stripe Webhook processing. Note: req.body MUST be raw Buffer from express.raw().
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (endpointSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error('❌ Stripe webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }
    } else {
      // Parse direct event payload if webhook secret is not enforced locally
      event = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tierStr = session.metadata?.tier;

      if (userId && tierStr && tierStr in SubscriptionTier) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: tierStr as SubscriptionTier,
            subscriptionStatus: 'ACTIVE',
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
          },
        });
        console.log(`🎉 Stripe Webhook upgraded user ${userId} to ${tierStr}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    next(error);
  }
}

/**
 * POST /api/v1/payments/payhere/notify
 * Sri Lankan PayHere Server-to-Server notification webhook. Validates MD5 hash before upgrade.
 */
export async function handlePayhereNotify(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1: userId,
      custom_2: tierStr,
    } = req.body;

    if (!merchant_id || !order_id || !md5sig || !userId || !tierStr) {
      res.status(400).json({ success: false, error: 'Invalid PayHere payload' });
      return;
    }

    // Verify MD5 Signature:
    // strtoupper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret))))
    const secretHash = crypto
      .createHash('md5')
      .update(PAYHERE_MERCHANT_SECRET)
      .digest('hex')
      .toUpperCase();

    const localSigString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${secretHash}`;
    const localSig = crypto
      .createHash('md5')
      .update(localSigString)
      .digest('hex')
      .toUpperCase();

    if (localSig !== md5sig) {
      console.error('❌ PayHere webhook signature spoofing detected!');
      res.status(401).json({ success: false, error: 'Invalid MD5 Signature' });
      return;
    }

    // status_code "2" means success in PayHere API
    if (status_code === '2' && tierStr in SubscriptionTier) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: tierStr as SubscriptionTier,
          subscriptionStatus: 'ACTIVE',
          payhereSubscriptionId: order_id,
        },
      });
      console.log(`🎉 PayHere Webhook upgraded Sri Lankan user ${userId} to ${tierStr} (LKR ${payhere_amount})`);
    }

    res.status(200).send('OK');
  } catch (error: any) {
    next(error);
  }
}
