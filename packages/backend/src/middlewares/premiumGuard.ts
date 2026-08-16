// ============================================================
//  TAGIT — Premium Guard Middleware
//  Ensures the authenticated user has PREMIUM or CORPORATE tier
//  before accessing portfolio creation/edit endpoints.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHelper';

/**
 * Middleware that gates access to premium-only features.
 * Returns 403 with an upgrade CTA message for FREE-tier users.
 *
 * Must be used AFTER `authMiddleware` so that `req.user` is populated.
 */
export async function premiumGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const tier = req.user?.subscriptionTier;

  if (tier === 'PREMIUM' || tier === 'CORPORATE') {
    next();
    return;
  }

  sendError(
    res,
    'Portfolio is a Premium feature. Upgrade your TAGIT card to Executive or Corporate to unlock your personal portfolio website.',
    403,
  );
}
