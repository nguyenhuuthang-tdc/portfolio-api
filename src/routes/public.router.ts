import { Router } from 'express';
import blogRoutes from '../modules/blog/blog.routes';
import projectRoutes from '../modules/project/project.routes';
import aboutRoutes from '../modules/about/about.routes';
import contactRoutes from '../modules/contact/contact.routes';

const publicRouter = Router();

publicRouter.use('/blogs', blogRoutes);
publicRouter.use('/projects', projectRoutes);
publicRouter.use('/about', aboutRoutes);
publicRouter.use('/contact', contactRoutes);

export default publicRouter;
