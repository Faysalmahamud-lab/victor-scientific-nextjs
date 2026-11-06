# Victor Scientific — Finalization Audit

Audit date: 2026-11-06
Source archive: `victor-nextjs-staging.zip`

## Source archive inspection

- Archive size: approximately 15.1 MB.
- Archive entries: 894.
- Prisma schema: 85 models and 24 enums.
- Generated Prisma client files: 93.
- Product image assets: 542 files under `public/uploads/product/`.
- `.env`: not present.
- The uploaded archive also contained a raw SQL dump. The release package intentionally excludes that dump because database exports may contain customer, order and configuration data.

## Implemented in this source update

### Storefront design and navigation
- Desktop header with Categories, centered Victor Scientific logo, product search, Store Location and Account.
- Sticky header compacts while scrolling.
- Mobile search is an icon immediately before Store Location and opens a compact search popover; no persistent full-width search row is added below the header.
- Mobile bottom navigation: Home, Categories, Track Order, Cart and Login.
- Mobile bottom navigation hides while scrolling down and reappears while scrolling up.
- Floating contact control expands Call, Messenger and WhatsApp actions.
- Store Location panel supports configurable address, phone and Google Maps URL through public environment variables.

### Public catalogue
- Product search route.
- Category browsing route.
- Brand directory and brand product route.
- Product detail image gallery with thumbnails on the LEFT of the main image on desktop.
- Thumbnail selection changes the main image.
- Clicking the main image opens an enlarged image viewer with previous/next controls and Escape-key close.
- Legacy media paths are URL-encoded to handle filenames containing spaces, `#`, `%` and other reserved characters.

### Cart and order support
- Browser-persisted cart.
- Product detail Add to Cart and Buy Now actions.
- Guest checkout form with no account-registration requirement.
- Delivery charge is a single flat fee per order: ৳80 inside Dhaka and ৳150 outside Dhaka.
- Oversized/heavy products do not receive an automatic surcharge; the customer must be contacted and any additional cost confirmed before processing.
- Order tracking form and API use invoice number plus the order phone number.

### SEO and content
- Dynamic sitemap includes active products, top-level categories, brands and published CMS pages.
- Robots rules allow public product/category/brand pages and disallow private utility/admin routes.
- Published CMS pages are rendered from the existing `create_pages` table as plain text.
- Product metadata includes product-specific title, description, canonical path and Open Graph image.

### cPanel setup
- `setup-cpanel.sh` no longer runs Prisma introspection automatically.
- A separate guarded `scripts/introspect-staging.sh` requires explicit `ALLOW_STAGING_INTROSPECTION=yes`.
- Conservative worker-pool environment defaults are set for shared hosting.
- Setup instructions now distinguish staging verification from production cutover.

## Safety gates and incomplete work

This package must **not** be treated as a completed production replacement yet.

1. `CHECKOUT_ENABLED` defaults to `false`. The checkout API is intentionally gated until the actual legacy customer status convention, pending order status, order column behavior, stock reservation/decrement policy and cancellation/restock workflow are verified against staging.
2. The initial checkout API only represents Cash on Delivery. Payment gateway integration and payment reconciliation are not implemented.
3. Customer account login/registration/password reset is not implemented. The account route explains that legacy account authentication remains under migration. Guest checkout does not require registration.
4. Admin Product, Category and Brand CRUD, media upload, bulk import and stock adjustment are not implemented.
5. Admin order management, order status changes, cancellation/restock, invoices, payment review and courier integrations are not implemented.
6. Reseller/vendor workflows and their wallet/withdrawal operations are not implemented.
7. Analytics, SEO settings and general settings pages remain configuration placeholders.
8. Campaign/offer route migration and full legacy URL/redirect parity remain incomplete.
9. Legacy content and metadata must be compared with the original Laravel website. The uploaded SQL dump is not used as a substitute for a verified staging database connection.
10. The Prisma schema contains 85 models, but a fresh staging `prisma db pull` did not complete on the cPanel host because the account reached its fixed NPROC limit and Prisma returned `EAGAIN`. Do not assume the checked-in schema is fully verified against the current staging database.

## Validation performed for this source update

- Parsed 72 TypeScript/TSX files with the TypeScript compiler parser: no syntax diagnostics.
- `node --check app.js`: passed.
- `node --check app.cjs`: passed.
- `bash -n setup-cpanel.sh`: passed.
- `bash -n scripts/introspect-staging.sh`: passed.
- `package.json` and `tsconfig.json` JSON parsing: passed.

Full TypeScript type-check, ESLint, Vitest, Prisma validation and Next.js production build were **not** run in this environment because dependency installation timed out. They must be run on the staging cPanel Node.js environment after extracting this package. A successful source syntax check is not a substitute for those tests.

## Deployment rule

Deploy this update to the separate staging application only. Do not replace the live Laravel site, change DNS, enable checkout or connect the production database until all incomplete workflows above have passed staging acceptance testing and a rollback plan is verified.
