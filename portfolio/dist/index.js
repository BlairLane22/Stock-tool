"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const portfolio_1 = __importDefault(require("./routes/portfolio"));
const auth_1 = __importDefault(require("./routes/auth"));
const health_1 = __importDefault(require("./routes/health"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001'
    ],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/docs', express_1.default.static('public'));
app.use((0, morgan_1.default)('combined'));
app.use('/health', health_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/portfolio', portfolio_1.default);
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
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});
app.listen(PORT, () => {
    console.log(`🚀 StockTrack Portfolio API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Backend API: ${process.env.BACKEND_API_URL || 'http://localhost:3000'}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map