import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  expiresInToDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { userRepository } from '../repositories/user.repository';
import { hashToken, tokenRepository } from '../repositories/token.repository';
import { env } from '../config/env';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { v4 as uuid } from 'uuid';

const issueTokenPair = async (userId: string, email: string) => {
  const accessToken = signAccessToken({ userId, email });

  const tokenId = uuid();
  const refreshToken = signRefreshToken({ userId, tokenId });
  const refreshExpiresAt = expiresInToDate(env.REFRESH_TOKEN_EXPIRES_IN);
  await tokenRepository.create(hashToken(refreshToken), userId, refreshExpiresAt);

  return { accessToken, refreshToken };
};

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
    });

    const tokens = await issueTokenPair(user.id, user.email);
    return { user: userRepository.toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = await issueTokenPair(user.id, user.email);
    return { user: userRepository.toPublicUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await tokenRepository.findValidByHash(tokenHash);
    if (!stored) {
      // Token reuse or already revoked - treat as a security event.
      throw ApiError.unauthorized('Refresh token has been revoked or expired');
    }

    // Rotate: revoke the old token and issue a brand new pair.
    await tokenRepository.revokeByHash(tokenHash);

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    const tokens = await issueTokenPair(user.id, user.email);
    return { user: userRepository.toPublicUser(user), ...tokens };
  },

  async logout(refreshToken: string) {
    await tokenRepository.revokeByHash(hashToken(refreshToken));
  },

  async updateProfile(userId: string, fullName: string) {
    const clean = fullName.trim();
    if (clean.length < 2 || clean.length > 80) throw ApiError.badRequest('Full name must be between 2 and 80 characters');
    const user = await userRepository.updateProfile(userId, clean);
    return userRepository.toPublicUser(user);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (!(await verifyPassword(currentPassword, user.passwordHash))) throw ApiError.unauthorized('Current password is incorrect');
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      throw ApiError.badRequest('New password must be at least 8 characters and include uppercase, lowercase, number and special character');
    }
    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, passwordHash);
    await tokenRepository.revokeAllForUser(userId);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return userRepository.toPublicUser(user);
  },
};
