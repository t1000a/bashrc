'use strict';

const express = require('express');
const { searchByKeywords, searchByImage } = require('./ebay');
const { summarizePrices } = require('./priceStats');
const { buildMarketplaceLinks } = require('./marketplaceLinks');

const MIN_IMAGE_RESULTS = 3;

function buildQuery({ name, description }) {
  return [name, description].filter(Boolean).join(' ').trim();
}

function toListingSummary(item) {
  return {
    title: item.title,
    price: item.price ? `${item.price.value} ${item.price.currency}` : null,
    condition: item.condition ?? null,
    url: item.itemWebUrl ?? null,
    image: item.image?.imageUrl ?? null,
  };
}

function createApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.post('/api/estimate', async (req, res) => {
    const { name, description, image_base64: imageBase64 } = req.body ?? {};
    const query = buildQuery({ name, description });

    if (!query && !imageBase64) {
      return res.status(400).json({
        error: 'Provide at least a name/description or an image_base64.',
      });
    }

    try {
      let listings = [];
      let searchMode = 'keyword';

      if (imageBase64) {
        searchMode = 'image';
        listings = await searchByImage(imageBase64, query);
        if (listings.length < MIN_IMAGE_RESULTS && query) {
          searchMode = 'image+keyword-fallback';
          listings = await searchByKeywords(query);
        }
      } else {
        listings = await searchByKeywords(query);
      }

      const estimate = summarizePrices(listings);
      const links = buildMarketplaceLinks(query || name || 'item');

      res.json({
        query: query || null,
        search_mode: searchMode,
        currency: 'USD',
        estimate,
        listings: listings.slice(0, 10).map(toListingSummary),
        marketplace_search_links: links,
      });
    } catch (err) {
      console.error(err);
      res.status(502).json({ error: 'Failed to fetch comparable listings.', detail: err.message });
    }
  });

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => console.log(`marketplace-value-lookup listening on :${port}`));
}

module.exports = { createApp };
