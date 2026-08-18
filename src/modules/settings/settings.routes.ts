import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Admin settings (Telegram, etc.)
 */

/**
 * @swagger
 * /api/settings/telegram:
 *   get:
 *     summary: Get Telegram notification config (token never returned)
 *     tags: [Settings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Telegram config
 */
router.get('/telegram', authMiddleware, settingsController.getTelegram);

/**
 * @swagger
 * /api/settings/telegram:
 *   put:
 *     summary: Create or update Telegram config
 *     tags: [Settings]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, enabled]
 *             properties:
 *               botToken: { type: string, description: Omit or empty to keep existing token }
 *               chatId: { type: string }
 *               enabled: { type: boolean }
 *     responses:
 *       200:
 *         description: Saved
 */
router.put('/telegram', authMiddleware, settingsController.updateTelegram);

export default router;
