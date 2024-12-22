import express from 'express';
import cors from 'cors';
import { config } from './config';
import healthRoute from './routes/health';
import dataRoute from './routes/data';
import businessSearchRoute from './routes/businessSearch';
import bookmarks from './routes/bookmarks';

const app = express();

// CORS Configuration
const allowedOrigins = [
  // Development origins
  'http://localhost:3000',
  'http://localhost:3001',
  
  // Production origins
  'https://toroeats.com',
  'https://www.toroeats.com',
  'https://toro-backend-nine.vercel.app'
];

const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true, // Enable cookies and credentials
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Enable CORS with options
app.use(cors(corsOptions));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Middleware for parsing JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/', healthRoute);
app.use('/', dataRoute);
app.use('/', businessSearchRoute);
app.use('/', bookmarks);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start the Server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});

export default app;