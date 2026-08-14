import { Response } from "express";

type ErrorItem = {
    field?: string;
    code: string;
    message: string;
};

/**
 * Standard success response. Used by all controllers.
 */
export const ok = <T>(res: Response, data: T, message = 'Success', status = 200) =>
    res.status(status).json({
        success: true,
        message,
        data,
        errors: [],
    });

/**
 * Standard error response. Used only by the global error handler.
 * Controllers should NEVER call this directly — they throw DomainErrors instead.
 */
export const fail = (res: Response, status: number, message: string, errors: ErrorItem[] = [], data: any = null) =>
    res.status(status).json({
        success: false,
        message,
        data,
        errors,
    });