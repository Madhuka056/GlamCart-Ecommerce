import { Heart, ShoppingBag } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { products } from './ShopPage'
import { formatLkr, toLkr } from '../../lib/currency'

function getProductPath(index, product) {
  return `/shop/products/${index}-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const wishlistedProducts = wishlist
    .map((index) => ({ index, product: products[index] }))
    .filter((entry) => entry.product)

  return (
    <main className="bg-[#f7f3ed] px-6 md:px-12 py-6 md:py-7 min-h-[60vh]">
      <h1 className="font-display text-3xl text-ink mb-1">My Wishlist</h1>
      <p className="text-sm text-stone mb-6">
        {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item' : 'items'} saved
      </p>

      {wishlistedProducts.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center gap-4">
          <Heart size={40} className="text-stone" strokeWidth={1.5} />
          <p className="text-sm text-stone">Your wishlist is empty.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-ink transition-colors"
          >
            <ShoppingBag size={16} /> Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-7">
          {wishlistedProducts.map(({ index, product }) => (
            <article
              key={index}
              role="link"
              tabIndex="0"
              onClick={() => navigate(getProductPath(index, product))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') navigate(getProductPath(index, product))
              }}
              className="group min-w-0 cursor-pointer rounded-2xl bg-sand p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:border-terracotta/50 hover:shadow-lg"
            >
              <div className="relative rounded-xl overflow-hidden bg-cream-dark aspect-[3/4] mb-3">
                {product.tag && (
                  <span className={`absolute top-3 left-3 z-10 ${product.tag === 'Sale' ? 'bg-terracotta' : 'bg-olive'} text-cream text-[10px] font-semibold tracking-wide px-2 py-1 rounded-full`}>
                    {product.tag}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeFromWishlist(index)
                  }}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="absolute top-3 right-3 z-10 bg-cream/90 rounded-full p-1.5 text-terracotta transition-colors"
                >
                  <Heart size={14} className="fill-terracotta" />
                </button>
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300" />
              </div>
              <p className="text-sm font-medium text-ink leading-tight">{product.name}</p>
              <p className="text-sm text-stone mb-1.5">{formatLkr(toLkr(product.price))}</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  if (addToCart(index)) navigate('/cart')
                }}
                className="w-full bg-olive text-cream text-[15px] font-medium py-1.5 rounded-full hover:bg-ink transition-colors"
              >
                Add to Cart
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}