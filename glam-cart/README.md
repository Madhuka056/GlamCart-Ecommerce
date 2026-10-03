# Glam Cart — Homepage (React + Vite + Tailwind)

## Setup

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Structure

- `src/App.jsx` — assembles the homepage from all sections below
- `src/components/TopBar.jsx` — top utility strip
- `src/components/Header.jsx` — logo, nav, icons
- `src/components/Hero.jsx` — hero banner
- `src/components/ServiceFeatures.jsx` — shipping/returns/payment/quality strip
- `src/components/Categories.jsx` — circular category links
- `src/components/FeaturedProducts.jsx` — product grid with tags + Add to Cart
- `src/components/PromoBanners.jsx` — 3-panel Sale / 50% Off / New Arrivals
- `src/components/WhyChooseUs.jsx` — feature icons + testimonial
- `src/components/Newsletter.jsx` — email signup band
- `src/components/Footer.jsx` — footer links + contact + socials

Colors, type and spacing are defined as Tailwind tokens in `tailwind.config.js`
(cream, ink, charcoal, olive, terracotta, sand) — reuse these for any new
page so it matches this homepage automatically.

Product/category images currently use Unsplash placeholders — swap the `img`
src values in `FeaturedProducts.jsx` and `Categories.jsx` for your real assets.
