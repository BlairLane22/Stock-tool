/**
 * Donchian Channels Technical Indicator
 * 
 * Donchian Channels are formed by taking the highest high and lowest low 
 * over a specified period. They are excellent for trend following and 
 * breakout strategies.
 * 
 * Components:
 * - Upper Channel: Highest high over N periods (resistance)
 * - Lower Channel: Lowest low over N periods (support)
 * - Middle Channel: Average of upper and lower channels (trend line)
 * 
 * Signals:
 * - Buy: Price breaks above upper channel (breakout)
 * - Sell: Price breaks below lower channel (breakdown)
 * - Trend: Price position relative to middle channel
 * 
 * Based on: Richard Dennis Turtle Trading System
 * Reference: https://www.investopedia.com/terms/d/donchianchannels.asp
 */

export interface DonchianChannelData {
  date: string;
  upper: number;
  lower: number;
  middle: number;
  current_price: number;
  position: 'UPPER_BREAKOUT' | 'LOWER_BREAKOUT' | 'UPPER_HALF' | 'LOWER_HALF' | 'MIDDLE';
  signal: 'BUY' | 'SELL' | 'BULLISH' | 'BEARISH' | 'HOLD';
  channel_width: number;
  channel_width_percent: number;
  period: number;
}

export interface DonchianChannelResult {
  success: boolean;
  symbol: string;
  indicator: string;
  period: number;
  timestamp: string;
  data: DonchianChannelData | DonchianChannelData[];
  summary?: {
    latest_signal: string;
    latest_position: string;
    current_price: number;
    upper_channel: number;
    lower_channel: number;
    middle_channel: number;
    channel_width_percent: number;
  };
}

/**
 * Calculate Donchian Channels for given price data
 */
export function calculateDonchianChannels(data: any[], period: number = 20): DonchianChannelData[] {
  const result: DonchianChannelData[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      // Not enough data points yet
      result.push({
        date: data[i].date,
        upper: 0,
        lower: 0,
        middle: 0,
        current_price: parseFloat(data[i]['4. close']),
        position: 'MIDDLE',
        signal: 'HOLD',
        channel_width: 0,
        channel_width_percent: 0,
        period: period
      });
      continue;
    }
    
    // Get the period window
    const window = data.slice(i - period + 1, i + 1);
    
    // Calculate highest high and lowest low
    const highs = window.map(d => parseFloat(d['3. high']));
    const lows = window.map(d => parseFloat(d['2. low']));
    
    const upperChannel = Math.max(...highs);
    const lowerChannel = Math.min(...lows);
    const middleChannel = (upperChannel + lowerChannel) / 2;
    
    const currentPrice = parseFloat(data[i]['4. close']);
    
    // Determine position and signal
    let position: DonchianChannelData['position'] = 'MIDDLE';
    let signal: DonchianChannelData['signal'] = 'HOLD';
    
    if (currentPrice >= upperChannel) {
      position = 'UPPER_BREAKOUT';
      signal = 'BUY'; // Breakout above upper channel
    } else if (currentPrice <= lowerChannel) {
      position = 'LOWER_BREAKOUT';
      signal = 'SELL'; // Breakout below lower channel
    } else if (currentPrice > middleChannel) {
      position = 'UPPER_HALF';
      signal = 'BULLISH';
    } else if (currentPrice < middleChannel) {
      position = 'LOWER_HALF';
      signal = 'BEARISH';
    }
    
    // Calculate channel width for volatility assessment
    const channelWidth = upperChannel - lowerChannel;
    const channelWidthPercent = (channelWidth / middleChannel) * 100;
    
    result.push({
      date: data[i].date,
      upper: upperChannel,
      lower: lowerChannel,
      middle: middleChannel,
      current_price: currentPrice,
      position: position,
      signal: signal,
      channel_width: channelWidth,
      channel_width_percent: channelWidthPercent,
      period: period
    });
  }
  
  return result.reverse(); // Most recent first
}

/**
 * Generate analysis text for Donchian Channel data
 */
