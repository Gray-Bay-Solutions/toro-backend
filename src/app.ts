import express from 'express';
import cors from 'cors';
import routes from './routes';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Mount all routes
app.use(routes);

// Error handling
app.use(errorHandler);

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}

export default app;