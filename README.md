<div align="center">

# 🛍️ Glam Cart

**A full-stack fashion & lifestyle e-commerce platform built for Sri Lanka.**

Storefront · Secure checkout with PayHere · Admin dashboard · Built-in CMS

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)

</div>

---

## 📖 Overview

Glam Cart is a complete online store: customers browse a catalogue, pick size/colour variants, apply vouchers, and pay by cash on delivery, bank transfer, or card (PayHere). Store owners manage products, stock, orders, customers, vouchers, **and the website's own content** from a single admin dashboard — no code changes needed.

The project is split into two independent apps in one repository:

| Folder | What it is |
| --- | --- |
| [`glam-cart/`](./glam-cart) | React + Vite + Tailwind storefront and admin UI |
| [`backend/`](./backend) | Express + MongoDB REST API |
| [`shared/`](./shared) | Default website content (`siteContentDefaults.json`) |

---

## ✨ Features

### 🛒 For customers
- **Shop & discovery** – product listing with category, tag, search, price and option filters plus sorting; product detail pages with image galleries, description and fabric/care info.
- **Size & colour variants** – stock is tracked per variant, so customers only see what is actually available.
- **Cart & wishlist** – saved per account, so they are still there on the next visit.
- **Sri Lanka–aware shipping** – all 25 districts mapped to three delivery zones with a fee and delivery-date estimate calculated at checkout.
- **Vouchers** – percentage or fixed-amount discount codes.
- **Three payment options** – Cash on Delivery, Bank Transfer (with slip upload), and Card Payment through **PayHere**.
- **Order history** – track order status and cancel an order while it is still in the `placed` state and unpaid; stock is restored automatically.
- **Order confirmation emails** – sent via Gmail SMTP when an order is placed (for card orders, once PayHere confirms the payment).
- **Account system** – register / login / logout with protected pages (cart, wishlist, checkout, order history).

### 🧑‍💼 For admins (`/admin`)
| Section | What you can do |
| --- | --- |
| **Overview** | Dashboard summary and recent orders |
| **Products & stock** | Create, edit and archive products; manage descriptions, image galleries, size/colour variants and per-variant inventory |
| **Orders** | View orders and move them through `placed → processing → shipped → delivered`, or cancel (with confirmation) |
| **Customers** | View registered customers |
| **Vouchers** | Create, update and delete discount codes, with optional expiry dates |
| **Website content** | Edit homepage sections, brand & navigation, categories, featured products, promotions, About/benefits/newsletter copy, contact & social links and footer FAQs — and toggle sections on or off |

Admins can also upload product and banner images (JPEG, PNG, GIF, WebP · up to 5 MB).

---

## 🔒 Security & reliability highlights

- **Server-side pricing** – product prices, stock, vouchers and shipping fees are re-read from the database when an order is created. Totals sent from the browser are never trusted.
- **Atomic stock control** – inventory is decremented with conditional database updates, which prevents overselling when customers check out at the same time.
- **Verified payments** – PayHere notifications are validated with the MD5 signature, merchant ID, currency and exact amount before an order is marked as paid.
- **Safe authentication** – passwords hashed with bcrypt (cost 12); JWT stored in an `httpOnly` cookie (`secure` in production, `sameSite=lax`).
- **Role-based access** – every `/api/admin/*` route requires an authenticated user with the `admin` role.
- **Hardened API** – `helmet` security headers, `express-validator` input validation, centralised error handling.
- **Safe uploads** – image type is verified from the file's actual bytes (not just its extension) and files are renamed to random UUIDs.
- **Soft deletes** – removing a product or variant archives it, so order history and cancellation restocking stay intact.

---

## 🧰 Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, Vite 5, React Router 7, Tailwind CSS 3, Lucide icons |
| **Backend** | Node.js, Express 5, Mongoose 9 (MongoDB) |
| **Auth & security** | JWT, bcryptjs, Helmet, CORS, cookie-parser, express-validator |
| **Payments** | PayHere (LKR) |
| **Email** | Nodemailer + Gmail SMTP |
| **Uploads** | Multer |

