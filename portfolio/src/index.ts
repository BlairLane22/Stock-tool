import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import portfolioRoutes from './routes/portfolio';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001', // Allow requests from the same server (for docs page)
    'http://127.0.0.1:3001'   // Alternative localhost format
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/docs', express.static('public'));

// Logging middleware
app.use(morgan('combined'));

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'StockTrack Portfolio API',
    version: '1.0.0',
    description: 'Portfolio management API for StockTrack',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      portfolio: '/api/portfolio'
    },
    documentation: {
      interactive: '/docs/api-docs.html',
      github: 'https://github.com/stocktrack/portfolio-api'
    },
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StockTrack Portfolio API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Backend API: ${process.env.BACKEND_API_URL || 'http://localhost:3000'}`);
});

export default app;
