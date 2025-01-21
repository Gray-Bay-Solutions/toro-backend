import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    status?: number;
    code?: string;
}

export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        code: err.code,
        success: false
    });
}; 