import { z } from 'zod';

export const UpdateTelegramSchema = z.object({
  botToken: z.string().optional(),
  chatId: z.string().max(64),
  enabled: z.boolean(),
});

export type UpdateTelegramDto = z.infer<typeof UpdateTelegramSchema>;

export type TelegramPublicConfig = {
  chatId: string;
  enabled: boolean;
  hasBotToken: boolean;
};
