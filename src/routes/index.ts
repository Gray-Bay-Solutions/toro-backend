import { Router } from 'express';
import citiesRouter from './cities';
import dishesRouter from './dishes';
import restaurantsRouter from './restaurants';
import reviewsRouter from './reviews';
import usersRouter from './users';
import bookmarksRouter from './bookmarks';
import dataRouter from './data';
import healthRouter from './health';
import docsRouter from './docs';
import { Request, Response } from 'express';

const router = Router();

// API Version prefix
const API_PREFIX = '/api/v1';

// Root route handler
router.get('/', (_req: Request, res: Response) => {
    res.json({
        status: 'success',
        message: 'Welcome to the API',
        version: '1.0',
        documentation: `${API_PREFIX}/docs`,
        endpoints: [
            '/health',
            `${API_PREFIX}/cities`,
            `${API_PREFIX}/dishes`,
            `${API_PREFIX}/restaurants`,
            `${API_PREFIX}/reviews`,
            `${API_PREFIX}/users`,
            `${API_PREFIX}/bookmarks`,
            `${API_PREFIX}/business-search`,
            `${API_PREFIX}/data`
        ]
    });
});

// Health check route (no prefix)
router.use('/health', healthRouter);

// API routes with version prefix
router.use(`${API_PREFIX}/docs`, docsRouter);
router.use(`${API_PREFIX}/cities`, citiesRouter);
router.use(`${API_PREFIX}/dishes`, dishesRouter);
router.use(`${API_PREFIX}/restaurants`, restaurantsRouter);
router.use(`${API_PREFIX}/reviews`, reviewsRouter);
router.use(`${API_PREFIX}/users`, usersRouter);
router.use(`${API_PREFIX}/bookmarks`, bookmarksRouter);
router.use(`${API_PREFIX}/data`, dataRouter);

// 404 handler for unknown routes
router.use('*', (_req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        success: false
    });
});

export default router; 