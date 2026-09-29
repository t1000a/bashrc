# marketplace-value-lookup server

Backend for the "Item Value Lookup" iOS Shortcut (see `../shortcuts/README.md`).
Given an item's name, description, and/or a photo, it returns a resale-value
estimate built from **real, live eBay listings** via eBay's Browse API.

## Why eBay, and not Facebook Marketplace

Facebook Marketplace has no public search or pricing API, so there is no
way to programmatically pull real FB listing prices — anything claiming to
do that is either scraping (against Facebook's terms, and prone to
breaking) or making numbers up. eBay's Browse API is a real, documented,
free-tier API that returns live listing data, including a **search-by-image**
endpoint, so it's used here for the actual price estimate. Facebook
Marketplace (and eBay, OfferUp, Craigslist) are still included as
pre-filled search links in the response so you can eyeball comparable
listings on those sites yourself.

## Setup

1. Create a free developer account at https://developer.ebay.com and an
   application to get a **Production** keyset (Client ID + Client Secret).
   Sandbox keys only return fake test data — you need Production for real
   prices.
2. `cp .env.example .env` and fill in `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET`.
3. `npm install`
4. `npm start` (listens on `PORT`, default 3000)
5. `npm test` runs the price-aggregation unit tests.

Deploy it somewhere with a public HTTPS URL (Render, Fly.io, Railway, a VPS
behind a reverse proxy) — the iOS Shortcut needs to reach it over the
internet, not `localhost`.

## API

### `POST /api/estimate`

Request body (all fields optional, but provide at least one of
name/description or image_base64):

```json
{
  "name": "Herman Miller Aeron chair",
  "description": "Size B, black, good condition",
  "image_base64": "<raw base64 JPEG/PNG, no data: prefix>"
}
```

Response:

```json
{
  "query": "Herman Miller Aeron chair Size B, black, good condition",
  "search_mode": "image",
  "currency": "USD",
  "estimate": {
    "sample_size": 18,
    "low": 180.0,
    "high": 420.0,
    "median": 265.0,
    "average": 271.4
  },
  "listings": [
    { "title": "...", "price": "250.0 USD", "condition": "USED_GOOD", "url": "...", "image": "..." }
  ],
  "marketplace_search_links": {
    "facebook_marketplace": "https://www.facebook.com/marketplace/search/?query=...",
    "ebay": "https://www.ebay.com/sch/i.html?_nkw=...",
    "offerup": "https://offerup.com/search/?q=...",
    "craigslist": "https://www.craigslist.org/search/sss?query=..."
  }
}
```

`estimate` is `null` if no comparable listings had a usable price — try a
more specific name/description.

If an image is supplied but returns too few visual matches, the server
automatically retries with a keyword search on `name` + `description`
(`search_mode` becomes `"image+keyword-fallback"`).

### `GET /health`

Liveness check, returns `{ "ok": true }`.
