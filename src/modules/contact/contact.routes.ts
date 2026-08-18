import { Router } from 'express';
import { contactController } from './contact.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form submissions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         email: { type: string }
 *         subject: { type: string, nullable: true }
 *         message: { type: string }
 *         isRead: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string, maxLength: 150 }
 *               email: { type: string, format: email }
 *               subject: { type: string, maxLength: 255 }
 *               message: { type: string, minLength: 10, maxLength: 5000 }
 *     responses:
 *       201:
 *         description: Message sent. Telegram notification dispatched.
 *       422:
 *         description: Validation error
 */
router.post('/', contactController.create);

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: List all contact submissions (admin)
 *     tags: [Contact]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated contact list
 */
router.get('/', authMiddleware, contactController.findAll);

/**
 * @swagger
 * /api/contact/{id}/read:
 *   patch:
 *     summary: Mark contact as read
 *     tags: [Contact]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.patch('/:id/read', authMiddleware, contactController.markRead);

/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete a contact submission
 *     tags: [Contact]
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
router.delete('/:id', authMiddleware, contactController.delete);

export default router;
