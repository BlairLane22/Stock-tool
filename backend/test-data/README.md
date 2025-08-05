# Test Data for Chart Pattern Analysis

This directory contains curated test data sets with known chart patterns for testing and validation purposes.

## File Structure

- `cup-and-handle-*.json` - Files containing candle data with confirmed cup and handle patterns
- `no-pattern-*.json` - Files containing candle data with no clear patterns
- `false-patterns-*.json` - Files containing data that might look like patterns but aren't valid

## Data Format

Each JSON file contains an array of candle objects with the following structure:

```json
{
  "symbol": "TEST",
  "timeframe": "daily",
  "description": "Description of the pattern",
  "expectedPattern": {
    "type": "cup-and-handle",
    "confidence": "HIGH",
    "cupStart": 15,
    "cupBottom": 45,
    "cupEnd": 75,
    "handleStart": 76,
    "handleEnd": 85,
    "cupDepth": 25.5,
    "handleDepth": 8.2
  },
  "candles": [
    {
      "open": 100.0,
      "high": 102.5,
      "low": 99.0,
      "close": 101.5,
      "volume": 1000000,
      "timeStamp": 1640995200
    }
  ]
}
```

## Usage

### In Tests
```javascript
import testData from '../test-data/cup-and-handle-strong.json';
const result = cupAndHandle(testData.candles);
expect(result.isPattern).toBe(true);
expect(result.confidence).toBe('HIGH');
```

### In Commands
```bash
# Test with known pattern data
npm start cup-handle TEST --test-data cup-and-handle-strong.json
```

## Test Data Sets

### Cup and Handle Patterns

1. **cup-and-handle-strong.json** - High confidence pattern
2. **cup-and-handle-medium.json** - Medium confidence pattern  
3. **cup-and-handle-shallow.json** - Shallow cup pattern
4. **cup-and-handle-deep.json** - Deep cup pattern
5. **cup-and-handle-long.json** - Long duration pattern

### Non-Patterns

1. **no-pattern-trending.json** - Simple uptrend, no pattern
2. **no-pattern-sideways.json** - Sideways movement
3. **v-shaped-recovery.json** - V-shaped (not cup-shaped) recovery

### False Patterns

1. **false-cup-too-deep.json** - Cup too deep to be valid
2. **false-handle-too-deep.json** - Handle too deep
3. **false-no-handle.json** - Cup without proper handle

## Pattern Validation

Each test data file includes expected results for validation:

- Pattern detection (true/false)
- Confidence level (HIGH/MEDIUM/LOW)
- Key pattern points (cup start, bottom, end, handle start/end)
- Pattern measurements (cup depth, handle depth)

This allows for automated testing and validation of pattern detection algorithms.
