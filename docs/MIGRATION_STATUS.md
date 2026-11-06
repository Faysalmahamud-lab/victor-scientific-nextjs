# Migration status — Victor Scientific Co.

## What this package contains

- New Next.js App Router + React + TypeScript application foundation.
- Tailwind CSS 4 design system and responsive premium UI.
- Motion-based entrance effects with reduced-motion support.
- Lucide icons, responsive navigation, company page and general contact form.
- Prisma ORM 7 + MariaDB driver adapter configuration.
- Initial Prisma mappings for tables confirmed by the Laravel migrations.
- Consent-gated Google Tag Manager and Meta Pixel hooks.
- Metadata, Open Graph, robots.txt and a conservative dynamic sitemap.
- Protected administrator sign-in using the existing Laravel bcrypt password hash, gated by a server-side email allowlist.
- Read-only admin views for CMS page titles/slugs and website configuration status.

## Deliberately excluded from this package

- Public product, chemical-reagent, product-category or brand catalogue pages.
- Online cart, checkout, payment gateway, order placement or purchase workflows.
- Product search, campaign promotions, discount/offer pages and digital downloads.
- Public exposure of unreviewed legacy CMS page bodies or uploaded product media.
- Automatic writes to the production database.

The product and category models remain in the Prisma schema as legacy database references only. No public route queries or displays product/category data. The sitemap contains only the neutral company, contact and homepage routes. This prevents unreviewed catalogue records from becoming accessible through the new application.

## Important source-package limitation

The supplied `Master File (2).zip` contains Laravel source, migration files, static assets and release reports, but it does not contain a MariaDB SQL dump or a live database connection. Therefore actual product rows, category rows, customer data, CMS content, current metadata values and database-backed redirects have not been copied or verified. The source archive contains 75 migration files; the existing database schema must be introspected from a backup before the Prisma schema is considered final.

## Branding assets

Only the company logo, favicon and local Bangla font files were copied into the public folder. Legacy product uploads and unclassified catalogue images were not made public. They must be reviewed separately before any public media migration.

## Not a production cutover

This is a technology migration foundation and staging candidate, not a certified one-click replacement for the current Laravel production site. Do not point the production domain at this application until the existing database has been introspected, required non-restricted content has been reviewed, legacy URL behavior has been agreed, staging tests have passed and a rollback plan is approved.


## Database dump received (2026-11-05)
A MariaDB SQL export was supplied after the original foundation ZIP. A text-level audit found 85 CREATE TABLE statements, 90 INSERT statements, 185 ALTER TABLE statements, 33 foreign-key declarations, and no DROP TABLE statements. The dump identifies MariaDB 11.4.13 in its header. The dump has not been executed against a MariaDB server in this environment. Import it into a new staging database, then run `npm run db:introspect`, `npm run db:validate`, and `npm run db:generate`. The initial Prisma schema remains provisional until that process and application-level review are complete.
