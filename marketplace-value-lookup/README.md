# Marketplace Value Lookup

An iOS Shortcut that takes an item's name, description, and/or a photo and
returns an estimated resale value, backed by real eBay listing data (plus
one-tap search links into Facebook Marketplace, eBay, OfferUp, and
Craigslist for manual comparison).

- `server/` — the backend API the Shortcut calls. See `server/README.md`
  for setup and API details, including why eBay (not Facebook Marketplace,
  which has no public pricing API) is the actual data source.
- `shortcuts/` — step-by-step instructions for building the Shortcut itself
  in the iOS Shortcuts app and pointing it at your deployed server.

Note: this lives in the `bashrc` repo only because that's where this
session was run — it's an unrelated, standalone project and has no
dependency on the rest of the repo.
