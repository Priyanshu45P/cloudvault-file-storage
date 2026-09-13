import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

/**
 * Requires a valid Bearer access token. Attaches { userId, email } to req.user.
 * Distinguishes expired tokens from invalid ones so the client knows whether
 * to attempt a refresh or force a re-login.
 */
export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Access token expired', { expired: true }));
    }
    return next(ApiError.unauthorized('Invalid access token'));
  }
};
