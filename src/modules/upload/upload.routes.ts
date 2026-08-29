import { Router, Request, Response, NextFunction } from 'express';
import { upload, uploadService } from './upload.service';
import { sendSuccess } from '../../utils/response';
import { z } from 'zod';
import { AppError } from '../../middleware/error.middleware';

const router = Router();

const ModuleSchema = z.enum(['blog', 'projects', 'profile']);

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload management
 */

/**
 * @swagger
 * /api/v1/admin/uploads/image:
 *   post:
 *     summary: Upload and process an image
 *     tags: [Upload]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, module]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               module:
 *                 type: string
 *                 enum: [blog, projects, profile]
 *               width:
 *                 type: integer
 *                 description: Max width in pixels
 *               height:
 *                 type: integer
 *                 description: Max height in pixels
 *               quality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 85
 *               format:
 *                 type: string
 *                 enum: [webp, jpeg, png, svg]
 *                 default: webp
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid file type
 */
router.post(
  '/image',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const module = ModuleSchema.parse(req.body.module || 'blog');
      const width = req.body.width ? Number(req.body.width) : undefined;
      const height = req.body.height ? Number(req.body.height) : undefined;
      const quality = req.body.quality ? Number(req.body.quality) : 85;
      const format = (req.body.format as 'webp' | 'jpeg' | 'png' | 'svg') || 'webp';

      const url = await uploadService.processAndSave(
        req.file.buffer,
        req.file.originalname,
        module,
        { width, height, quality, format, mimetype: req.file.mimetype }
      );

      sendSuccess(res, { url }, 'Image uploaded', 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/admin/uploads/delete:
 *   delete:
 *     summary: Delete an uploaded file
 *     tags: [Upload]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 description: The public URL path of the file to delete
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete(
  '/delete',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { url } = z.object({ url: z.string() }).parse(req.body);
      uploadService.deleteFile(url);
      sendSuccess(res, null, 'File deleted');
    } catch (err) {
      next(err);
    }
  }
);

export default router;
