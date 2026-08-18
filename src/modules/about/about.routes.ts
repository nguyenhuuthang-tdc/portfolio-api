import { Router } from 'express';
import { aboutController } from './about.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: About
 *   description: About sections and skills management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AboutSection:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         key: { type: string }
 *         content: { type: string }
 *         label: { type: string, nullable: true }
 *         updatedAt: { type: string, format: date-time }
 *     Skill:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         category: { type: string }
 *         level: { type: integer, minimum: 1, maximum: 5, nullable: true }
 *         icon: { type: string, nullable: true }
 *         order: { type: integer }
 *         isVisible: { type: boolean }
 */

/**
 * @swagger
 * /api/about/sections:
 *   get:
 *     summary: Get all about sections
 *     tags: [About]
 *     responses:
 *       200:
 *         description: All content sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/AboutSection' }
 */
router.get('/sections', aboutController.getAllSections);

/**
 * @swagger
 * /api/about/sections/{key}:
 *   get:
 *     summary: Get a section by key
 *     tags: [About]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: Section key (e.g. hero, about_me, experience)
 *     responses:
 *       200:
 *         description: Section content
 *       404:
 *         description: Not found
 */
router.get('/sections/:key', aboutController.getSection);

/**
 * @swagger
 * /api/about/sections/{key}:
 *   put:
 *     summary: Create or update a section by key
 *     tags: [About]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *               label: { type: string }
 *     responses:
 *       200:
 *         description: Section saved
 */
router.put('/sections/:key', authMiddleware, aboutController.upsertSection);

/**
 * @swagger
 * /api/about/skills:
 *   get:
 *     summary: Get skills (visible only for public, all for admin)
 *     tags: [About]
 *     parameters:
 *       - in: query
 *         name: admin
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of skills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Skill' }
 */
router.get('/skills', aboutController.getAllSkills);

/**
 * @swagger
 * /api/about/skills:
 *   post:
 *     summary: Create a skill
 *     tags: [About]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category]
 *             properties:
 *               name: { type: string }
 *               category: { type: string }
 *               level: { type: integer, minimum: 1, maximum: 5 }
 *               icon: { type: string }
 *               order: { type: integer }
 *     responses:
 *       201:
 *         description: Skill created
 */
router.post('/skills', authMiddleware, aboutController.createSkill);

/**
 * @swagger
 * /api/about/skills/reorder:
 *   post:
 *     summary: Reorder skills
 *     tags: [About]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Reordered
 */
router.post('/skills/reorder', authMiddleware, aboutController.reorderSkills);

/**
 * @swagger
 * /api/about/skills/{id}:
 *   put:
 *     summary: Update a skill
 *     tags: [About]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Skill updated
 */
router.put('/skills/:id', authMiddleware, aboutController.updateSkill);

/**
 * @swagger
 * /api/about/skills/{id}:
 *   delete:
 *     summary: Delete a skill
 *     tags: [About]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/skills/:id', authMiddleware, aboutController.deleteSkill);

export default router;
