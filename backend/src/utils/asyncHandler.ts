import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async controller function to properly catch exceptions
 * and pass them to the Express global error handler.
 *
 * This eliminates the need for try/catch blocks in every controller.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => any
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
