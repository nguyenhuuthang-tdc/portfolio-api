import { Router } from 'express';
import { projectController } from './project.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Project
 *   description: Portfolio project management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         title: { type: string }
 *         slug: { type: string }
 *         description: { type: string, nullable: true }
 *         detailContent: { type: string, nullable: true }
 *         techStack:
 *           type: array
 *           items: { type: string }
 *           nullable: true
 *         githubUrl: { type: string, nullable: true }
 *         demoUrl: { type: string, nullable: true }
 *         thumbnail: { type: string, nullable: true }
 *         hasDetail: { type: boolean }
 *         order: { type: integer }
 *         status: { type: string, enum: [active, archived, in_progress] }
 *         completedAt: { type: string, format: date-time, nullable: true }
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Project]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *         description: Include archived projects
 *     responses:
 *       200:
 *         description: List of projects ordered by display order
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Project' }
 */
router.get('/', projectController.findAll);

/**
 * @swagger
 * /api/projects/slug/{slug}:
 *   get:
 *     summary: Get project by slug
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project detail
 *       404:
 *         description: Not found
 */
router.get('/slug/:slug', projectController.findBySlug);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Project detail
 */
router.get('/:id', projectController.findById);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a project
 *     tags: [Project]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               techStack: { type: array, items: { type: string } }
 *               githubUrl: { type: string }
 *               demoUrl: { type: string, nullable: true }
 *               thumbnail: { type: string, nullable: true }
 *               hasDetail: { type: boolean }
 *               status: { type: string, enum: [active, archived, in_progress] }
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/', authMiddleware, projectController.create);

/**
 * @swagger
 * /api/projects/reorder:
 *   post:
 *     summary: Reorder projects by drag-and-drop
 *     tags: [Project]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       200:
 *         description: Projects reordered
 */
router.post('/reorder', authMiddleware, projectController.reorder);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Project]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Project updated
 */
router.put('/:id', authMiddleware, projectController.update);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Project]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Project deleted
 */
router.delete('/:id', authMiddleware, projectController.delete);

export default router;
