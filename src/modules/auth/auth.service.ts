import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './auth.model';
import { AppError } from '../../middleware/error.middleware';
import { AuthTokens, ChangePasswordDto, JwtPayload, LoginDto } from './auth.types';

function signTokens(payload: JwtPayload): AuthTokens {
  const accessToken = jwt.sign(
    payload as object,
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );
  const refreshToken = jwt.sign(
    payload as object,
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'] }
  );
  return { accessToken, refreshToken };
}

export const authService = {
  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await User.findOne({ where: { email: dto.email, isActive: true } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = signTokens({ id: user.id as number, email: user.email });
    return { user, tokens };
  },

  async seedAdmin(email: string, password: string): Promise<User> {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError('Admin already exists', 409);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    return User.create({ email, passwordHash });
  },

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await user.save();
  },

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as JwtPayload;
      return signTokens({ id: payload.id, email: payload.email });
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }
  },
};