---

## 📁 Project structure

```text
GlamCart-Ecommerce/
├── backend/
│   ├── server.js                 # Entry point: DB connection, store seeding, listen
│   └── src/
│       ├── app.js                # Express app, middleware, route mounting
│       ├── admin/                # Admin controllers, routes, image upload, promoteAdmin script
│       ├── config/               # DB connection, first-run store initialisation
│       ├── controllers/          # auth, orders, PayHere, products, vouchers, site content
│       ├── data/                 # initialCatalog.json (seed products)
│       ├── middleware/           # auth (protect / adminOnly), validation, error handling
│       ├── models/               # User, Product, Order, Voucher, SiteContent
│       ├── routes/               # Public & authenticated API routes
│       └── utils/                # Inventory helpers, order emails, token cookie
├── glam-cart/
│   └── src/
│       ├── components/           # Homepage sections
│       │   ├── shop/             # Shop, product detail, cart, checkout, orders, wishlist
│       │   └── admin/            # Admin dashboard, content editor, image upload field
│       ├── context/              # Auth, Cart, Wishlist, Catalog, SiteContent providers
│       └── lib/                  # API client, currency, shipping zones, PayHere helper
└── shared/
    └── siteContentDefaults.json  # Default CMS content
```

---

## 🚀 Getting started

