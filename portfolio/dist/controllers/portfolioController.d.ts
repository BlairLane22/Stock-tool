import { Request, Response } from 'express';
export declare class PortfolioController {
    private portfolioService;
    private tradingService;
    private backendService;
    constructor();
    getAllPortfolios: (req: Request, res: Response) => Promise<void>;
    createPortfolio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getPortfolio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updatePortfolio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deletePortfolio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getHoldings: (req: Request, res: Response) => Promise<void>;
    addHolding: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateHolding: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    removeHolding: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getPortfolioAnalysis: (req: Request, res: Response) => Promise<void>;
    getPerformance: (req: Request, res: Response) => Promise<void>;
    getRiskAnalysis: (req: Request, res: Response) => Promise<void>;
    getWatchlist: (req: Request, res: Response) => Promise<void>;
    addToWatchlist: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    removeFromWatchlist: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    analyzeStock: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    analyzeMultipleStocks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getPopularStocks: (req: Request, res: Response) => Promise<void>;
    getTradingDecisions: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=portfolioController.d.ts.map