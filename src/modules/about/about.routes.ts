import { Router } from 'express';
import { aboutController } from './about.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: About
 *   description: Public about sections and visible skills
 */

router.get('/sections', aboutController.getAllSections);
router.get('/sections/:key', aboutController.getSection);
router.get('/skills', aboutController.getAllSkills);

export default router;
