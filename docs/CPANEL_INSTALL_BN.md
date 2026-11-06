# cPanel Installation - বাংলা নির্দেশনা

## গুরুত্বপূর্ণ
এই Project হলো Victor Scientific-এর Next.js staging application। এটি এখনও Laravel Website-এর সম্পূর্ণ production replacement নয়। Staging acceptance test শেষ না হওয়া পর্যন্ত পুরোনো Laravel site ও production database চালু রাখবেন।

## 1. cPanel Application
- Node.js: 22.23.4
- Mode: Production
- Application root: `/home/CPANEL_USERNAME/victor-nextjs-staging`
- Startup file: `app.js`

Application root `public_html`-এর ভিতরে রাখবেন না। cPanel-এর দেওয়া exact virtualenv activation command ব্যবহার করুন।

## 2. ZIP Upload
ZIP-এর contents সরাসরি staging application root-এ Extract করুন। Root-এর ভিতরে `package.json`, `app.js`, `setup-cpanel.sh`, `prisma/` এবং `src/` থাকতে হবে।

## 3. Staging Database
শুধু আলাদা staging database ব্যবহার করুন। Production database credentials এখানে ব্যবহার করবেন না। `.env` public folder-এ রাখবেন না।

## 4. Environment
`.env.example` কপি করে `.env` তৈরি করুন এবং verified staging database credentials, `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET` ও verified administrator email বসান।

`CHECKOUT_ENABLED=false` রাখুন। Customer status, pending order status, stock policy এবং admin order processing যাচাই না হওয়া পর্যন্ত checkout চালু করবেন না।

## 5. Setup
cPanel Terminal-এ Node.js virtualenv activate করে চালান:

```bash
cd /home/CPANEL_USERNAME/victor-nextjs-staging
bash setup-cpanel.sh
```

Script dependencies install, Prisma validate/generate, TypeScript, ESLint, unit tests ও production build চালাবে।

**এই script স্বয়ংক্রিয়ভাবে `prisma db pull` চালায় না।** কারণ এই hosting account-এর fixed NPROC limit-এ আগের Prisma schema-engine run `EAGAIN` error দিয়েছে। Introspection আলাদা, explicit step:

```bash
ALLOW_STAGING_INTROSPECTION=yes bash scripts/introspect-staging.sh
```

এটি চালানোর আগে `DATABASE_URL` staging database-এ point করছে এবং database user read-only তা নিশ্চিত করুন। `EAGAIN` এলে বারবার retry করবেন না।

## 6. Restart ও Health Check
Setup সফল হলে cPanel > Setup Node.js App থেকে **শুধু staging application** Restart করুন। তারপর `/api/health` পরীক্ষা করুন।

## 7. Production Cutover Gate
নিচের সবগুলো যাচাই না হওয়া পর্যন্ত production domain switch করবেন না:
- Product/category/brand CRUD
- Customer account migration
- Cart, guest checkout ও order creation
- Admin order processing, stock policy ও cancellation/restock
- Payment ও courier integration
- Reseller workflows
- Legacy URL, image, metadata, redirects ও sitemap parity
- Desktop/mobile, security, performance ও rollback tests

কোনো অবস্থায় production database-এ `prisma migrate reset`, `prisma db push`, DROP বা TRUNCATE চালাবেন না।
