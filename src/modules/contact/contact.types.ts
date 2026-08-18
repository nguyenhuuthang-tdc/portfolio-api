import { z } from 'zod';

export const CreateContactSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().max(255),
  subject: z.string().max(255).optional(),
  message: z.string().min(10).max(5000),
});

export type CreateContactDto = z.infer<typeof CreateContactSchema>;
