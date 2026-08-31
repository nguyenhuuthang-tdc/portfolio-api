import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { csrfMiddleware } from '../middleware/csrf.middleware';
import { adminApiLimiter, publicApiLimiter } from '../middleware/rate-limit.middleware';
import { trustedOriginMiddleware } from '../middleware/trusted-origin.middleware';
import publicRouter from './public.router';
import adminRouter from './admin.router';
import authRoutes from '../modules/auth/auth.routes';

const apiRouter = Router();

// Versioned audience boundaries. Authentication is applied once for every
// current and future admin resource.
apiRouter.use('/v1/auth', authRoutes);
apiRouter.use('/v1/public', publicApiLimiter, publicRouter);
apiRouter.use(
  '/v1/admin',
  trustedOriginMiddleware,
  authMiddleware,
  csrfMiddleware,
  adminApiLimiter,
  adminRouter
);

export default apiRouter;
