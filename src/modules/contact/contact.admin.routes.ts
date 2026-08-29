import { Router } from 'express';
import { contactController } from './contact.controller';

const router = Router();

router.get('/', contactController.findAll);
router.patch('/:id/read', contactController.markRead);
router.delete('/:id', contactController.delete);

export default router;
