import { useRef, useState, useEffect, useCallback } from 'react'
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCatalog } from '../context/CatalogContext'
import { formatLkr } from '../lib/currency'
import { useSiteContent } from '../context/SiteContentContext'

function tagColor(tag) {
  return tag === 'Sale' ? 'bg-terracotta' : 'bg-olive'
}

export default function FeaturedProducts() {
  const navigate = useNavigate()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { products: catalogProducts } = useCatalog()
  const { content } = useSiteContent()
  const products = content.featured.productNames
    .map((name) => catalogProducts.find((product) => product.name === name))
    .filter(Boolean)
  const trackRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [updateArrows])

  const scrollByPage = (direction) => {
    const el = trackRef.current
    if (!el) return
    const amount = el.clientWidth * 0.9 * direction
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <section id="shop" className="w-full px-6 md:px-12 py-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">{content.featured.title}</h2>
          <p className="text-sm text-stone">{content.featured.subtitle}</p>
        </div>
        <Link to="/shop" className="hidden sm:inline text-sm font-medium text-ink hover:text-terracotta transition-colors">
          View All Products →
        </Link>
      </div>

      <div className="relative">
        <button
          aria-label="Previous products"
          onClick={() => scrollByPage(-1)}
          disabled={!canScrollLeft}
          className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-cream border border-stone/30 shadow-md flex items-center justify-center text-charcoal hover:bg-charcoal hover:text-cream hover:border-charcoal transition-colors disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft size={17} />
        </button>

        <button
          aria-label="Next products"
          onClick={() => scrollByPage(1)}
          disabled={!canScrollRight}
          className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 rounded-full bg-cream border border-stone/30 shadow-md flex items-center justify-center text-charcoal hover:bg-charcoal hover:text-cream hover:border-charcoal transition-colors disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronRight size={17} />
        </button>

        <div
          ref={trackRef}
          className="flex gap-20 overflow-x-auto snap-x snap-mandatory scroll-smooth pt-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
        >
          {products.map((p) => {
            const wishlisted = isWishlisted(p.id)
            return (
              <div
                key={p.id}
                role="link"
                tabIndex="0"
                onClick={() => {
                  navigate(`/shop/products/${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    navigate(`/shop/products/${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
                  }
                }}
                className="group shrink-0 snap-start w-[calc(42%-0.75rem)] md:w-[calc(28%-1rem)] lg:w-[calc(17.5%-1.2rem)] cursor-pointer rounded-2xl bg-sand p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:border-terracotta/50 hover:shadow-lg"
              >
                <div className="relative rounded-xl overflow-hidden bg-cream-dark aspect-[3/4] mb-3">
                  {p.tag && <span className={`absolute top-3 left-3 ${tagColor(p.tag)} text-cream text-[10px] font-semibold tracking-wide px-2 py-1 rounded-full`}>{p.tag}</span>}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleWishlist(p.id)
                    }}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className="absolute top-3 right-3 bg-cream/90 rounded-full p-1.5 text-charcoal hover:text-terracotta transition-colors"
                  >
                    <Heart size={14} className={wishlisted ? 'fill-terracotta text-terracotta' : ''} />
                  </button>
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                </div>
                <p className="text-sm font-medium text-ink leading-tight">{p.name}</p>
                <p className="text-sm text-stone mb-1.5">{formatLkr(p.priceLkr)}</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    navigate(`/shop/products/${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
                  }}
                  disabled={p.stock < 1}
                  className="w-full bg-olive text-cream text-[15px] font-medium py-1.5 rounded-full hover:bg-ink transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}