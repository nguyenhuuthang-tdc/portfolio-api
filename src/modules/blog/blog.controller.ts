import { Request, Response, NextFunction } from 'express';
import { blogService } from './blog.service';
import {
  CreateBlogSchema,
  UpdateBlogSchema,
  BlogQuerySchema,
  PublicBlogQuerySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from './blog.types';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { hashIp, getClientIp } from '../../utils/hash';
import { publishWebRevalidation } from '../../integrations/web-revalidation';

export const blogController = {
  async findAllPublished(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawQuery = req.query as Record<string, string>;
      const query = PublicBlogQuerySchema.parse(rawQuery);
      const { rows, total, page, limit } = await blogService.findAll({
        ...query,
        status: 'published',
      });
      sendPaginated(res, rows, total, page, limit);
    } catch (err) {
      next(err);
    }
  },

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

  async findPublishedBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blog = await blogService.findBySlug(req.params.slug as string, true);
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

  async findPublishedById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blog = await blogService.findById(Number(req.params.id), true);
      sendSuccess(res, blog);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateBlogSchema.parse(req.body);
      const blog = await blogService.create(dto);
      await publishWebRevalidation({ event: 'blog.changed', slugs: [blog.slug] });
      sendSuccess(res, blog, 'Blog created', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpdateBlogSchema.parse(req.body);
      const id = Number(req.params.id);
      const previous = await blogService.findById(id);
      const blog = await blogService.update(id, dto);
      await publishWebRevalidation({
        event: 'blog.changed',
        slugs: Array.from(new Set([previous.slug, blog.slug])),
      });
      sendSuccess(res, blog, 'Blog updated');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = await blogService.delete(Number(req.params.id));
      await publishWebRevalidation({ event: 'blog.changed', slugs: [slug] });
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

  async getSyncIndex(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const index = await blogService.getSyncIndex();
      sendSuccess(res, index);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateCategorySchema.parse(req.body);
      const category = await blogService.createCategory(dto);
      await publishWebRevalidation({ event: 'blog-category.changed' });
      sendSuccess(res, category, 'Category created', 201);
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await blogService.deleteCategory(Number(req.params.id));
      await publishWebRevalidation({ event: 'blog-category.changed' });
      sendSuccess(res, null, 'Category deleted');
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpdateCategorySchema.parse(req.body);
      const category = await blogService.updateCategory(Number(req.params.id), dto);
      await publishWebRevalidation({ event: 'blog-category.changed' });
      sendSuccess(res, category, 'Category updated');
    } catch (err) {
      next(err);
    }
  },
};
