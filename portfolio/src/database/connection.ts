import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

/**
 * Initialize and get database connection
 */
export async function getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (db) {
    return db;
  }

  try {
    // Create database directory if it doesn't exist
    const dbDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database connection
    const dbPath = path.join(dbDir, 'portfolio.db');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    console.log(`📊 Database connected: ${dbPath}`);
    
    // Initialize schema
    await initializeSchema();
    
    return db;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Initialize database schema
 */
async function initializeSchema(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Try multiple possible schema file locations
    let schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.join(__dirname, '../../src/database/schema.sql');
    }
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.join(process.cwd(), 'src/database/schema.sql');
    }

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found. Tried: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    await db.exec(schema);
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Schema initialization failed:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('📊 Database connection closed');
  }
}

/**
 * Execute a query with parameters
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDatabase();
  return database.all(sql, params) as Promise<T[]>;
}

/**
 * Execute a single query and return first result
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const database = await getDatabase();
  return database.get<T>(sql, params);
}

/**
 * Execute an insert/update/delete query
 */
export async function execute(sql: string, params: any[] = []): Promise<any> {
  const database = await getDatabase();
  return database.run(sql, params);
}

/**
 * Begin a transaction
 */
export async function beginTransaction(): Promise<void> {
  const database = await getDatabase();
  await database.exec('BEGIN TRANSACTION');
}

/**
 * Commit a transaction
 */
export async function commitTransaction(): Promise<void> {
  const database = await getDatabase();
  await database.exec('COMMIT');
}

/**
 * Rollback a transaction
 */
export async function rollbackTransaction(): Promise<void> {
  const database = await getDatabase();
  await database.exec('ROLLBACK');
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  await beginTransaction();
  try {
    const result = await callback();
    await commitTransaction();
    return result;
  } catch (error) {
    await rollbackTransaction();
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  users: number;
  portfolios: number;
  holdings: number;
  watchlist: number;
  transactions: number;
  tradingDecisions: number;
}> {
  const database = await getDatabase();
  
  const [users, portfolios, holdings, watchlist, transactions, tradingDecisions] = await Promise.all([
    database.get<{ count: number }>('SELECT COUNT(*) as count FROM users'),
    database.get<{ count: number }>('SELECT COUNT(*) as count FROM portfolios'),
    database.get<{ count: number }>('SELECT COUNT(*) as count FROM holdings'),
    database.get<{ count: number }>('SELECT COUNT(*) as count FROM watchlist'),
    database.get<{ count: number }>('SELECT COUNT(*) as count FROM transactions'),
    database.get<{ count: number }>('SELECT COUNT(*) as count FROM trading_decisions')
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

// Graceful shutdown
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
