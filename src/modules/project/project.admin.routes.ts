import { Router } from 'express';
import { projectController } from './project.controller';

const router = Router();

router.get('/', projectController.findAllAdmin);
router.get('/:id', projectController.findByIdAdmin);
router.post('/', projectController.create);
router.post('/reorder', projectController.reorder);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.delete);

export default router;
