import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Validates req[part] against the given Zod schema and replaces it
 * with the parsed (and coerced/defaulted) value.
 */
export const validate =
  (schema: AnyZodObject, part: RequestPart = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);
      req[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.flatten().fieldErrors;
        next(ApiError.badRequest('Validation failed', details as Record<string, unknown>));
        return;
      }
      next(err);
    }
  };
