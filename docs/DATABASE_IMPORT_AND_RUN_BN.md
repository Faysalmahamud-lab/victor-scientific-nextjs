# Victor Scientific — Database Import ও Local Run (Windows)

## 1. আপনার কাছে থাকা দুইটি ফাইল
- `Victor_Scientific_NextJS_Migration_Package.zip`: Next.js project source code।
- `Victor_Scientific_Legacy_Database_Backup.sql`: আপনার দেওয়া Laravel MariaDB database export; data ও schema অক্ষত রাখা হয়েছে।

## 2. SQL dump পরীক্ষা সম্পর্কে
আপনার SQL export phpMyAdmin 5.2.3 থেকে MariaDB 11.4.13-এর জন্য তৈরি (dump header অনুযায়ী)। এতে 85টি `CREATE TABLE`, 90টি `INSERT INTO` statement, 185টি `ALTER TABLE` statement এবং 33টি foreign-key declaration পাওয়া গেছে। Dump-এ `DROP TABLE` statement নেই এবং শেষে `COMMIT` আছে।

এটি একটি structural/text audit; MariaDB server-এ import করে execution test করা হয়নি। তাই একে server-verified বলা যাবে না। Data loss এড়াতে SQL-এর table/column/data নিজের ইচ্ছায় rewrite করা হয়নি।

## 3. MariaDB-তে নতুন staging database তৈরি
HeidiSQL অথবা phpMyAdmin খুলুন। নতুন database তৈরি করুন:
- Database: `victor_scientific_stage`
- Collation: `utf8mb4_unicode_ci`

তারপর এই database select করে Import-এ যান এবং `Victor_Scientific_Legacy_Database_Backup.sql` নির্বাচন করে import করুন। 2 MB dump-এর জন্য phpMyAdmin সাধারণত যথেষ্ট। Import error এলে error message এবং line number সংরক্ষণ করুন; production database-এ retry করবেন না।

আরও নিরাপদ হলে staging database-এর জন্য আলাদা user তৈরি করুন। উদাহরণ SQL (MariaDB admin account দিয়ে চালাতে হবে):

```sql
CREATE USER 'vsc_stage'@'127.0.0.1' IDENTIFIED BY 'SET_A_STRONG_UNIQUE_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
ON victor_scientific_stage.* TO 'vsc_stage'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Development-এর সময়ও production database credentials ব্যবহার করবেন না।

## 4. Project extract ও Node.js install
1. Project ZIP extract করুন।
2. VS Code → File → Open Folder → `victor-scientific-nextjs-migration` select করুন।
3. Node.js 22 LTS বা newer install আছে কি না PowerShell-এ দেখুন:

```powershell
node -v
npm -v
```

4. VS Code → Terminal → New Terminal খুলে চালান:

```powershell
Copy-Item .env.example .env
npm install
```

## 5. `.env` configure
`.env` file-এ local staging database details দিন:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Victor Scientific Co.
DATABASE_URL="mysql://vsc_stage:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:3306/victor_scientific_stage"
DB_CONNECTION_LIMIT=5
ADMIN_ALLOWED_EMAILS=your-admin-email@example.com
AUTH_SECRET=put-a-random-secret-here-with-at-least-32-characters
```

এখানে নিজের database password ও admin email বসাবেন। Password-এর special character URL-encode করুন। AUTH_SECRET-এ অন্তত 32 character-এর random secret দিন। `.env` কখনো public করবেন না।

## 6. Existing Laravel database থেকে Prisma schema sync
Project-এর initial Prisma schema একটি provisional mapping; আপনার SQL dump-এর সব table/column-এর final verified mapping নয়। তাই staging database import হওয়ার পর নিচের read/introspection commands চালান:

```powershell
npm run db:introspect
npm run db:validate
npm run db:generate
```

এতে Prisma existing database schema পড়ে model তৈরি/আপডেট করবে। `db:introspect` database data migrate বা delete করে না। Generated schema diff review করুন।

**কোনো অবস্থায় production database-এ `prisma migrate reset`, `prisma db push` বা destructive migration চালাবেন না।** এই ধাপে SQL dump import করার পর project কেবল database connection ও schema introspection-এর জন্য প্রস্তুত; সব Laravel feature স্বয়ংক্রিয়ভাবে Next.js-এ চলে আসবে না।

## 7. Website run

```powershell
npm run dev
```

Open: http://localhost:3000

Server stop: `Ctrl + C`।

## 8. Production build পরীক্ষা

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

কোনো command error দিলে পুরো error text/screenshot পাঠান। অনুমান করে production deploy করবেন না।

## 9. এখনো যেসব কাজ বাকি
এই foundation-এ homepage/company/contact-এর প্রাথমিক Next.js implementation, basic admin shell, SEO scaffolding এবং database/auth configuration আছে। কিন্তু full Laravel e-commerce replacement সম্পন্ন নয়। Product listing/detail, category/brand browsing, search, cart, checkout, payment, customer login, orders, coupons, campaigns, full admin CRUD, legacy media migration, redirects এবং complete SEO parity আলাদাভাবে implement ও test করতে হবে।

পুরোনো Laravel website ও database অক্ষত রাখুন। নতুন project staging-এ test না হওয়া পর্যন্ত live domain switch করবেন না।
