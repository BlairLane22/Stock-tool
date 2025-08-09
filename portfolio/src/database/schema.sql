-- Portfolio Management Database Schema
-- SQLite database for StockTrack Portfolio API

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_date TEXT NOT NULL DEFAULT (datetime('now')),
    last_login TEXT,
    is_active BOOLEAN DEFAULT 1
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    initial_cash REAL NOT NULL DEFAULT 10000.00,
    current_cash REAL NOT NULL DEFAULT 10000.00,
    created_date TEXT NOT NULL DEFAULT (datetime('now')),
    last_updated TEXT NOT NULL DEFAULT (datetime('now')),
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    average_price REAL NOT NULL CHECK (average_price > 0),
    purchase_date TEXT NOT NULL,
    created_date TEXT NOT NULL DEFAULT (datetime('now')),
    updated_date TEXT NOT NULL DEFAULT (datetime('now')),
    trading_strategy_id TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (trading_strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    notes TEXT,
    added_date TEXT NOT NULL DEFAULT (datetime('now')),
    target_price REAL,
    alert_enabled BOOLEAN DEFAULT 0,
    trading_strategy_id TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (trading_strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL,
    UNIQUE(portfolio_id, symbol)
);

-- Trading strategies table (custom indicator combinations per stock)
CREATE TABLE IF NOT EXISTS trading_strategies (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    indicators TEXT NOT NULL, -- JSON array of indicators: ["rsi", "bollinger-bands", "ema"]
    buy_conditions TEXT, -- JSON object with buy conditions
    sell_conditions TEXT, -- JSON object with sell conditions
    risk_management TEXT, -- JSON object with stop loss, take profit rules
    is_active BOOLEAN DEFAULT 1,
    created_date TEXT NOT NULL DEFAULT (datetime('now')),
    updated_date TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Transactions table (for tracking all buy/sell activities)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price REAL NOT NULL CHECK (price > 0),
    total_amount REAL NOT NULL,
    fees REAL DEFAULT 0.00,
    transaction_date TEXT NOT NULL DEFAULT (datetime('now')),
    notes TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Trading decisions table (for AI/algorithm decisions)
CREATE TABLE IF NOT EXISTS trading_decisions (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decision_type TEXT NOT NULL CHECK (decision_type IN ('BUY', 'SELL', 'HOLD', 'WATCH')),
    confidence_level TEXT CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    recommended_quantity INTEGER,
    recommended_price REAL,
    reasoning TEXT,
    indicator_data TEXT, -- JSON string of technical indicator results
    decision_date TEXT NOT NULL DEFAULT (datetime('now')),
    executed BOOLEAN DEFAULT 0,
    executed_date TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Market data cache table (to avoid excessive API calls)
CREATE TABLE IF NOT EXISTS market_data_cache (
    symbol TEXT PRIMARY KEY,
    price REAL NOT NULL,
    change_amount REAL,
    change_percent REAL,
    volume INTEGER,
    rsi REAL,
    signal TEXT,
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Portfolio performance snapshots (daily/weekly snapshots)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    total_value REAL NOT NULL,
    cash_value REAL NOT NULL,
    holdings_value REAL NOT NULL,
    total_gain_loss REAL NOT NULL,
    total_gain_loss_percent REAL NOT NULL,
    snapshot_type TEXT DEFAULT 'DAILY' CHECK (snapshot_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_holdings_strategy ON holdings(trading_strategy_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_portfolio_id ON watchlist(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(symbol);
CREATE INDEX IF NOT EXISTS idx_watchlist_strategy ON watchlist(trading_strategy_id);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_portfolio_id ON trading_strategies(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_trading_decisions_portfolio_id ON trading_decisions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_trading_decisions_symbol ON trading_decisions(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_decisions_date ON trading_decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_id ON portfolio_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date);

-- Insert default user (you)
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name) 
VALUES (
    'user-blair-1', 
    'blair@stocktrack.com', 
    '$2b$10$dummy.hash.for.development.only', 
    'Blair', 
    'Lane'
);

-- Insert empty portfolio for Blair
INSERT OR IGNORE INTO portfolios (id, user_id, name, description, initial_cash, current_cash)
VALUES (
    'portfolio-blair-main',
    'user-blair-1',
    'Blair''s Trading Account',
    'Main trading portfolio with AI-driven decisions',
    100000.00,
    100000.00
);

-- Insert default trading strategies
INSERT OR IGNORE INTO trading_strategies (id, portfolio_id, name, description, indicators, buy_conditions, sell_conditions, risk_management)
VALUES
(
    'strategy-bollinger-only',
    'portfolio-blair-main',
    'Bollinger Bands Only',
    'Pure Bollinger Bands strategy - buy at lower band, sell at upper band',
    '["bollinger-bands"]',
    '{"bollinger_signal": "BUY", "price_position": "near_lower_band"}',
    '{"bollinger_signal": "SELL", "price_position": "near_upper_band"}',
    '{"stop_loss_percent": 5, "take_profit_percent": 10}'
),
(
    'strategy-rsi-ema',
    'portfolio-blair-main',
    'RSI + EMA Combo',
    'RSI oversold/overbought with EMA trend confirmation',
    '["rsi", "ema"]',
    '{"rsi_below": 30, "ema_trend": "bullish"}',
    '{"rsi_above": 70, "ema_trend": "bearish"}',
    '{"stop_loss_percent": 7, "take_profit_percent": 15}'
),
(
    'strategy-macd-rsi',
    'portfolio-blair-main',
    'MACD + RSI Power',
    'MACD crossover signals with RSI confirmation',
    '["macd", "rsi"]',
    '{"macd_signal": "BUY", "rsi_below": 50}',
    '{"macd_signal": "SELL", "rsi_above": 50}',
    '{"stop_loss_percent": 6, "take_profit_percent": 12}'
),
(
    'strategy-pattern-focus',
    'portfolio-blair-main',
    'Chart Patterns Only',
    'Focus on Head & Shoulders and Cup & Handle patterns',
    '["head-and-shoulders", "cup-handle"]',
    '{"cup_handle_signal": "BUY", "confidence": "HIGH"}',
    '{"head_shoulders_signal": "SELL", "confidence": "HIGH"}',
    '{"stop_loss_percent": 8, "take_profit_percent": 20}'
),
(
    'strategy-all-indicators',
    'portfolio-blair-main',
    'Full Analysis',
    'Use all available indicators for comprehensive analysis',
    '["rsi", "macd", "bollinger-bands", "head-and-shoulders", "cup-handle"]',
    '{"min_buy_signals": 3, "confidence": "MEDIUM"}',
    '{"min_sell_signals": 3, "confidence": "MEDIUM"}',
    '{"stop_loss_percent": 5, "take_profit_percent": 10}'
);

-- Create triggers to automatically update timestamps
CREATE TRIGGER IF NOT EXISTS update_portfolio_timestamp 
    AFTER UPDATE ON portfolios
    FOR EACH ROW
BEGIN
    UPDATE portfolios SET last_updated = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_holdings_timestamp 
    AFTER UPDATE ON holdings
    FOR EACH ROW
BEGIN
    UPDATE holdings SET updated_date = datetime('now') WHERE id = NEW.id;
END;
