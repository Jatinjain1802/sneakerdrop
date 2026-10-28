# SneakerDrop

A premium sneaker showcase for a fictional brand. Visitors browse a live catalogue and join a per-product waitlist. A password-protected admin dashboard manages the products and the waitlist. Everything is stored in a real MySQL database.

**Live site:** _DEPLOY_URL_PLACEHOLDER_
**Repository:** https://github.com/Jatinjain1802/sneakerdrop

> The brand and all product names are fictional. The sneaker images were generated with an AI image model for this project, so there are no third-party image licences to worry about.

## Screenshots

| Home (desktop) | Home (mobile) |
| --- | --- |
| ![Home desktop](docs/screenshots/home-desktop.jpg) | ![Home mobile](docs/screenshots/home-mobile.jpg) |

| Catalogue | Catalogue (mobile) |
| --- | --- |
| ![Catalogue](docs/screenshots/catalogue-desktop.jpg) | ![Catalogue mobile](docs/screenshots/catalogue-mobile.jpg) |

| Waitlist success | Duplicate blocked |
| --- | --- |
| ![Waitlist success](docs/screenshots/waitlist-success.jpg) | ![Duplicate](docs/screenshots/waitlist-duplicate.jpg) |

| Admin: products | Admin: waitlist |
| --- | --- |
| ![Admin products](docs/screenshots/admin-products.jpg) | ![Admin waitlist](docs/screenshots/admin-waitlist.jpg) |

| Admin: sign in | Admin: edit form |
| --- | --- |
| ![Admin login](docs/screenshots/admin-login.jpg) | ![Admin edit](docs/screenshots/admin-edit-form.jpg) |

## Features

**Public site**
- Landing page with a large animated headline, a 3D-tilt hero image, a scrolling marquee, scroll-reveal sections and a sticky blurred header.
- Dynamic catalogue loaded from MySQL on every request: name, image, price, description, tagline and availability (available, sold out, coming soon).
- Filter chips by availability, hover tilt and glow on cards, sold-out pairs shown in greyscale.
- Waitlist modal per product: client-side email validation, loading state, success animation and a clear message when you are already on the list.
- Responsive from 360px phones to wide desktops, a mobile menu, keyboard focus styles, and `prefers-reduced-motion` support.

**Admin dashboard (`/admin`)**
- Email + password sign-in. Everything under `/admin` and `/api/admin` needs a valid session.
- Add, edit and delete sneakers. Change availability inline from the table.
- Every change is written to MySQL and shows up on the public site immediately.
- Waitlist view with all submissions, a filter by product and a remove action. Per-product signup counts are shown in the products table.

**Waitlist rules**
- Email format is validated in the browser and again on the server.
- Duplicate prevention is enforced by the database: a `UNIQUE (product_id, email)` key. Emails are lower-cased, so `A@x.com` and `a@x.com` are the same person. The API returns `409` for a duplicate.
- The same email can join the waitlist for different products.

## Technology stack

- **Next.js 14** (App Router, server components, route handlers) and React 18
- **MySQL 8** through `mysql2` (parameterised queries only)
- **Auth:** `bcryptjs` password hash + signed JWT session cookie (`jose`), verified in Next.js middleware and again in every admin route
- Plain CSS (no UI framework), `next/font` for Bricolage Grotesque and Inter
- Hosting: Vercel (app) and a managed MySQL service (database)

## Setup

Requirements: Node 18+ and a MySQL 8 database (local, Aiven, TiDB, PlanetScale or similar).

```bash
git clone https://github.com/Jatinjain1802/sneakerdrop.git
cd sneakerdrop
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | `mysql://user:password@host:3306/dbname` |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password. Generate it with `npm run hash -- 'a-long-password'` |
| `SESSION_SECRET` | Random string of 32+ characters. Generate with `openssl rand -hex 32` |

> In a `.env` file escape the dollar signs of the bcrypt hash (`\$2b\$12\$...`) or Next.js will try to expand them. On Vercel, paste the hash as is.

Create the tables and load five demo sneakers, then start the app:

