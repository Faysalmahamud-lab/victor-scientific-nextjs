# Victor Scientific Co. — Next.js staging application

This repository is the Next.js migration application for Victor Scientific Co. It contains a responsive storefront foundation, database-backed catalogue browsing, product detail pages, a guest-cart interface, protected admin authentication, operator/role management and deployment tooling.

**This package is not yet a verified production replacement for the Laravel website.** Some commerce and administration workflows remain gated or incomplete. Keep the Laravel site and production database online until the acceptance checklist is passed.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Node.js 22, MariaDB, Prisma 7
- Tailwind CSS 4, Lucide icons, Motion and Swiper
- Zod validation, Vitest and Playwright
- cPanel Node.js application startup: `app.js`

## Storefront currently included

- Homepage and database-driven shop catalogue
- Search, category and brand browsing routes
- Product details with selectable left-side thumbnails and image zoom
- Responsive desktop header, compact-on-scroll behavior and mobile bottom navigation
- Search popover, store-location panel and floating contact shortcuts
- Browser-persisted cart and guest-checkout interface
- Order tracking lookup route
- Contact form and consent-gated analytics scaffolding

## Admin currently included

- Admin login/session and server-side permission checks
- Operator management
- Role and permission management with audit logging
- Basic dashboard and CMS page index

Product/category/brand CRUD, full order processing, customer account authentication, payment gateway integration, courier workflows, reseller management, and complete SEO/settings administration still require implementation and staging verification.

## Install on cPanel staging

1. Use the existing Node.js 22.23.4 cPanel application and its configured application root.
2. Keep `.env` outside `public_html`; create it from `.env.example`.
3. Point `DATABASE_URL` only to the separate staging database.
4. Keep `CHECKOUT_ENABLED=false` until the staging order workflow, customer status, pending order status, stock policy and admin order processing have been verified.
5. Activate the exact cPanel Node.js virtual environment command.
6. Run:

```bash
cd /home/CPANEL_USERNAME/victor-nextjs-staging
bash setup-cpanel.sh
```

7. Restart the **staging** Node.js application from cPanel and test `/api/health`.

The setup script intentionally does **not** run `prisma db pull` automatically. This shared-host account has previously reached its fixed NPROC limit and Prisma schema-engine spawning failed with `EAGAIN`. Schema introspection is separate:

```bash
ALLOW_STAGING_INTROSPECTION=yes bash scripts/introspect-staging.sh
```

Only use that helper after confirming the configured database is staging and the database account is read-only. If the host returns `EAGAIN`, stop rather than repeatedly retrying.

## Environment

See `.env.example`. Required values include:

- `DATABASE_URL`
- `AUTH_SECRET` (at least 32 characters)
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_ALLOWED_EMAILS`

Optional public business details:

- `NEXT_PUBLIC_STORE_ADDRESS`
- `NEXT_PUBLIC_STORE_PHONE`
- `NEXT_PUBLIC_STORE_MAP_URL`
- `NEXT_PUBLIC_WHATSAPP_URL`
- `NEXT_PUBLIC_MESSENGER_URL`

Never share `.env`, database passwords, API secrets or SQL dumps.

## Delivery rules

- Standard delivery inside Dhaka: ৳80 per order.
- Standard delivery outside Dhaka: ৳150 per order.
- The standard fee is charged once per order, not once per product.
- Do not automatically add a heavy/oversized-product surcharge. Contact the customer, discuss the additional delivery cost and confirm it before processing.

## Guest checkout safety

The checkout API is feature-flagged and defaults to disabled. Do not set `CHECKOUT_ENABLED=true` until all of the following have been confirmed on staging:

- The legacy customer status convention is verified.
- A valid pending order status exists.
- The order and shipping inserts match the live legacy schema.
- Stock reservation/decrement and cancellation/restock rules are agreed.
- Admin order review and processing are available.
- Payment method behavior is confirmed.

The current initial checkout flow is Cash on Delivery only; payment gateway integration is not included in this release.

## Validation commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

A successful build does not certify all business workflows or production cutover. See `docs/FINALIZATION_AUDIT.md`.