export function getDonchianAnalysis(data: DonchianChannelData): string {
  const { position, signal, channel_width_percent, current_price, upper, lower, middle } = data;
  
  let analysis = '';
  
  switch (position) {
    case 'UPPER_BREAKOUT':
      analysis = `🚀 STRONG BULLISH: Price broke above upper Donchian Channel (${upper.toFixed(2)}). This is a classic breakout signal indicating strong upward momentum. Consider long positions.`;
      break;
    case 'LOWER_BREAKOUT':
      analysis = `📉 STRONG BEARISH: Price broke below lower Donchian Channel (${lower.toFixed(2)}). This indicates strong downward momentum. Consider short positions or exit longs.`;
      break;
    case 'UPPER_HALF':
      analysis = `📈 BULLISH BIAS: Price (${current_price.toFixed(2)}) is in upper half of channel, above middle line (${middle.toFixed(2)}). Upward bias but no breakout yet.`;
      break;
    case 'LOWER_HALF':
      analysis = `📉 BEARISH BIAS: Price (${current_price.toFixed(2)}) is in lower half of channel, below middle line (${middle.toFixed(2)}). Downward bias but no breakdown yet.`;
      break;
    default:
      analysis = `⚪ NEUTRAL: Price is near the middle of the Donchian Channel. Wait for clearer directional signals.`;
  }
  
  // Add volatility context
  if (channel_width_percent > 15) {
    analysis += ` High volatility environment (${channel_width_percent.toFixed(1)}% channel width).`;
  } else if (channel_width_percent < 5) {
    analysis += ` Low volatility environment (${channel_width_percent.toFixed(1)}% channel width) - expect breakout soon.`;
  }
  
  return analysis;
}

/**
 * Get mock Donchian Channel data for testing
 */
export function getMockDonchianData(symbol: string, period: number = 20): DonchianChannelResult {
  return {
    success: true,
    symbol: symbol.toUpperCase(),
    indicator: 'donchian_channels',
    period: period,
    timestamp: new Date().toISOString(),
    data: {
      date: new Date().toISOString().split('T')[0],
      upper: 155.80,
      lower: 142.30,
      middle: 149.05,
      current_price: 150.25,
      position: 'UPPER_HALF',
      signal: 'BULLISH',
      channel_width: 13.50,
      channel_width_percent: 9.06,
      period: period
    },
    summary: {
      latest_signal: 'BULLISH',
      latest_position: 'UPPER_HALF',
      current_price: 150.25,
      upper_channel: 155.80,
      lower_channel: 142.30,
      middle_channel: 149.05,
      channel_width_percent: 9.06
    }
  };
}

/**
 * Get comprehensive mock Donchian Channel data with historical points
 */
export function getMockDonchianHistoricalData(symbol: string, period: number = 20): DonchianChannelResult {
  const mockData: DonchianChannelData[] = [
    {
      date: '2024-01-15',
      upper: 155.80,
      lower: 142.30,
      middle: 149.05,
      current_price: 150.25,
      position: 'UPPER_HALF',
      signal: 'BULLISH',
      channel_width: 13.50,
      channel_width_percent: 9.06,
      period: period
    },
    {
      date: '2024-01-14',
      upper: 154.90,
      lower: 141.80,
      middle: 148.35,
      current_price: 149.10,
      position: 'UPPER_HALF',
      signal: 'BULLISH',
      channel_width: 13.10,
      channel_width_percent: 8.83,
      period: period
    },
    {
      date: '2024-01-13',
      upper: 154.20,
      lower: 141.50,
      middle: 147.85,
      current_price: 148.75,
      position: 'UPPER_HALF',
      signal: 'BULLISH',
      channel_width: 12.70,
      channel_width_percent: 8.59,
      period: period
    },
    {
      date: '2024-01-12',
      upper: 153.80,
      lower: 140.90,
      middle: 147.35,
      current_price: 147.20,
      position: 'MIDDLE',
      signal: 'HOLD',
      channel_width: 12.90,
      channel_width_percent: 8.75,
      period: period
    },
    {
      date: '2024-01-11',
      upper: 153.50,
      lower: 140.20,
      middle: 146.85,
      current_price: 146.80,
      position: 'MIDDLE',
      signal: 'HOLD',
      channel_width: 13.30,
      channel_width_percent: 9.06,
      period: period
    }
  ];

  return {
    success: true,
    symbol: symbol.toUpperCase(),
    indicator: 'donchian_channels',
    period: period,
    timestamp: new Date().toISOString(),
    data: mockData,
    summary: {
      latest_signal: mockData[0].signal,
      latest_position: mockData[0].position,
      current_price: mockData[0].current_price,
      upper_channel: mockData[0].upper,
      lower_channel: mockData[0].lower,
      middle_channel: mockData[0].middle,
      channel_width_percent: mockData[0].channel_width_percent
    }
  };
}
