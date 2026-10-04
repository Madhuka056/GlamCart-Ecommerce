import { useState } from 'react'
import { Clock3, Facebook, Instagram, Mail, MapPin, Phone, Plus, Twitter, Youtube } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const shopLinks = [
  { label: 'All Products', to: '/shop' },
  { label: 'Men', to: '/shop?category=Men' },
  { label: 'Women', to: '/shop?category=Women' },
  { label: 'Kids', to: '/shop?category=Kids' },
  { label: 'Sale', to: '/shop?tag=Sale' },
]

const categoryLinks = [
  { label: 'Footwear', to: '/shop?category=Footwear' },
  { label: 'Accessories', to: '/shop?category=Accessories' },
  { label: 'Cosmetics', to: '/shop?category=Cosmetics' },
  { label: 'New Arrivals', to: '/shop?tag=New' },
]

const faqs = [
  {
    question: 'How can I place an order?',
    answer: 'Browse the shop, add your items to the cart, then continue to checkout to enter your delivery details and place your order.',
  },
  {
    question: 'Which payment methods are available?',
    answer: 'Checkout currently supports Cash on Delivery and Bank Transfer.',
  },
  {
    question: 'How is the delivery fee calculated?',
    answer: 'The delivery fee is calculated at checkout based on your selected delivery district.',
  },
  {
    question: 'Where can I view or cancel an order?',
    answer: 'Sign in and open Order History to view your orders. Orders that are still placed can be cancelled there.',
  },
]

const linkClass =
  'inline-flex items-center text-sm text-cream/70 transition-colors hover:text-terracotta focus-visible:outline-none focus-visible:text-terracotta'

export default function Footer() {
  const [showFaqs, setShowFaqs] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const goToStory = (event) => {
    event.preventDefault()
    const scrollToStory = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' }),
        ),
      )

    if (pathname === '/') {
      scrollToStory()
      return
    }

    navigate('/')
    scrollToStory()
  }

  return (
    <footer className="bg-charcoal text-cream">
      <div className="grid grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 md:grid-cols-5 md:px-12">
        <div className="md:col-span-2">
          <Link to="/" className="inline-block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta">
            <span className="font-display text-xl">Glam Cart</span>
          </Link>
          <p className="mb-4 mt-3 max-w-xs text-sm leading-relaxed text-cream/70">
            Glam Cart is your modern style destination for prints, textures and timeless fashion.
          </p>
          <a
            href="mailto:contact@glamcart.com"
            className="mb-4 inline-flex items-center gap-2 text-sm text-cream/80 transition-colors hover:text-terracotta"
          >
            <Mail size={16} strokeWidth={1.7} />
            contact@glamcart.com
          </a>
          <div className="flex items-center gap-4 text-cream/80">
            <a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer" className="transition-colors hover:text-terracotta"><Instagram size={18} /></a>
            <a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noreferrer" className="transition-colors hover:text-terracotta"><Facebook size={18} /></a>
            <a href="https://www.x.com/" aria-label="X" target="_blank" rel="noreferrer" className="transition-colors hover:text-terracotta"><Twitter size={18} /></a>
            <a href="https://www.youtube.com/" aria-label="YouTube" target="_blank" rel="noreferrer" className="transition-colors hover:text-terracotta"><Youtube size={18} /></a>
          </div>
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">Contact Info</h2>
            <ul className="space-y-2 text-sm text-cream/70">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0" size={16} strokeWidth={1.7} />
                <a
                  className="transition-colors hover:text-terracotta"
                  href="https://maps.google.com/?q=No+178%2FB+Wijerama+Road%2C+Colombo+07"
                  target="_blank"
                  rel="noreferrer"
                >
                  No 178/B Wijerama Road, Colombo 07
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="shrink-0" size={16} strokeWidth={1.7} />
                <a className="transition-colors hover:text-terracotta" href="tel:+94771234567">
                  077 123 4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock3 className="shrink-0" size={16} strokeWidth={1.7} />
                <span>Mon – Sat: 9AM – 7PM</span>
              </li>
            </ul>
          </section>
        </div>

        <nav aria-label="Shop categories">
          <h2 className="mb-3 text-sm font-semibold">Shop</h2>
          <ul className="space-y-2 text-sm">
            {shopLinks.map(({ label, to }) => (
              <li key={label}>
                <Link className={linkClass} to={to}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Product categories">
          <h2 className="mb-3 text-sm font-semibold">Categories</h2>
          <ul className="space-y-2 text-sm">
            {categoryLinks.map(({ label, to }) => (
              <li key={label}>
                <Link className={linkClass} to={to}>{label}</Link>
              </li>
            ))}
            <li>
              <Link className={linkClass} to="/wishlist">Wishlist</Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold">Help</h2>
            <ul className="space-y-2 text-sm">
              <li><a className={linkClass} href="/#about-us" onClick={goToStory}>Our Story</a></li>
              <li><Link className={linkClass} to="/order-history">Track Order</Link></li>
              <li>
                <button
                  type="button"
                  className={`${linkClass} gap-1`}
                  aria-expanded={showFaqs}
                  aria-controls="footer-faq-list"
                  onClick={() => setShowFaqs((shown) => !shown)}
                >
                  FAQs
                  <Plus size={14} className={`transition-transform ${showFaqs ? 'rotate-45' : ''}`} />
                </button>
              </li>
            </ul>
            {showFaqs && (
              <div id="footer-faq-list" className="mt-3 space-y-2 border-l border-terracotta/60 pl-3">
                {faqs.map(({ question, answer }, index) => (
                  <div key={question}>
                    <button
                      type="button"
                      className="text-left text-xs font-medium text-cream/80 transition-colors hover:text-terracotta"
                      aria-expanded={openFaq === index}
                      onClick={() => setOpenFaq((current) => current === index ? null : index)}
                    >
                      {question}
                    </button>
                    {openFaq === index && (
                      <p className="mt-1 text-xs leading-relaxed text-cream/60">{answer}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="flex flex-col justify-between gap-3 px-6 py-5 text-xs text-cream/60 sm:flex-row md:px-12">
          <span>© 2026 Glam Cart. All rights reserved.</span>
          <span>Visa · Mastercard · Amex · PayPal</span>
        </div>
      </div>
    </footer>
  )
}
