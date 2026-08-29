import { Router } from 'express';
import { blogController } from './blog.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog post management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         title: { type: string }
 *         slug: { type: string }
 *         content: { type: string }
 *         excerpt: { type: string, nullable: true }
 *         thumbnail: { type: string, nullable: true }
 *         status: { type: string, enum: [draft, published] }
 *         viewCount: { type: integer }
 *         publishedAt: { type: string, format: date-time, nullable: true }
 *         categories:
 *           type: array
 *           items: { $ref: '#/components/schemas/BlogCategory' }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     BlogCategory:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         slug: { type: string }
 *         color: { type: string }
 *         description: { type: string, nullable: true }
 */

/**
 * @swagger
 * /api/v1/public/blogs:
 *   get:
 *     summary: Get all blogs (paginated)
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, published, all], default: published }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category slug
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of blogs
 */
router.get('/', blogController.findAllPublished);

/**
 * @swagger
 * /api/v1/public/blogs/categories:
 *   get:
 *     summary: Get all blog categories
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/BlogCategory' }
 */
router.get('/categories', blogController.getCategories);

router.get('/sync-index', blogController.getSyncIndex);

/**
 * @swagger
 * /api/v1/public/blogs/slug/{slug}:
 *   get:
 *     summary: Get blog by slug
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog detail
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Blog' }
 *       404:
 *         description: Not found
 */
router.get('/slug/:slug', blogController.findPublishedBySlug);

/**
 * @swagger
 * /api/v1/public/blogs/{id}:
 *   get:
 *     summary: Get blog by ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Blog detail
 *       404:
 *         description: Not found
 */
router.get('/:id', blogController.findPublishedById);

/**
 * @swagger
 * /api/v1/public/blogs/{id}/view:
 *   post:
 *     summary: Record a blog view (fire-and-forget, anti-spam)
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: View recorded
 */
router.post('/:id/view', blogController.recordView);

export default router;
