'use strict';

const TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const SEARCH_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const SEARCH_BY_IMAGE_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search_by_image';
const MARKETPLACE_ID = 'EBAY_US';
const RESULT_LIMIT = 25;

let cachedToken = null; // { value, expiresAt }

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  });

  if (!response.ok) {
    throw new Error(`eBay OAuth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

async function authedRequest(url, init) {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': MARKETPLACE_ID,
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`eBay request failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

/** Keyword search across active eBay listings. */
async function searchByKeywords(query) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(RESULT_LIMIT));
  url.searchParams.set('sort', 'price');

  const data = await authedRequest(url, { method: 'GET' });
  return data.itemSummaries ?? [];
}

/**
 * Visual search using a photo. `imageBase64` must be raw base64 (no
 * "data:image/...;base64," prefix). Falling back to keyword search is the
 * caller's responsibility if this returns few/no results.
 */
async function searchByImage(imageBase64, query) {
  const url = new URL(SEARCH_BY_IMAGE_URL);
  url.searchParams.set('limit', String(RESULT_LIMIT));

  const data = await authedRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, q: query || undefined }),
  });
  return data.itemSummaries ?? [];
}

module.exports = { searchByKeywords, searchByImage };
