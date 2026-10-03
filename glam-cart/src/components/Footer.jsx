import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react'

const columns = [
  {
    title: 'Shop',
    links: ['Men', 'Women', 'Kids', 'Accessories', 'Shoes', 'Deals'],
  },
  {
    title: 'Categories',
    links: ['Cosmetics', 'Shoes', 'Accessories', 'Bags', 'Home & Lifestyle'],
  },
  {
    title: 'Help',
    links: ['Our Story', 'Track Order', 'Returns', 'FAQs', 'Policies'],
  },
]

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream">
      <div className="w-full px-6 md:px-12 py-12 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <h4 className="font-display text-xl mb-3">Glam Cart</h4>
          <p className="text-sm text-cream/70 leading-relaxed max-w-xs mb-4">
            Glam Cart is your modern style destination for prints, textures and timeless fashion.
          </p>
          <div className="flex items-center gap-4 text-cream/80">
            <Instagram size={18} />
            <Facebook size={18} />
            <Twitter size={18} />
            <Youtube size={18} />
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="text-sm font-semibold mb-3">{col.title}</h5>
            <ul className="space-y-2 text-sm text-cream/70">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-terracotta transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h5 className="text-sm font-semibold mb-3">Contact Info</h5>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>123 Regent St, London W1B 5TB</li>
            <li>+44 20 7946 0123</li>
            <li>contact@glamcart.com</li>
            <li>Mon – Sat: 9AM – 7PM</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="w-full px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/60">
          <span>© 2026 Glam Cart. All Rights Reserved.</span>
          <span>Visa · Mastercard · Amex · PayPal</span>
        </div>
      </div>
    </footer>
  )
}
