import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
export declare function getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>>;
export declare function closeDatabase(): Promise<void>;
export declare function query<T = any>(sql: string, params?: any[]): Promise<T[]>;
export declare function queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
export declare function execute(sql: string, params?: any[]): Promise<any>;
export declare function beginTransaction(): Promise<void>;
export declare function commitTransaction(): Promise<void>;
export declare function rollbackTransaction(): Promise<void>;
export declare function transaction<T>(callback: () => Promise<T>): Promise<T>;
export declare function getDatabaseStats(): Promise<{
    users: number;
    portfolios: number;
    holdings: number;
    watchlist: number;
    transactions: number;
    tradingDecisions: number;
}>;
//# sourceMappingURL=connection.d.ts.map