# Building the iOS Shortcut

iOS Shortcuts aren't written as source files you can check in and import —
they're built (or edited) in the Shortcuts app itself. This is the
step-by-step to wire one up to the backend in `../server`.

Prerequisite: the server must be reachable over **HTTPS** from your phone
(Shortcuts' "Get Contents of URL" won't call `http://localhost`). Deploy it
somewhere first (Render, Fly.io, Railway, a VPS with a reverse proxy, or
`ngrok http 3000` while testing) and use that public URL below.

## Steps

1. **Shortcuts app -> `+` -> New Shortcut.** Name it "Item Value Lookup".

2. **Accept input from the Share Sheet (optional but recommended):**
   - Tap the shortcut's Settings (`i` icon) -> enable **"Show in Share Sheet"**.
   - Set **"Share Sheet Types"** to `Images`.
   - This lets you long-press a photo in the Photos app and run the
     shortcut directly on it, with the photo arriving as `Shortcut Input`.

3. **Get the photo:**
   - Add action **"If"** -> condition `Shortcut Input has any value` ->
     Otherwise add **"Select Photos"** (single photo, no multi-select) so
     the shortcut still works when launched manually from the Shortcuts
     tab. Either branch should end with a photo in the variable flow —
     name it (tap the result, "Rename Variable" -> `Photo`).

4. **Ask for the item details:**
   - Add **"Ask for Input"** -> type `Text`, prompt `Item name`. Rename the
     result variable `ItemName`.
   - Add another **"Ask for Input"** -> `Text`, prompt `Description
     (condition, brand, size, etc.)`, and check **"Allow Skip"** since it's
     optional. Rename the result `ItemDescription`.

5. **Encode the photo:**
   - Add **"Base64 Encode"**, input = `Photo`. This produces raw base64 —
     do not wrap it in a `data:image/...;base64,` prefix, the server
     expects plain base64.

6. **Build the JSON body:**
   - Add **"Dictionary"** and add three text keys:
     - `name` -> `ItemName`
     - `description` -> `ItemDescription`
     - `image_base64` -> the Base64 Encode result
   - (If you skip the photo entirely, just omit `image_base64` — leave the
     Dictionary value empty and the server falls back to a keyword search.)

7. **Call the API:**
   - Add **"Get Contents of URL"**.
   - URL: `https://YOUR-DEPLOYED-HOST/api/estimate`
   - Method: `POST`
   - Headers: `Content-Type: application/json`
   - Request Body: `JSON`, set to the Dictionary from step 6.

8. **Show the result:**
   - Add **"Get Dictionary Value"** for key `estimate` (from the URL
     response), then again for `median`, `low`, `high`, `sample_size`.
   - Add **"Text"** to format a summary, e.g.:
     ```
     Estimated value: $[median] (range $[low]-$[high]) based on
     [sample_size] comparable eBay listings.
     ```
   - Add **"Quick Look"** or **"Show Result"** with that text.
   - Optional: also surface `marketplace_search_links.facebook_marketplace`
     from the response as an **"Open URLs"** action (or a second "Show
     Result") so you can jump straight to live Facebook Marketplace
     listings for the same search terms.

9. **Save.** Test it once from the Shortcuts tab (with a photo you pick
   manually), then test again via the Share Sheet from Photos.

## Notes

- The server does the real pricing work by querying eBay's Browse API for
  visually/textually similar active listings and returning the median,
  low/high, and sample size. There is no public Facebook Marketplace
  pricing API, so that link is a pre-filled search you check by eye, not an
  automated number — see `../server/README.md` for why.
- If image search returns too few results, the server automatically falls
  back to a keyword search on `name` + `description`, so filling those in
  even when you have a photo makes the estimate more reliable.
