// ============================================================
//  TAGIT — API Router Index
//  Mounts all sub-routers under /api/v1
// ============================================================

import { Router } from 'express';
import { authRouter } from './authRoutes';
import { profileRouter } from './profileRoutes';
import { linkRouter } from './linkRoutes';
import adminRouter from './adminRoutes';
import designsRouter from './designs.routes';
import { portfolioRouter } from './portfolioRoutes';
import { analyticsRouter } from './analyticsRoutes';
import { leadRouter } from './leadRoutes';
import { paymentRouter } from './paymentRoutes';

export const apiRouter = Router();

/** Authentication endpoints */
apiRouter.use('/auth', authRouter);

/** Profile read/write endpoints */
apiRouter.use('/profile', profileRouter);

/** Link management endpoints */
apiRouter.use('/links', linkRouter);

/** Admin management endpoints */
apiRouter.use('/admin', adminRouter);

/** Design saving endpoints */
apiRouter.use('/designs', designsRouter);

/** Portfolio endpoints */
apiRouter.use('/portfolio', portfolioRouter);

/** User-facing analytics endpoints */
apiRouter.use('/analytics', analyticsRouter);

/** Lead capture management endpoints */
apiRouter.use('/leads', leadRouter);

/** Payment & subscription endpoints */
apiRouter.use('/payments', paymentRouter);

/** API version info */
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'TAGIT API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      profile: '/api/v1/profile',
      links: '/api/v1/links',
      admin: '/api/v1/admin',
      portfolio: '/api/v1/portfolio',
      analytics: '/api/v1/analytics',
      leads: '/api/v1/leads',
      payments: '/api/v1/payments',
    },
  });
});
