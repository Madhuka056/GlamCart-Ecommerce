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

The backend recalculates product prices, delivery charges, vouchers, and the
final LKR amount before creating an order. Keep `src/config/productPrices.js`
index-aligned with the frontend catalog when catalog prices or ordering change.

## PayHere card payments

Set `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, and `PAYHERE_MODE` in the
backend environment. Use sandbox merchant credentials with `PAYHERE_MODE=sandbox`
for testing; use live credentials only with `PAYHERE_MODE=live`. `SERVER_URL`
must be the publicly reachable HTTPS base URL of the backend so PayHere can send
payment notifications. Set `CLIENT_URL` to the frontend origin when the backend
cannot receive a browser `Origin` header. Keep the merchant secret on the backend
only.
