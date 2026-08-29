import { Router } from 'express';
import { aboutController } from './about.controller';

const router = Router();

router.get('/sections', aboutController.getAllSections);
router.get('/sections/:key', aboutController.getSection);
router.put('/sections/:key', aboutController.upsertSection);

router.get('/skills', aboutController.getAllSkillsAdmin);
router.post('/skills', aboutController.createSkill);
router.post('/skills/reorder', aboutController.reorderSkills);
router.put('/skills/:id', aboutController.updateSkill);
router.delete('/skills/:id', aboutController.deleteSkill);

export default router;
