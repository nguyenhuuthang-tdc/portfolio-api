import { Router } from 'express';
import { projectController } from './project.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Project
 *   description: Public portfolio projects
 */

/**
 * @swagger
 * /api/v1/public/projects:
 *   get:
 *     summary: Get public projects
 *     tags: [Project]
 *     responses:
 *       200:
 *         description: Non-archived projects ordered by display order
 */
router.get('/', projectController.findAll);

router.get('/sync-index', projectController.getSyncIndex);

/**
 * @swagger
 * /api/v1/public/projects/slug/{slug}:
 *   get:
 *     summary: Get a public project by slug
 *     tags: [Project]
 */
router.get('/slug/:slug', projectController.findBySlug);

router.get('/:id', projectController.findById);

export default router;
