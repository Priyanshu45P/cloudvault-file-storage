import { Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const REFRESH_COOKIE_NAME = 'cloudvault_refresh_token';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
};

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, data: { user, accessToken } });
  }),

  login: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, data: { user, accessToken } });
  }),

  refresh: asyncHandler(async (req, res) => {
    const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!incomingToken) {
      throw ApiError.unauthorized('No refresh token provided');
    }
    const { user, accessToken, refreshToken } = await authService.refresh(incomingToken);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, data: { user, accessToken } });
  }),

  logout: asyncHandler(async (req, res) => {
    const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (incomingToken) {
      await authService.logout(incomingToken);
    }
    clearRefreshCookie(res);
    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  }),

  me: asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const user = await authService.me(req.user.userId);
    res.status(200).json({ success: true, data: { user } });
  }),
};
