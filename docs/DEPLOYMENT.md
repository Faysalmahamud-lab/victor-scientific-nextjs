# Local setup and staging deployment

## Requirements

- Node.js 22 LTS or newer.
- npm 10 or newer.
- A staging copy of the existing MariaDB database.
- A long-running Node.js hosting environment for Next.js server rendering.

## 1. Install

```bash
cp .env.example .env
npm install
```

Fill in the staging `DATABASE_URL`, `AUTH_SECRET` (at least 32 characters), and `ADMIN_ALLOWED_EMAILS`. Keep `.env` out of source control.

## 2. Introspect the existing database

Back up the existing schema and use a read-only staging account first:

```bash
cp prisma/schema.prisma prisma/schema.initial.prisma
npm run db:introspect
npm run db:validate
npm run db:generate
```

Review the generated schema against the original Laravel migrations and application models. Prisma introspection can rename or map fields; keep physical table and column names unchanged. Do not run `prisma migrate reset`, `db push` or destructive migrations against the existing database.

## 3. Build and verify

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Check `/api/health`, `/`, `/company`, `/site/contact-us` and `/sitemap.xml`. Verify administrator login using an existing administrator account included in `ADMIN_ALLOWED_EMAILS`.

## 4. Production cutover gate

Before cutover, compare database schema, CMS metadata, logo and approved company media; test contact form, admin authentication, canonical tags, sitemap and robots rules; and test desktop/tablet/mobile rendering, accessibility and Core Web Vitals.

The product/catalogue and commerce route families are intentionally excluded from this package. Do not enable them by copying legacy data without a separate content-safety and scope review.

Keep the Laravel site and database backup intact until the new application has passed the agreed acceptance tests. Use a staged DNS/reverse-proxy cutover with a tested rollback path.
