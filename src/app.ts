import express from 'express';
import cors from 'cors';
import { config } from './config';
import healthRoute from './routes/health';
import dataRoute from './routes/data';
import businessSearchRoute from './routes/businessSearch';
import bookmarks from './routes/bookmarks';

const app = express();

const allowedOrigins = [
  // Development origins
  'http://localhost:3000',
  'http://localhost:3001',
  
  // Production origins
  'https://toroeats.com',
  'https://www.toroeats.com',
  'https://toro-backend-nine.vercel.app',
  'https://toro-frontend-seven.vercel.app',
  
  // FlutterFlow origins
  'https://app.flutterflow.io',
  /\.flutterflow\.io$/,
];

const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      // Strict production configuration
      origin: allowedOrigins.filter(origin => origin !== '*'),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers'
      ],
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204
    }
  : {
      // Development configuration
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers'
      ],
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204
    };

// Enable CORS with options
app.use(cors(corsOptions));

// Update the security headers middleware
app.use((req, res, next) => {
  // Remove or modify CORS-related headers that might conflict
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// Middleware for parsing JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Routes
app.use('/', healthRoute);
app.use('/', dataRoute);
app.use('/', businessSearchRoute);
app.use('/', bookmarks);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  
  // Send JSON response
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    success: false
  });
});

// Start the Server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});

export default app;