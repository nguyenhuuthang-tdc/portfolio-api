import { Request, Response, NextFunction } from 'express';
import {
  aboutService,
  UpsertSectionSchema,
  CreateSkillSchema,
  UpdateSkillSchema,
} from './about.service';
import { sendSuccess } from '../../utils/response';
import { z } from 'zod';

export const aboutController = {
  async getAllSections(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sections = await aboutService.getAllSections();
      sendSuccess(res, sections);
    } catch (err) {
      next(err);
    }
  },

  async getSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const section = await aboutService.getSection(req.params.key as string);
      sendSuccess(res, section);
    } catch (err) {
      next(err);
    }
  },

  async upsertSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpsertSectionSchema.parse(req.body);
      const section = await aboutService.upsertSection(req.params.key as string, dto);
      sendSuccess(res, section, 'Section saved');
    } catch (err) {
      next(err);
    }
  },

  async getAllSkills(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skills = await aboutService.getAllSkills();
      sendSuccess(res, skills);
    } catch (err) {
      next(err);
    }
  },

  async getAllSkillsAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skills = await aboutService.getAllSkillsAdmin();
      sendSuccess(res, skills);
    } catch (err) {
      next(err);
    }
  },

  async createSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateSkillSchema.parse(req.body);
      const skill = await aboutService.createSkill(dto);
      sendSuccess(res, skill, 'Skill created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpdateSkillSchema.parse(req.body);
      const skill = await aboutService.updateSkill(Number(req.params.id), dto);
      sendSuccess(res, skill, 'Skill updated');
    } catch (err) {
      next(err);
    }
  },

  async deleteSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await aboutService.deleteSkill(Number(req.params.id));
      sendSuccess(res, null, 'Skill deleted');
    } catch (err) {
      next(err);
    }
  },

  async reorderSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = z.object({ ids: z.array(z.number()) }).parse(req.body);
      await aboutService.reorderSkills(ids);
      sendSuccess(res, null, 'Skills reordered');
    } catch (err) {
      next(err);
    }
  },
};
