'use strict';

/** Pre-filled search URLs so the user can eyeball real listings by hand. */
function buildMarketplaceLinks(query) {
  const q = encodeURIComponent(query);
  return {
    facebook_marketplace: `https://www.facebook.com/marketplace/search/?query=${q}`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${q}`,
    offerup: `https://offerup.com/search/?q=${q}`,
    craigslist: `https://www.craigslist.org/search/sss?query=${q}`,
  };
}

module.exports = { buildMarketplaceLinks };
