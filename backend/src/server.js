import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import config from './config/index.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = config.port || 5000;

// Global Middlewares
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint (direct mount)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Food Allocation API is running',
  });
});

// Root API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);


// Start HTTP Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Smart Food Allocation API server is running on port ${PORT}`);
});

export default app;
