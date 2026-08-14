import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { ZodError } from 'zod';
import { fail } from '@/utils/response';
import { logger } from '@/utils/logger';
import {
  DomainError,
  BadRequestError,
  EntityNotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  TooManyRequestsError,
} from '@/utils/errors';

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 1. Handle Zod Validation Errors (from validateRequest middleware)
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      code: issue.code,
      message: issue.message,
    }));
    return fail(res, 400, 'Validation Error', errors);
  }

  // 2. Handle JWT specific errors thrown outside of explicit try-catch blocks
  if (err instanceof JsonWebTokenError) {
    return fail(res, 401, 'Unauthorized', [
      { code: 'INVALID_TOKEN', message: 'The provided token is invalid.' }
    ]);
  }

  if (err instanceof TokenExpiredError) {
    return fail(res, 401, 'Unauthorized', [
      { code: 'TOKEN_EXPIRED', message: 'The provided token has expired.' }
    ]);
  }

  // 3. Handle Domain Errors (thrown by services via ApiErrors)
  if (err instanceof DomainError) {
    let statusCode = 500;

    if (err instanceof BadRequestError) statusCode = 400;
    else if (err instanceof EntityNotFoundError) statusCode = 404;
    else if (err instanceof UnauthorizedError) statusCode = 401;
    else if (err instanceof ForbiddenError) statusCode = 403;
    else if (err instanceof ValidationError) statusCode = 400;
    else if (err instanceof ConflictError) statusCode = 409;
    else if (err instanceof TooManyRequestsError) statusCode = 429;

    return fail(res, statusCode, err.message, err.details, err.data);
  }

  // 4. Fallback for unexpected/unhandled errors
  logger.error(`[${req.id}] Unhandled Error:`, err);
  return fail(res, 500, 'Internal Server Error', [
    { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server.' },
  ]);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return fail(res, 404, 'Not Found', [
    { code: 'ROUTE_NOT_FOUND', message: `Cannot find ${req.method} ${req.originalUrl}` },
  ]);
};
