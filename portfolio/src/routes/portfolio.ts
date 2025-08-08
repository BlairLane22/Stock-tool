import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolioController';

const router = Router();
const portfolioController = new PortfolioController();

// Portfolio management routes
router.get('/', portfolioController.getAllPortfolios);
router.post('/', portfolioController.createPortfolio);
router.get('/:id', portfolioController.getPortfolio);
router.put('/:id', portfolioController.updatePortfolio);
router.delete('/:id', portfolioController.deletePortfolio);

// Holdings management
router.get('/:id/holdings', portfolioController.getHoldings);
router.post('/:id/holdings', portfolioController.addHolding);
router.put('/:id/holdings/:holdingId', portfolioController.updateHolding);
router.delete('/:id/holdings/:holdingId', portfolioController.removeHolding);

// Portfolio analysis
router.get('/:id/analysis', portfolioController.getPortfolioAnalysis);
router.get('/:id/performance', portfolioController.getPerformance);
router.get('/:id/risk', portfolioController.getRiskAnalysis);

// Watchlist management
router.get('/:id/watchlist', portfolioController.getWatchlist);
router.post('/:id/watchlist', portfolioController.addToWatchlist);
router.delete('/:id/watchlist/:symbol', portfolioController.removeFromWatchlist);

// Trading analysis
router.get('/:id/trading-decisions', portfolioController.getTradingDecisions);
router.post('/analyze/stock/:symbol', portfolioController.analyzeStock);
router.get('/analyze/stock/:symbol', portfolioController.analyzeStock); // GET version for browser
router.post('/analyze/multiple', portfolioController.analyzeMultipleStocks);
router.post('/analyze/popular', portfolioController.getPopularStocks);
router.get('/analyze/popular', portfolioController.getPopularStocks); // GET version for browser

export default router;
