import { z } from 'zod';

export const CreateBlogSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(280).optional(),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  thumbnail: z.string().min(1).optional().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
  categoryIds: z.array(z.number().int().positive()).optional(),
});

export const UpdateBlogSchema = CreateBlogSchema.partial();

export const BlogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['draft', 'published', 'all']).default('published'),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(255).optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
export type BlogQueryDto = z.infer<typeof BlogQuerySchema>;
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
