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
    },
  });
});
