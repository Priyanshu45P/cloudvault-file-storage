import { prisma } from '../config/prisma';

export const userRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  create: (data: { fullName: string; email: string; passwordHash: string }) =>
    prisma.user.create({ data }),

  /**
   * Returns the user without the passwordHash field, safe to send to clients.
   * BigInt storage fields are converted to strings because JSON.stringify
   * cannot serialize BigInt natively.
   */
  toPublicUser: <T extends { passwordHash: string; storageUsed: bigint; storageLimit: bigint }>(
    user: T
  ) => {
    const { passwordHash: _passwordHash, storageUsed, storageLimit, ...rest } = user;
    return {
      ...rest,
      storageUsed: storageUsed.toString(),
      storageLimit: storageLimit.toString(),
    };
  },
};
