import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op, Transaction } from 'sequelize';
import sequelize from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { AuthSession } from './auth-session.model';
import { User } from './auth.model';
import {
  AuthRequestMeta,
  AuthTokens,
  ChangePasswordDto,
  JwtPayload,
  LoginDto,
} from './auth.types';

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sameHash(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signTokens(user: User, sessionId: string): AuthTokens {
  const basePayload = { id: user.id as number, email: user.email, sessionId };
  const accessToken = jwt.sign(
    { ...basePayload, type: 'access' },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );
  const refreshToken = jwt.sign(
    { ...basePayload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'] }
  );
  return { accessToken, refreshToken };
}

function refreshExpiry(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) throw new Error('Refresh token is missing expiry');
  return new Date(decoded.exp * 1000);
}

function verifyRefreshToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
    if (
      payload.type !== 'refresh' ||
      !Number.isInteger(payload.id) ||
      typeof payload.email !== 'string' ||
      typeof payload.sessionId !== 'string'
    ) {
      throw new Error('Invalid refresh payload');
    }
    return payload;
  } catch {
      throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
  }
}

async function revokeFamily(familyId: string, transaction?: Transaction): Promise<void> {
  await AuthSession.update(
    { revokedAt: new Date() },
    { where: { familyId, revokedAt: { [Op.is]: null } }, transaction }
  );
}

async function createSession(
  user: User,
  meta: AuthRequestMeta,
  familyId: string = crypto.randomUUID(),
  transaction?: Transaction
): Promise<{ session: AuthSession; tokens: AuthTokens }> {
  const sessionId = crypto.randomUUID();
  const tokens = signTokens(user, sessionId);
  const session = await AuthSession.create(
    {
      id: sessionId,
      userId: user.id,
      familyId,
      tokenHash: hashRefreshToken(tokens.refreshToken),
      expiresAt: refreshExpiry(tokens.refreshToken),
      revokedAt: null,
      replacedById: null,
      lastUsedAt: null,
      ipHash: meta.ipHash,
      userAgentHash: meta.userAgentHash,
    },
    { transaction }
  );
  return { session, tokens };
}

export const authService = {
  async login(
    dto: LoginDto,
    meta: AuthRequestMeta
  ): Promise<{ user: User; session: AuthSession; tokens: AuthTokens }> {
    const user = await User.findOne({ where: { email: dto.email, isActive: true } });
    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const { session, tokens } = await createSession(user, meta);
    return { user, session, tokens };
  },

  async seedAdmin(email: string, password: string): Promise<User> {
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new AppError('Admin already exists', 409);
    const passwordHash = await bcrypt.hash(password, 12);
    return User.create({ email, passwordHash });
  },

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    await sequelize.transaction(async (transaction) => {
      user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
      await user.save({ transaction });
      await AuthSession.update(
        { revokedAt: new Date() },
        { where: { userId, revokedAt: { [Op.is]: null } }, transaction }
      );
    });
  },

  async refreshTokens(
    refreshToken: string,
    meta: AuthRequestMeta
  ): Promise<{ user: User; session: AuthSession; tokens: AuthTokens }> {
    const payload = verifyRefreshToken(refreshToken);
    const presentedHash = hashRefreshToken(refreshToken);

    const result = await sequelize.transaction(async (transaction) => {
      const current = await AuthSession.findByPk(payload.sessionId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!current || !sameHash(current.tokenHash, presentedHash)) {
        return { kind: 'invalid' as const };
      }

      if (current.revokedAt || current.replacedById) {
        const rotationConflictWindowMs = 10_000;
        const isRecentSameClientRotation = Boolean(
          current.replacedById &&
          current.revokedAt &&
          Date.now() - current.revokedAt.getTime() <= rotationConflictWindowMs &&
          current.ipHash === meta.ipHash &&
          current.userAgentHash === meta.userAgentHash
        );
        if (isRecentSameClientRotation) return { kind: 'conflict' as const };
        await revokeFamily(current.familyId, transaction);
        return { kind: 'reuse' as const };
      }

      if (current.expiresAt.getTime() <= Date.now()) {
        current.revokedAt = new Date();
        await current.save({ transaction });
        return { kind: 'invalid' as const };
      }

      const user = await User.findByPk(payload.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user || !user.isActive || current.userId !== user.id) {
        current.revokedAt = new Date();
        await current.save({ transaction });
        return { kind: 'inactive' as const };
      }

      const next = await createSession(user, meta, current.familyId, transaction);
      current.revokedAt = new Date();
      current.replacedById = next.session.id;
      current.lastUsedAt = new Date();
      await current.save({ transaction });

      return { kind: 'ok' as const, user, ...next };
    });

    if (result.kind === 'reuse') {
      throw new AppError('Refresh token reuse detected; session revoked', 401);
    }
    if (result.kind === 'conflict') {
      throw new AppError('Refresh already completed by another request', 409);
    }
    if (result.kind === 'inactive') throw new AppError('Account is inactive', 401);
    if (result.kind !== 'ok') throw new AppError('Invalid refresh token', 401);
    return result;
  },

  async revokeSession(refreshToken: string): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return;
    }

    const session = await AuthSession.findByPk(payload.sessionId);
    if (!session || !sameHash(session.tokenHash, hashRefreshToken(refreshToken))) return;
    if (!session.revokedAt) {
      session.revokedAt = new Date();
      await session.save();
    }
  },

  async getActiveRefreshSession(refreshToken: string): Promise<AuthSession> {
    const payload = verifyRefreshToken(refreshToken);
    const session = await AuthSession.findByPk(payload.sessionId, {
      include: [{ model: User }],
    });
    if (
      !session ||
      !sameHash(session.tokenHash, hashRefreshToken(refreshToken)) ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.user?.isActive
    ) {
      throw new AppError('Invalid refresh session', 401);
    }
    return session;
  },

  verifyRefreshPayload(refreshToken: string): JwtPayload {
    return verifyRefreshToken(refreshToken);
  },
};
