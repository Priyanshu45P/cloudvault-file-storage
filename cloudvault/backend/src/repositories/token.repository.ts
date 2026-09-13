import crypto from 'crypto';
import { prisma } from '../config/prisma';

/** Refresh tokens are never stored in plaintext - only a SHA-256 hash. */
export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const tokenRepository = {
  create: (tokenHash: string, userId: string, expiresAt: Date) =>
    prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } }),

  findValidByHash: (tokenHash: string) =>
    prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    }),

  revokeByHash: (tokenHash: string) =>
    prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    }),

  revokeAllForUser: (userId: string) =>
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
};
