# Glam Cart API

## Order confirmation email

Orders are saved to MongoDB before the API attempts to email the authenticated
customer's account email address. Email delivery uses Gmail SMTP via Nodemailer.

### Gmail SMTP setup

1. Enable 2-Step Verification on the Gmail account that will send messages.
2. Create a Google App Password for the backend (Google Account → Security →
   App passwords). Use this generated password, not the normal Gmail password.
3. Copy `.env.example` to `.env` and set the MongoDB/JWT values plus
   `GMAIL_USER` (the sending Gmail address) and `GMAIL_APP_PASSWORD`.
4. Keep `.env` private and out of source control. Never place SMTP credentials
   in frontend code.
5. Start the API with `npm run dev` or `npm start`, then place a test order.

Gmail sends from the configured account to the customer's authenticated Glam
Cart account email. Gmail has sending limits and may not be suitable for
high-volume production traffic.

The authenticated `POST /api/orders` endpoint creates an order and attempts to
send its confirmation email. If the email provider is unavailable, the order
remains saved and the API response reports `confirmationEmailStatus` as
`failed`; missing Gmail SMTP configuration is reported as `not_configured`.

The backend reads product prices, inventory, and active vouchers from MongoDB
when it creates an order. Product totals and discount amounts sent by the
browser are not trusted.

## Admin dashboard

The admin dashboard is available at `/admin`. Register a normal account first,
then grant that account the admin role from the backend directory:

```bash
npm run admin:promote -- admin@example.com
```

Only authenticated accounts with the database `role: "admin"` can access the
admin API. The first backend start imports the existing demo catalog and the
`GLAM10` / `WELCOME5` vouchers if the product catalog is empty. Imported
products start with zero stock and need size/color variants configured with
verified inventory in the dashboard before they can be sold. The dashboard
manages product descriptions, care information, image galleries, and variants;
inventory is tracked separately for each active variant. Product removal and
variant removal are soft archives so existing order history and cancellation
restocking remain intact.

### Website content management

The admin dashboard's **Website content** section manages homepage sections,
brand and navigation, category tiles, featured-product selection, promotions
and their destinations, About/benefits/newsletter copy, shop and product-detail
labels, contact/social links, and footer FAQs. Content is stored in MongoDB
and served publicly from `GET /api/site-content`; reads and changes under
`/api/admin/site-content` require an admin account. Admins can select JPEG,
PNG, GIF, or WebP files up to 5 MB from the product form and website content
editor. Uploaded files are stored under `backend/uploads/` and served from
`/uploads/`; this directory is excluded from Git. Keep it on persistent storage
when deploying the backend, or configure an external persistent image store
before using an ephemeral/serverless host. Login credentials and payment-provider
secrets are not part of the CMS.

## PayHere card payments

Set `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, and `PAYHERE_MODE` in the
backend environment. Use sandbox merchant credentials with `PAYHERE_MODE=sandbox`
for testing; use live credentials only with `PAYHERE_MODE=live`. `SERVER_URL`
must be the publicly reachable HTTPS base URL of the backend so PayHere can send
payment notifications. Set `CLIENT_URL` to the frontend origin when the backend
cannot receive a browser `Origin` header. Keep the merchant secret on the backend
only.
