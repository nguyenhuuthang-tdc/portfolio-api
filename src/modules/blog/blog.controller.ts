import { Request, Response, NextFunction } from 'express';
import { blogService } from './blog.service';
import {
  CreateBlogSchema,
  UpdateBlogSchema,
  BlogQuerySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from './blog.types';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { hashIp, getClientIp } from '../../utils/hash';

export const blogController = {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawQuery = req.query as Record<string, string>;
      const query = BlogQuerySchema.parse(rawQuery);
      const { rows, total, page, limit } = await blogService.findAll(query);
      sendPaginated(res, rows, total, page, limit);
    } catch (err) {
      next(err);
    }
  },

  async findBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blog = await blogService.findBySlug(req.params.slug as string);
      sendSuccess(res, blog);
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blog = await blogService.findById(Number(req.params.id));
      sendSuccess(res, blog);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateBlogSchema.parse(req.body);
      const blog = await blogService.create(dto);
      sendSuccess(res, blog, 'Blog created', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpdateBlogSchema.parse(req.body);
      const blog = await blogService.update(Number(req.params.id), dto);
      sendSuccess(res, blog, 'Blog updated');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await blogService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Blog deleted');
    } catch (err) {
      next(err);
    }
  },

  async recordView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = getClientIp(req as Parameters<typeof getClientIp>[0]);
      const ipHash = hashIp(ip);
      // Fire and forget — don't await, return immediately
      blogService.recordView(Number(req.params.id), ipHash).catch(console.error);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await blogService.getAllCategories();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateCategorySchema.parse(req.body);
      const category = await blogService.createCategory(dto);
      sendSuccess(res, category, 'Category created', 201);
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await blogService.deleteCategory(Number(req.params.id));
      sendSuccess(res, null, 'Category deleted');
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpdateCategorySchema.parse(req.body);
      const category = await blogService.updateCategory(Number(req.params.id), dto);
      sendSuccess(res, category, 'Category updated');
    } catch (err) {
      next(err);
    }
  },
};
