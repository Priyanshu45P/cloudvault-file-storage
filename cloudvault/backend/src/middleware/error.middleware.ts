import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  details: Record<string, unknown>;
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      apiError = ApiError.conflict('A record with this value already exists', {
        fields: err.meta?.target,
      });
    } else if (err.code === 'P2025') {
      apiError = ApiError.notFound('Requested record was not found');
    } else {
      apiError = new ApiError(500, 'INTERNAL_ERROR', 'Database error');
    }
  } else if (err instanceof Error && err.name === 'MulterError') {
    apiError = new ApiError(400, 'UPLOAD_ERROR', err.message);
  } else {
    apiError = ApiError.internal();
    if (env.NODE_ENV !== 'production') {
      console.error(err);
    }
  }

  const response: ApiErrorResponse = {
    success: false,
    message: apiError.message,
    code: apiError.code,
    details: apiError.details ?? {},
  };

  res.status(apiError.statusCode).json(response);
};
