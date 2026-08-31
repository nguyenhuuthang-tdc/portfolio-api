import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { AppError } from './error.middleware';
import { AuthSession } from '../modules/auth/auth-session.model';
import { User } from '../modules/auth/auth.model';
import { JwtPayload } from '../modules/auth/auth.types';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; sessionId: string };
}

export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new AppError('Unauthorized', 401));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    if (payload.type !== 'access' || !Number.isInteger(payload.id) || typeof payload.email !== 'string' || typeof payload.sessionId !== 'string') {
      return next(new AppError('Invalid or expired token', 401));
    }

    const session = await AuthSession.findOne({
      where: {
        id: payload.sessionId,
        userId: payload.id,
        revokedAt: { [Op.is]: null },
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{ model: User }],
    });
    if (!session?.user?.isActive) return next(new AppError('Unauthorized', 401));

    req.user = {
      id: session.user.id as number,
      email: session.user.email,
      sessionId: session.id,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError('Invalid or expired token', 401));
  }
}
