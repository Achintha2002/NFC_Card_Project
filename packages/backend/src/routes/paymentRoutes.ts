// ============================================================
//  TAGIT — Payment Routes (Stripe)
//  Note: The webhook endpoint uses raw body parsing (express.raw)
//  which is applied directly on this route.
// ============================================================

import { Router } from 'express';
import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  createCheckoutSession,
  handleStripeWebhook,
  getSubscriptionStatus,
} from '../controllers/paymentController';

export const paymentRouter = Router();

/**
 * POST /api/v1/payments/webhook
 * Public (Stripe-only). Uses express.raw to receive the raw body
 * required for Stripe signature verification.
 */
paymentRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
);

// ── Protected Routes ──────────────────────────────────────────

/**
 * GET /api/v1/payments/subscription
 * Protected. Returns the current user's subscription status.
 */
paymentRouter.get('/subscription', authMiddleware, getSubscriptionStatus);

/**
 * POST /api/v1/payments/create-checkout-session
 * Protected. Creates a Stripe Checkout session for plan upgrade.
 */
paymentRouter.post('/create-checkout-session', authMiddleware, createCheckoutSession);
