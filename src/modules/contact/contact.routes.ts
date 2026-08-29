import { Router } from 'express';
import { contactController } from './contact.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Public contact form submission
 */

router.post('/', contactController.create);

export default router;
