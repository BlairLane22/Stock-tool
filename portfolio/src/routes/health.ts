import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
    
    // Check backend connectivity
    let backendStatus = 'unknown';
    try {
      const backendResponse = await axios.get(`${backendUrl}/health`, { timeout: 5000 });
      backendStatus = backendResponse.status === 200 ? 'healthy' : 'unhealthy';
    } catch (error) {
      backendStatus = 'unreachable';
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        portfolio: 'healthy',
        backend: backendStatus
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
    
    // Test backend endpoints
    const backendTests = [];
    const endpoints = ['/health', '/api/rsi/AAPL/quick'];
    
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await axios.get(`${backendUrl}${endpoint}`, { timeout: 5000 });
        const duration = Date.now() - start;
        
        backendTests.push({
          endpoint,
          status: 'healthy',
          responseTime: duration,
          statusCode: response.status
        });
      } catch (error) {
        backendTests.push({
          endpoint,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      backend: {
        url: backendUrl,
        tests: backendTests
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
