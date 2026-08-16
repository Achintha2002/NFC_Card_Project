// ============================================================
//  TAGIT — Analytics Routes
//  All endpoints require authentication.
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  getTapAnalytics,
  getLinkClickAnalytics,
  getAnalyticsSummary,
} from '../controllers/analyticsController';

export const analyticsRouter = Router();

// All analytics routes require auth
analyticsRouter.use(authMiddleware);

/** GET /api/v1/analytics/summary — Combined dashboard summary */
analyticsRouter.get('/summary', getAnalyticsSummary);

/** GET /api/v1/analytics/taps — Tap analytics (supports ?days=7|30|90) */
analyticsRouter.get('/taps', getTapAnalytics);

/** GET /api/v1/analytics/links — Link click analytics (supports ?days=7|30|90) */
analyticsRouter.get('/links', getLinkClickAnalytics);
