'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizePrices } = require('./priceStats');

function listing(value) {
  return { price: { value: String(value), currency: 'USD' } };
}

test('returns null for no listings', () => {
  assert.equal(summarizePrices([]), null);
});

test('ignores listings without a usable price', () => {
  const result = summarizePrices([listing(50), { price: {} }, { price: { value: '0' } }]);
  assert.equal(result.sample_size, 1);
  assert.equal(result.median, 50);
});

test('computes median/average without trimming small samples', () => {
  const result = summarizePrices([listing(10), listing(20), listing(30)]);
  assert.equal(result.sample_size, 3);
  assert.equal(result.median, 20);
  assert.equal(result.average, 20);
  assert.equal(result.low, 10);
  assert.equal(result.high, 30);
});

test('trims outliers once there are enough samples', () => {
  const prices = [1, 20, 21, 22, 23, 24, 25, 26, 27, 500];
  const result = summarizePrices(prices.map(listing));
  assert.equal(result.sample_size, 10);
  assert.equal(result.low, 20);
  assert.equal(result.high, 27);
  assert.equal(result.median, 23.5);
});
