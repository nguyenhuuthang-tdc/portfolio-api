import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import authRoutes from '../modules/auth/auth.routes';
import blogRoutes from '../modules/blog/blog.routes';
import blogAdminRoutes from '../modules/blog/blog.admin.routes';
import projectRoutes from '../modules/project/project.routes';
import projectAdminRoutes from '../modules/project/project.admin.routes';
import aboutRoutes from '../modules/about/about.routes';
import aboutAdminRoutes from '../modules/about/about.admin.routes';
import contactRoutes from '../modules/contact/contact.routes';
import contactAdminRoutes from '../modules/contact/contact.admin.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import settingsRoutes from '../modules/settings/settings.routes';

const legacyRouter = Router();

legacyRouter.use('/auth', authRoutes);

legacyRouter.use('/blogs', blogRoutes);
legacyRouter.use('/blogs', authMiddleware, blogAdminRoutes);
legacyRouter.use('/admin/blogs', authMiddleware, blogAdminRoutes);

legacyRouter.use('/projects', projectRoutes);
legacyRouter.use('/projects', authMiddleware, projectAdminRoutes);

legacyRouter.use('/about', aboutRoutes);
legacyRouter.use('/about', authMiddleware, aboutAdminRoutes);

legacyRouter.use('/contact', contactRoutes);
legacyRouter.use('/contact', authMiddleware, contactAdminRoutes);

legacyRouter.use('/upload', authMiddleware, uploadRoutes);
legacyRouter.use('/settings', authMiddleware, settingsRoutes);

export default legacyRouter;
