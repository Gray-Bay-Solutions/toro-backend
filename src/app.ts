import express from 'express';
import { config } from './config';
import healthRoute from './routes/health';
import dataRoute from './routes/data';
import businessSearchRoute from './routes/businessSearch';

const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());

// Routes
app.use('/', healthRoute);
app.use('/', dataRoute);
app.use('/', businessSearchRoute);

// Start the Server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
