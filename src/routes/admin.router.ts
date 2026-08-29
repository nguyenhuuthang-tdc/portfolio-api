import { Router } from 'express';
import blogAdminRoutes from '../modules/blog/blog.admin.routes';
import projectAdminRoutes from '../modules/project/project.admin.routes';
import aboutAdminRoutes from '../modules/about/about.admin.routes';
import contactAdminRoutes from '../modules/contact/contact.admin.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import settingsRoutes from '../modules/settings/settings.routes';

const adminRouter = Router();

adminRouter.use('/blogs', blogAdminRoutes);
adminRouter.use('/projects', projectAdminRoutes);
adminRouter.use('/about', aboutAdminRoutes);
adminRouter.use('/contacts', contactAdminRoutes);
adminRouter.use('/uploads', uploadRoutes);
adminRouter.use('/settings', settingsRoutes);

export default adminRouter;
