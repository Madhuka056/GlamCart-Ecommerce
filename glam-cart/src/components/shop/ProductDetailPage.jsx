import { useState } from 'react'
import { ChevronDown, Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { products } from './ShopPage'
import { formatLkr, toLkr } from '../../lib/currency'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'

const colorOptions = [
  { name: 'Natural', value: '#e7dcc9' },
  { name: 'Black', value: '#242424' },
  { name: 'Olive', value: '#6d7550' },
  { name: 'Terracotta', value: '#bd7055' },
]
const sizes = ['XS', 'S', 'M', 'L', 'XL']

// Wrapper: product (route param) wenas weddi content eka full remount karanawa,
// ethakota selectedImage, size, color, quantity wage okkoma state reset wenawa.
export default function ProductDetailPage() {
  const { productId } = useParams()
  return <ProductDetailContent key={productId} />
}

function ProductDetailContent() {
  const { productId } = useParams()
  const productIndex = Number(productId?.split('-')[0])
  const product = products[productIndex]
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [selectedImage, setSelectedImage] = useState(product?.image)
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].name)
  const [selectedSize, setSelectedSize] = useState('M')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [openPanel, setOpenPanel] = useState('Product Description')

  if (!product) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#f7f3ed] px-6">
        <h1 className="font-display text-3xl text-ink">Product not found</h1>
        <Link to="/shop" className="text-sm text-terracotta hover:underline">Back to Shop</Link>
      </main>
    )
  }

  const gallery = [product.image, product.image, product.image, product.image, product.image]
  const togglePanel = (panel) => setOpenPanel((current) => current === panel ? '' : panel)
  const wishlisted = isWishlisted(productIndex)

  return (
    <main className="bg-[#f7f3ed] px-6 md:px-12 py-6 md:py-7">
      <nav className="flex items-center gap-2 text-sm text-stone mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-terracotta">Home</Link>
        <span aria-hidden="true">›</span>
        <Link to="/shop" className="hover:text-terracotta">Shop</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-terracotta">{product.category}</Link>
        <span aria-hidden="true">›</span>
        <span className="text-ink truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 max-w-[1400px] mx-auto">
        <section>
          <div className="relative rounded-xl overflow-hidden bg-cream-dark aspect-[4/3]">
            <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-5 gap-3 mt-3">
            {gallery.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => setSelectedImage(image)}
                className={`aspect-square rounded-lg overflow-hidden bg-cream-dark border-2 ${selectedImage === image && index === 0 ? 'border-charcoal' : 'border-transparent'}`}
                aria-label={`View ${product.name} image ${index + 1}`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        <section className="pt-1 lg:pt-2">
          {product.tag && <span className="inline-block bg-sand text-ink text-xs font-medium px-3 py-1 rounded-md mb-4">{product.tag}</span>}
          <p className="text-sm text-stone mb-2">{product.category}</p>
          <h1 className="font-display text-4xl md:text-5xl leading-tight text-ink mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-0.5 text-terracotta" aria-label="4.8 out of 5 stars">
              {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={17} fill="currentColor" />)}
            </div>
            <span className="text-sm font-medium text-ink">4.8</span>
            <a href="#reviews" className="text-sm text-ink underline">21 Reviews</a>
          </div>
          <p className="text-3xl font-semibold text-ink mb-3">{formatLkr(toLkr(product.price))}</p>
          <p className="text-base text-stone leading-relaxed max-w-xl mb-6">A versatile {product.name.toLowerCase()} with a comfortable fit, premium feel and effortless everyday style.</p>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-ink mb-3">Color Swatches</h2>
            <div className="flex items-center gap-3">
              {colorOptions.map((color) => (
                <button
                  type="button"
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  aria-label={color.name}
                  className={`w-9 h-9 rounded-full border-2 p-0.5 ${selectedColor === color.name ? 'border-charcoal' : 'border-transparent'}`}
                >
                  <span className="block w-full h-full rounded-full border border-black/10" style={{ backgroundColor: color.value }} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink">Size Selector</h2>
              <button type="button" className="text-sm text-ink underline">Size Guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => <button type="button" key={size} onClick={() => setSelectedSize(size)} className={`min-w-10 px-3 py-2 rounded-md border text-sm transition-colors ${selectedSize === size ? 'bg-charcoal border-charcoal text-cream' : 'border-cream-dark text-ink hover:border-charcoal'}`}>{size}</button>)}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-between w-28 border border-cream-dark rounded-lg px-3 py-3">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button>
              <span className="text-sm">{quantity}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}><Plus size={15} /></button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (addToCart(productIndex, quantity)) setAdded(true)
              }}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-colors ${added ? 'bg-olive text-cream' : 'bg-charcoal text-cream hover:bg-ink'}`}
            >
              <ShoppingCart size={18} /> {added ? 'Added to Cart' : 'Add to Cart'}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(productIndex)}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="p-3 border border-cream-dark rounded-lg text-ink hover:text-terracotta transition-colors"
            >
              <Heart size={20} className={wishlisted ? 'fill-terracotta text-terracotta' : ''} />
            </button>
          </div>

          <div className="border-t border-cream-dark">
            {['Product Description', 'Fabric & Care', 'Shipping & Returns'].map((panel) => (
              <div key={panel} className="border-b border-cream-dark">
                <button type="button" onClick={() => togglePanel(panel)} className="w-full flex items-center justify-between py-4 text-left text-sm font-semibold text-ink">
                  {panel}<ChevronDown size={17} className={`transition-transform ${openPanel === panel ? 'rotate-180' : ''}`} />
                </button>
                {openPanel === panel && <p className="pb-4 text-sm text-stone leading-relaxed">Designed for easy styling and everyday comfort. See our care and delivery information for more details.</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}