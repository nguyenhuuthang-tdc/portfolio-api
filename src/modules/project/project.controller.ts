import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service';
import { CreateProjectSchema, UpdateProjectSchema } from './project.types';
import { sendSuccess } from '../../utils/response';
import { z } from 'zod';
import { publishWebRevalidation } from '../../integrations/web-revalidation';

export const projectController = {
  async findAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await projectService.findAll(false);
      sendSuccess(res, projects);
    } catch (err) {
      next(err);
    }
  },

  async findAllAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await projectService.findAll(true);
      sendSuccess(res, projects);
    } catch (err) {
      next(err);
    }
  },

  async getSyncIndex(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const index = await projectService.getSyncIndex();
      sendSuccess(res, index);
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

  async findByIdAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.findById(Number(req.params.id), true);
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateProjectSchema.parse(req.body);
      const project = await projectService.create(dto);
      await publishWebRevalidation({ event: 'project.changed', slugs: [project.slug] });
      sendSuccess(res, project, 'Project created', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpdateProjectSchema.parse(req.body);
      const id = Number(req.params.id);
      const previous = await projectService.findById(id, true);
      const project = await projectService.update(id, dto);
      await publishWebRevalidation({
        event: 'project.changed',
        slugs: Array.from(new Set([previous.slug, project.slug])),
      });
      sendSuccess(res, project, 'Project updated');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = await projectService.delete(Number(req.params.id));
      await publishWebRevalidation({ event: 'project.changed', slugs: [slug] });
      sendSuccess(res, null, 'Project deleted');
    } catch (err) {
      next(err);
    }
  },

  async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = z.object({ ids: z.array(z.number()) }).parse(req.body);
      await projectService.reorder(ids);
      await publishWebRevalidation({ event: 'project.changed', slugs: [] });
      sendSuccess(res, null, 'Projects reordered');
    } catch (err) {
      next(err);
    }
  },
};
