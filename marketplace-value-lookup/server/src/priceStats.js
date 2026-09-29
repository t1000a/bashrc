'use strict';

/**
 * Turns a list of eBay item summaries into a price estimate.
 * Trims the top/bottom 10% (once there are enough samples) so a single
 * wildly-priced listing doesn't skew the median/average.
 */
function summarizePrices(listings) {
  const prices = listings
    .map((item) => Number(item?.price?.value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return null;
  }

  const trimCount = prices.length >= 10 ? Math.floor(prices.length * 0.1) : 0;
  const trimmed = trimCount > 0 ? prices.slice(trimCount, prices.length - trimCount) : prices;

  const sum = trimmed.reduce((total, value) => total + value, 0);
  const mid = Math.floor(trimmed.length / 2);
  const median =
    trimmed.length % 2 === 0 ? (trimmed[mid - 1] + trimmed[mid]) / 2 : trimmed[mid];

  return {
    sample_size: prices.length,
    low: round2(trimmed[0]),
    high: round2(trimmed[trimmed.length - 1]),
    median: round2(median),
    average: round2(sum / trimmed.length),
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

module.exports = { summarizePrices };
