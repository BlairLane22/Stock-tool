"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
exports.query = query;
exports.queryOne = queryOne;
exports.execute = execute;
exports.beginTransaction = beginTransaction;
exports.commitTransaction = commitTransaction;
exports.rollbackTransaction = rollbackTransaction;
exports.transaction = transaction;
exports.getDatabaseStats = getDatabaseStats;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let db = null;
async function getDatabase() {
    if (db) {
        return db;
    }
    try {
        const dbDir = path_1.default.join(__dirname, '../../data');
        if (!fs_1.default.existsSync(dbDir)) {
            fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        const dbPath = path_1.default.join(dbDir, 'portfolio.db');
        db = await (0, sqlite_1.open)({
            filename: dbPath,
            driver: sqlite3_1.default.Database
        });
        await db.exec('PRAGMA foreign_keys = ON');
        console.log(`📊 Database connected: ${dbPath}`);
        await initializeSchema();
        return db;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}
async function initializeSchema() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    try {
        let schemaPath = path_1.default.join(__dirname, 'schema.sql');
        if (!fs_1.default.existsSync(schemaPath)) {
            schemaPath = path_1.default.join(__dirname, '../../src/database/schema.sql');
        }
        if (!fs_1.default.existsSync(schemaPath)) {
            schemaPath = path_1.default.join(process.cwd(), 'src/database/schema.sql');
        }
        if (!fs_1.default.existsSync(schemaPath)) {
            throw new Error(`Schema file not found. Tried: ${schemaPath}`);
        }
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        await db.exec(schema);
        console.log('✅ Database schema initialized');
    }
    catch (error) {
        console.error('❌ Schema initialization failed:', error);
        throw error;
    }
}
async function closeDatabase() {
    if (db) {
        await db.close();
        db = null;
        console.log('📊 Database connection closed');
    }
}
async function query(sql, params = []) {
    const database = await getDatabase();
    return database.all(sql, params);
}
async function queryOne(sql, params = []) {
    const database = await getDatabase();
    return database.get(sql, params);
}
async function execute(sql, params = []) {
    const database = await getDatabase();
    return database.run(sql, params);
}
async function beginTransaction() {
    const database = await getDatabase();
    await database.exec('BEGIN TRANSACTION');
}
async function commitTransaction() {
    const database = await getDatabase();
    await database.exec('COMMIT');
}
async function rollbackTransaction() {
    const database = await getDatabase();
    await database.exec('ROLLBACK');
}
async function transaction(callback) {
    await beginTransaction();
    try {
        const result = await callback();
        await commitTransaction();
        return result;
    }
    catch (error) {
        await rollbackTransaction();
        throw error;
    }
}
async function getDatabaseStats() {
    const database = await getDatabase();
    const [users, portfolios, holdings, watchlist, transactions, tradingDecisions] = await Promise.all([
        database.get('SELECT COUNT(*) as count FROM users'),
        database.get('SELECT COUNT(*) as count FROM portfolios'),
        database.get('SELECT COUNT(*) as count FROM holdings'),
        database.get('SELECT COUNT(*) as count FROM watchlist'),
        database.get('SELECT COUNT(*) as count FROM transactions'),
        database.get('SELECT COUNT(*) as count FROM trading_decisions')
    ]);
    return {
        users: users?.count || 0,
        portfolios: portfolios?.count || 0,
        holdings: holdings?.count || 0,
        watchlist: watchlist?.count || 0,
        transactions: transactions?.count || 0,
        tradingDecisions: tradingDecisions?.count || 0
    };
}
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await closeDatabase();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await closeDatabase();
    process.exit(0);
});
//# sourceMappingURL=connection.js.map