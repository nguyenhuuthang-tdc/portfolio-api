import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import publicRouter from './public.router';
import adminRouter from './admin.router';
import authRoutes from '../modules/auth/auth.routes';
import legacyRouter from './legacy.router';

const apiRouter = Router();

// Versioned audience boundaries. Authentication is applied once for every
// current and future admin resource.
apiRouter.use('/v1/auth', authRoutes);
apiRouter.use('/v1/public', publicRouter);
apiRouter.use('/v1/admin', authMiddleware, adminRouter);

// Temporary compatibility routes. Each module will be removed from this
// section after its clients have migrated to the versioned audience routes.
apiRouter.use('/', legacyRouter);

export default apiRouter;
