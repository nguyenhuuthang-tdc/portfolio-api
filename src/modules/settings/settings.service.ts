import { TelegramConfig } from './telegram-config.model';
import { TelegramPublicConfig, UpdateTelegramDto } from './settings.types';
import { AppError } from '../../middleware/error.middleware';

async function getOrCreate(): Promise<TelegramConfig> {
  const existing = await TelegramConfig.findOne({ order: [['id', 'ASC']] });
  if (existing) return existing;
  return TelegramConfig.create({ botToken: '', chatId: '', enabled: false });
}

export const settingsService = {
  async getTelegram(): Promise<TelegramPublicConfig> {
    const row = await getOrCreate();
    return {
      chatId: row.chatId,
      enabled: row.enabled,
      hasBotToken: row.botToken.length > 0,
    };
  },

  async updateTelegram(dto: UpdateTelegramDto): Promise<TelegramPublicConfig> {
    const row = await getOrCreate();
    const nextToken =
      dto.botToken !== undefined && dto.botToken.trim() !== ''
        ? dto.botToken.trim()
        : row.botToken;

    if (dto.enabled && (!nextToken || !dto.chatId.trim())) {
      throw new AppError('Bot token and chat ID are required when enabled', 422);
    }

    row.botToken = nextToken;
    row.chatId = dto.chatId.trim();
    row.enabled = dto.enabled;
    await row.save();

    return {
      chatId: row.chatId,
      enabled: row.enabled,
      hasBotToken: row.botToken.length > 0,
    };
  },

  async getActiveTelegram(): Promise<{ botToken: string; chatId: string } | null> {
    const row = await TelegramConfig.findOne({ order: [['id', 'ASC']] });
    if (!row || !row.enabled || !row.botToken || !row.chatId) return null;
    return { botToken: row.botToken, chatId: row.chatId };
  },
};
