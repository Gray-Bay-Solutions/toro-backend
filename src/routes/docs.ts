import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for the service'
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check endpoint',
          responses: {
            '200': {
              description: 'Server is healthy'
            }
          }
        }
      },
      '/cities': {
        get: {
          summary: 'Get all cities',
          responses: {
            '200': {
              description: 'List of cities'
            }
          }
        }
      },
      '/dishes': {
        get: {
          summary: 'Get all dishes',
          responses: {
            '200': {
              description: 'List of dishes'
            }
          }
        }
      },
      '/restaurants': {
        get: {
          summary: 'Get all restaurants',
          responses: {
            '200': {
              description: 'List of restaurants'
            }
          }
        }
      },
      '/reviews': {
        get: {
          summary: 'Get all reviews',
          responses: {
            '200': {
              description: 'List of reviews'
            }
          }
        }
      },
      '/users': {
        get: {
          summary: 'Get all users',
          responses: {
            '200': {
              description: 'List of users'
            }
          }
        }
      },
      '/bookmarks': {
        get: {
          summary: 'Get user bookmarks',
          responses: {
            '200': {
              description: 'List of bookmarks'
            }
          }
        }
      },
      '/data': {
        get: {
          summary: 'Get application data',
          responses: {
            '200': {
              description: 'Application data'
            }
          }
        }
      }
    }
  });
});

export default router; 