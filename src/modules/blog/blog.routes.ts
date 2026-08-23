import { Router } from 'express';
import { blogController } from './blog.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

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
 * /api/blogs:
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
router.get('/', blogController.findAll);

/**
 * @swagger
 * /api/blogs/categories:
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
 * /api/blogs/slug/{slug}:
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
router.get('/slug/:slug', blogController.findBySlug);

/**
 * @swagger
 * /api/blogs/{id}:
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
router.get('/:id', blogController.findById);

/**
 * @swagger
 * /api/blogs/{id}/view:
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

// Protected routes (admin)
/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a blog post
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               slug: { type: string }
 *               content: { type: string }
 *               excerpt: { type: string }
 *               thumbnail: { type: string }
 *               status: { type: string, enum: [draft, published] }
 *               categoryIds:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       201:
 *         description: Blog created
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, blogController.create);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update a blog post
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               status: { type: string, enum: [draft, published] }
 *               categoryIds:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       200:
 *         description: Blog updated
 */
router.put('/:id', authMiddleware, blogController.update);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Blog deleted
 */
router.delete('/:id', authMiddleware, blogController.delete);

/**
 * @swagger
 * /api/blogs/categories:
 *   post:
 *     summary: Create a blog category
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               color: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/categories', authMiddleware, blogController.createCategory);

/**
 * @swagger
 * /api/blogs/categories/{id}:
 *   put:
 *     summary: Update a blog category
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               color: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put('/categories/:id', authMiddleware, blogController.updateCategory);

/**
 * @swagger
 * /api/blogs/categories/{id}:
 *   delete:
 *     summary: Delete a blog category
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete('/categories/:id', authMiddleware, blogController.deleteCategory);

export default router;