### Prerequisites
- **Node.js 20 or later** and npm
- A **MongoDB** database (local, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- *(Optional)* a [PayHere](https://www.payhere.lk) sandbox account for card payments
- *(Optional)* a Gmail account with an App Password for order emails

### 1. Clone the repository
```bash
git clone https://github.com/Madhuka056/GlamCart-Ecommerce.git
cd GlamCart-Ecommerce
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `backend/.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/glamcart

# Authentication
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d

# Frontend origin (used for PayHere return/cancel URLs)
CLIENT_URL=http://localhost:5173

# --- Optional: PayHere card payments ---
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_MODE=sandbox          # use "live" only with live credentials
SERVER_URL=https://your-public-backend-url

# --- Optional: order confirmation emails (Gmail SMTP) ---
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your_google_app_password
```

Start the API:
```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

The API runs at `http://localhost:5000`. Check it with `GET /api/health`.

> **First run:** the backend automatically imports the demo catalogue (42 products across Women, Men, Kids, Footwear, Accessories and Cosmetics) and two vouchers — `GLAM10` (10 % off) and `WELCOME5` (Rs. 550 off). Imported products start with **zero stock**, so set up variants and inventory in the admin dashboard before they can be sold.

### 3. Set up the frontend
```bash
cd glam-cart
npm install
npm run dev
```

Open **http://localhost:5173**.

By default the frontend talks to `http://localhost:5000/api`. To point it elsewhere, create `glam-cart/.env`:
```env
VITE_API_URL=https://your-backend-domain/api
```

### 4. Create your admin account
1. Register a normal account on the website.
2. Promote it from the `backend` folder:
   ```bash
   npm run admin:promote -- you@example.com
   ```
3. Log in again and open **http://localhost:5173/admin**.

---

## 💳 Payments & email

### PayHere (card payments)
1. Create a PayHere **sandbox** merchant account and add the credentials to `backend/.env`.
2. `SERVER_URL` must be a **publicly reachable HTTPS** address so PayHere can send payment notifications to `/api/payhere/notify`. When developing locally, expose your backend with a tunnel such as ngrok and use that URL.
3. Keep the merchant secret on the backend only — it is never sent to the browser.

### Order confirmation emails
1. Enable 2-Step Verification on the sending Gmail account.
2. Create a Google **App Password** (Google Account → Security → App passwords) and use it as `GMAIL_APP_PASSWORD`.
3. Orders are always saved first. The API response reports `confirmationEmailStatus` as `sent`, `failed` or `not_configured`, so a mail problem never loses an order.

> Gmail has daily sending limits — consider a transactional email provider for high-volume production use.

---

## 🔌 API reference

Base URL: `http://localhost:5000/api`

### Public
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `GET` | `/products` | List active products with variants |
| `GET` | `/site-content` | Public website content |
| `GET` | `/vouchers` | List currently active vouchers |
| `POST` | `/vouchers` | Validate a voucher code |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Log in |
| `POST` | `/auth/logout` | Log out |

### Authenticated (customer)
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/auth/me` | Current user |
| `POST` | `/orders` | Place an order |
| `GET` | `/orders/my-orders` | List my orders |
| `GET` | `/orders/:orderId` | Get one of my orders |
| `PATCH` | `/orders/:orderId/cancel` | Cancel an unpaid, newly placed order |
| `POST` | `/payhere/start` | Get PayHere checkout parameters for a card order |

### PayHere server callback
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/payhere/notify` | Payment notification (signature-verified) |

### Admin (`role: admin` required)
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/admin/dashboard` | Dashboard summary |
| `GET` `POST` | `/admin/products` | List / create products |
| `PUT` `DELETE` | `/admin/products/:id` | Update / archive a product |
| `GET` | `/admin/orders` | List orders |
| `PATCH` | `/admin/orders/:id` | Update order status |
| `GET` | `/admin/customers` | List customers |
| `GET` `POST` | `/admin/vouchers` | List / create vouchers |
| `PUT` `DELETE` | `/admin/vouchers/:id` | Update / delete a voucher |
| `POST` | `/admin/uploads` | Upload an image (≤ 5 MB) |
| `GET` `PUT` | `/admin/site-content` | Read / update website content |
| `POST` | `/admin/site-content/reset` | Reset content to defaults |

---

## 🚚 Shipping zones

Delivery is island-wide. Each district belongs to one of three zones:

| Zone | Example districts | Fee | Estimated delivery |
| --- | --- | --- | --- |
| Colombo Area | Colombo, Gampaha, Kalutara | Rs. 220 | 1–2 days |
| Main Cities | Kandy, Galle, Matara, Kurunegala … | Rs. 330 | 2–4 days |
| Other Districts | Jaffna, Batticaloa, Nuwara Eliya … | Rs. 440 | 3–6 days |

The fee is recomputed on the server when an order is created, so it cannot be tampered with from the browser.

---

## 🎨 Design system

The UI uses a warm, editorial palette defined as Tailwind tokens in `glam-cart/tailwind.config.js`:
`cream` · `ink` · `charcoal` · `olive` · `terracotta` · `sand`, with **Bodoni Moda** and **Playfair Display** for headings and **Inter** for body text. Reuse these tokens for any new page so it matches the rest of the site.

---

## 🌐 Deployment notes

- **CORS** – allowed origins are currently set in `backend/src/app.js` (`localhost:5173` / `127.0.0.1:5173`). Add your production frontend domain there before deploying.
- **HTTPS** – in production the auth cookie is `secure`, so the site must be served over HTTPS.
- **Uploads** – images are stored in `backend/uploads/` (excluded from Git). Use persistent storage, or move to an external image store if you deploy to an ephemeral or serverless host.
- **Secrets** – never commit `.env` files. PayHere and SMTP credentials belong on the backend only.
- **Frontend build** – `npm run build` inside `glam-cart/` produces a static `dist/` folder.

---

## 🗺️ Roadmap ideas

- Automated tests (API and UI)
- External image storage (S3 / Cloudinary)
- Password reset and email verification
- Customer product reviews and ratings
- Docker setup for one-command local start

---

## 👤 Author

**Madhuka** — [@Madhuka056](https://github.com/Madhuka056)

If you find this project useful, consider giving it a ⭐ on GitHub!
