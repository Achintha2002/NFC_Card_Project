// ============================================================
//  TAGIT — Payment & Subscription Gateway Routes
// ============================================================

import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  createCheckoutSession,
  handleStripeWebhook,
  handlePayhereNotify,
} from '../controllers/paymentController';

export const paymentRouter = Router();

/**
 * POST /api/v1/payments/checkout-session
 * Requires user authentication.
 */
paymentRouter.post('/checkout-session', authMiddleware, createCheckoutSession);

/**
 * POST /api/v1/payments/webhook
 * Stripe Webhook. Uses raw buffer parsing specifically for this route
 * so that stripe.webhooks.constructEvent signature verification succeeds.
 */
paymentRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
);

/**
 * POST /api/v1/payments/payhere/notify
 * Sri Lankan PayHere notification handler (application/x-www-form-urlencoded / json).
 */
paymentRouter.post('/payhere/notify', handlePayhereNotify);
