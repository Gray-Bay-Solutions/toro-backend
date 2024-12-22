import express from 'express';
import cors from 'cors';
import { config } from './config';
import healthRoute from './routes/health';
import dataRoute from './routes/data';
import businessSearchRoute from './routes/businessSearch';
import bookmarks from './routes/bookmarks';

const app = express();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://toroeats.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing JSON bodies
app.use(express.json());

// Routes
app.use('/', healthRoute);
app.use('/', dataRoute);
app.use('/', businessSearchRoute);
app.use('/', bookmarks);

// Start the Server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});