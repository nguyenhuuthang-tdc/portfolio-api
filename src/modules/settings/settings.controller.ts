import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { UpdateTelegramSchema } from './settings.types';
import { sendSuccess } from '../../utils/response';

export const settingsController = {
  async getTelegram(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await settingsService.getTelegram();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async updateTelegram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = UpdateTelegramSchema.parse(req.body);
      const data = await settingsService.updateTelegram(dto);
      sendSuccess(res, data, 'Telegram settings saved');
    } catch (err) {
      next(err);
    }
  },
};
