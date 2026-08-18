import { Request, Response, NextFunction } from 'express';
import { contactService } from './contact.service';
import { CreateContactSchema } from './contact.types';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { z } from 'zod';

export const contactController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateContactSchema.parse(req.body);
      const contact = await contactService.create(dto);
      sendSuccess(res, { id: contact.id }, 'Message sent successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const { rows, total } = await contactService.findAll(page, limit);
      sendPaginated(res, rows, total, page, limit);
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contactService.markRead(Number(req.params.id));
      sendSuccess(res, null, 'Marked as read');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contactService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Contact deleted');
    } catch (err) {
      next(err);
    }
  },
};
