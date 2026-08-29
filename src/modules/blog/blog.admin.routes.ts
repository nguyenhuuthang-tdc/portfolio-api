import { Router } from 'express';
import { blogController } from './blog.controller';

const router = Router();

router.get('/', blogController.findAll);
router.get('/categories', blogController.getCategories);
router.get('/:id', blogController.findById);

router.post('/', blogController.create);
router.put('/:id', blogController.update);
router.delete('/:id', blogController.delete);

router.post('/categories', blogController.createCategory);
router.put('/categories/:id', blogController.updateCategory);
router.delete('/categories/:id', blogController.deleteCategory);

export default router;
