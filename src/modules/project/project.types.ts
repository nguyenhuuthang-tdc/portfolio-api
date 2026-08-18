import { z } from 'zod';

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(280).optional(),
  description: z.string().max(1000).optional(),
  detailContent: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional().nullable(),
  demoUrl: z.string().url().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  hasDetail: z.boolean().default(false),
  order: z.number().int().default(0),
  status: z.enum(['active', 'archived', 'in_progress']).default('active'),
  completedAt: z.string().datetime().optional().nullable(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;
