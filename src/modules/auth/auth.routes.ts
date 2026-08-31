import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { csrfMiddleware, refreshCsrfMiddleware } from '../../middleware/csrf.middleware';
import {
  csrfTokenLimiter,
  loginLimiter,
  passwordLimiter,
  refreshLimiter,
} from '../../middleware/rate-limit.middleware';
import { trustedOriginMiddleware } from '../../middleware/trusted-origin.middleware';

const router = Router();

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
});
router.use(trustedOriginMiddleware);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login successful, sets HttpOnly cookies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         email: { type: string }
 *                     csrfToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout and clear cookies
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', refreshLimiter, refreshCsrfMiddleware, authController.logout);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Rotated HttpOnly cookies and a new CSRF token
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', refreshLimiter, refreshCsrfMiddleware, authController.refresh);

/**
 * @swagger
 * /api/v1/auth/csrf:
 *   get:
 *     summary: Issue a CSRF token for the active refresh session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Signed session-bound CSRF token
 *       401:
 *         description: No active refresh session
 */
router.get('/csrf', csrfTokenLimiter, authController.csrf);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @swagger
 * /api/v1/auth/password:
 *   put:
 *     summary: Change admin password
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Current password incorrect
 */
router.put(
  '/password',
  authMiddleware,
  csrfMiddleware,
  passwordLimiter,
  authController.changePassword
);

// /**
//  * @swagger
//  * /api/auth/seed:
//  *   post:
//  *     summary: Seed initial admin user (development only)
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [email, password]
//  *             properties:
//  *               email: { type: string }
//  *               password: { type: string, minLength: 8 }
//  *     responses:
//  *       201:
//  *         description: Admin created
//  *       403:
//  *         description: Forbidden in production
//  */
// router.post('/seed', authController.seedAdmin);

export default router;