```bash
npm run db:setup     # optional: the app also creates missing tables on first request
npm run dev          # http://localhost:3000
```

Sign in at `/admin` with the email and password you chose.

### Tests

`scripts/e2e.mjs` is an end-to-end API check that runs against a live instance and cleans up after itself. It covers anonymous access being rejected, login, product create/edit/availability/delete, public reflection of every change, email validation, duplicate prevention and the admin waitlist.

```bash
npm run build && npm start &
BASE=http://localhost:3000 ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='your-password' node scripts/e2e.mjs
```

## Database schema

Defined in [`db/schema.sql`](db/schema.sql).

```sql
products (
  id INT UNSIGNED PK AUTO_INCREMENT,
  slug VARCHAR(80) UNIQUE, name VARCHAR(80), tagline VARCHAR(100),
  description VARCHAR(600), price_cents INT UNSIGNED, image_url VARCHAR(500),
  accent CHAR(7), status ENUM('available','sold_out','coming_soon'),
  sort_order INT, created_at TIMESTAMP, updated_at TIMESTAMP
)

waitlist (
  id INT UNSIGNED PK AUTO_INCREMENT,
  product_id INT UNSIGNED -> products(id) ON DELETE CASCADE,
  email VARCHAR(254), created_at TIMESTAMP,
  UNIQUE (product_id, email)
)
```

## Architecture and technical decisions

```
app/
  page.js                  server component: reads products from MySQL, renders the landing page
  components/              Hero, Catalogue (filters, cards), WaitlistModal, Header, Reveal, Marquee
  admin/                   login page, server-guarded dashboard page, client dashboard
  api/products             public catalogue (GET)
  api/waitlist             public signup (POST)
  api/admin/*              login, logout, product CRUD, waitlist list/delete (session required)
lib/                       db pool + auto schema, auth (JWT/bcrypt), guard, validation
middleware.js              blocks /admin and /api/admin without a valid session
db/schema.sql              tables and unique keys
scripts/                   setup + seed, password hash helper, e2e test
```

- **Server-rendered catalogue.** The home page is `force-dynamic` and queries MySQL on every request, so admin edits appear on the public site straight away, with no cache to invalidate.
- **Defence in depth for admin.** The middleware rejects anonymous requests at the edge, each API route checks the session again with `requireAdmin`, and the dashboard page checks the cookie on the server before rendering. State-changing admin requests also check the `Origin` header, and the cookie is `HttpOnly`, `Secure` in production and `SameSite=Strict`.
- **No database credentials in the browser.** The database is only ever reached from server code. The public API can only read products and insert a waitlist row. There is no public write path to products.
- **Constraints belong in the database.** Duplicate prevention is a unique key, so it is safe under concurrent requests. The API maps `ER_DUP_ENTRY` to a friendly `409`.
- **Input validation.** All admin input is validated on the server (lengths, price range, status enum, hex colour, image URL must be `https://` or a local path). SQL always uses placeholders.
- **Login hardening.** bcrypt (cost 12), a constant-time style compare even for unknown emails, and a small in-memory throttle on failed logins and waitlist posts.
- **Single admin from environment variables.** This keeps the demo small and avoids storing credentials in the database. A multi-user setup would add an `admins` table.
- **Images.** Product images live in `public/sneakers`. The admin form takes an image URL or `/path`, so there is no file upload surface to secure.

## Deployment

1. Create a MySQL 8 database and copy its connection URI.
2. Import the repository into Vercel.
3. Add the four environment variables (`DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`).
4. Deploy. The app creates its tables on the first request. Run `DATABASE_URL=... npm run db:setup` once to load the demo sneakers.

## Known limitations

- A single admin account configured through environment variables; no password reset or multi-user roles.
- Rate limiting is per server instance and in memory. Behind many instances, use a shared store.
- The waitlist stores emails but does not send any email (no confirmation or launch notification).
- Product images are chosen by URL or path; there is no upload or image optimisation pipeline in the admin.
- Prices are shown in USD only. There is no cart or checkout, by design.
- On a free managed MySQL plan the database can pause after a period of inactivity, so the first request after a long idle period may be slow or fail until it wakes.
