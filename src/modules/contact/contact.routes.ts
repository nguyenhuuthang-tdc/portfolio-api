import { Router } from 'express';
import { contactController } from './contact.controller';
import { contactLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Public contact form submission
 */

router.post('/', contactLimiter, contactController.create);

export default router;
