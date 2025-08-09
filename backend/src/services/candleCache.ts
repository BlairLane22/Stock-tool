import { getCandles } from '../commands/helper/getCandles';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface CacheEntry {
  candles: Candle[];
  timestamp: number;
  symbol: string;
}

class CandleCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get candles for a symbol, using cache if available and fresh
   */
  async getCandles(symbol: string): Promise<Candle[]> {
    const cacheKey = symbol.toUpperCase();
    const now = Date.now();
    
    // Check if we have cached data that's still fresh
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`📦 Using cached candle data for ${symbol} (${Math.round((now - cached.timestamp) / 1000)}s old)`);
      return cached.candles;
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh candle data for ${symbol}...`);
    try {
      const candles = await getCandles(symbol);
      
      // Cache the result
      this.cache.set(cacheKey, {
        candles,
        timestamp: now,
        symbol: cacheKey
      });

      console.log(`✅ Cached ${candles.length} candles for ${symbol}`);
      return candles;
    } catch (error) {
      console.error(`❌ Failed to fetch candles for ${symbol}:`, error);
      
      // If we have stale cached data, return it as fallback
      if (cached) {
        console.log(`⚠️  Using stale cached data for ${symbol} as fallback`);
        return cached.candles;
      }
      
      throw error;
    }
  }

  /**
   * Preload candles for multiple symbols
   */
  async preloadCandles(symbols: string[]): Promise<Map<string, Candle[]>> {
    console.log(`🚀 Preloading candles for ${symbols.length} symbols: ${symbols.join(', ')}`);
    
    const results = new Map<string, Candle[]>();
    const promises = symbols.map(async (symbol) => {
      try {
        const candles = await this.getCandles(symbol);
        results.set(symbol.toUpperCase(), candles);
        return { symbol, success: true, count: candles.length };
      } catch (error) {
        console.error(`❌ Failed to preload ${symbol}:`, error);
        return { symbol, success: false, error: error.message };
      }
    });

    const loadResults = await Promise.all(promises);
    
    // Log results
    const successful = loadResults.filter(r => r.success);
    const failed = loadResults.filter(r => !r.success);
    
    console.log(`✅ Successfully preloaded ${successful.length} symbols`);
    if (failed.length > 0) {
      console.log(`❌ Failed to preload ${failed.length} symbols: ${failed.map(f => f.symbol).join(', ')}`);
    }

    return results;
  }

  /**
   * Clear cache for a specific symbol
   */
  clearCache(symbol: string): void {
    const cacheKey = symbol.toUpperCase();
    if (this.cache.delete(cacheKey)) {
      console.log(`🗑️  Cleared cache for ${symbol}`);
    }
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`🗑️  Cleared all cached data (${count} entries)`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    entries: Array<{
      symbol: string;
      candleCount: number;
      ageSeconds: number;
      isStale: boolean;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([symbol, entry]) => ({
      symbol,
      candleCount: entry.candles.length,
      ageSeconds: Math.round((now - entry.timestamp) / 1000),
      isStale: (now - entry.timestamp) > this.CACHE_DURATION
    }));

    return {
      totalEntries: this.cache.size,
      entries
    };
  }

  /**
   * Clean up stale cache entries
   */
  cleanupStaleEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [symbol, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > this.CACHE_DURATION * 2) { // Remove entries older than 10 minutes
        this.cache.delete(symbol);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} stale cache entries`);
    }
  }
}

// Export singleton instance
export const candleCache = new CandleCacheService();

// Auto-cleanup every 10 minutes
setInterval(() => {
  candleCache.cleanupStaleEntries();
}, 10 * 60 * 1000);
