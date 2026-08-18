import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service';
import { CreateProjectSchema, UpdateProjectSchema } from './project.types';
import { sendSuccess } from '../../utils/response';
import { z } from 'zod';

export const projectController = {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const all = req.query.all;
      const includeArchived = (Array.isArray(all) ? all[0] : all) === 'true';
      const projects = await projectService.findAll(includeArchived);
      sendSuccess(res, projects);
    } catch (err) {
      next(err);
    }
  },

  async findBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.findBySlug(req.params.slug as string);
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.findById(Number(req.params.id));
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateProjectSchema.parse(req.body);
      const project = await projectService.create(dto);
      sendSuccess(res, project, 'Project created', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpdateProjectSchema.parse(req.body);
      const project = await projectService.update(Number(req.params.id), dto);
      sendSuccess(res, project, 'Project updated');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Project deleted');
    } catch (err) {
      next(err);
    }
  },

  async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = z.object({ ids: z.array(z.number()) }).parse(req.body);
      await projectService.reorder(ids);
      sendSuccess(res, null, 'Projects reordered');
    } catch (err) {
      next(err);
    }
  },
};
