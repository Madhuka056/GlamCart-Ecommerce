import { useEffect, useState } from 'react'
import { ChevronDown, Heart, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { formatLkr } from '../../lib/currency'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { useCatalog } from '../../context/CatalogContext'
import { useSiteContent } from '../../context/SiteContentContext'

// Wrapper: product (route param) wenas weddi content eka full remount karanawa,
// ethakota selectedImage, size, color, quantity wage okkoma state reset wenawa.
export default function ProductDetailPage() {
  const { productId } = useParams()
  return <ProductDetailContent key={productId} />
}

function ProductDetailContent() {
  const { productId } = useParams()
  const { products, loading, error } = useCatalog()
  const { content } = useSiteContent()
  const productKey = productId?.split('-')[0]
  const product = products.find((item) => item.id === productKey)
  const variants = product?.variants || []
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [openPanel, setOpenPanel] = useState('')

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image)
      setSelectedVariantId(product.variants?.[0]?.id || '')
    }
  }, [product])

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0]
  const colorOptions = [...new Map(variants.filter((variant) => variant.color).map((variant) => [variant.color, variant])).values()]
  const selectedColor = selectedVariant?.color || ''
  const sizeOptions = variants.filter((variant) => variant.size && (!selectedColor || variant.color === selectedColor))
  const gallery = product ? Array(5).fill(product.image).filter(Boolean) : []
  const selectColor = (color) => {
    const next = variants.find((variant) => variant.color === color && (!selectedVariant?.size || variant.size === selectedVariant.size))
      || variants.find((variant) => variant.color === color)
    if (next) setSelectedVariantId(next.id)
  }
  const selectSize = (size) => {
    const next = variants.find((variant) => variant.size === size && (!selectedColor || variant.color === selectedColor))
    if (next) setSelectedVariantId(next.id)
  }

  useEffect(() => {
    setQuantity(1)
    setAdded(false)
  }, [selectedVariant?.id])

  if (!product) {
    if (loading) {
      return <main className="min-h-[60vh] flex items-center justify-center bg-[#f7f3ed]"><p role="status" className="text-sm text-stone">Loading product...</p></main>
    }
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#f7f3ed] px-6">
        {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
        <h1 className="font-display text-3xl text-ink">Product not found</h1>
        <Link to="/shop" className="text-sm text-terracotta hover:underline">Back to Shop</Link>
      </main>
    )
  }

  const togglePanel = (panel) => setOpenPanel((current) => current === panel ? '' : panel)
  const wishlisted = isWishlisted(product.id)

  return (
    <main className="bg-[#f7f3ed] px-6 md:px-12 py-6 md:py-7">
      <nav className="flex items-center gap-2 text-sm text-stone mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-terracotta">{content.productDetail.homeLabel}</Link>
        <span aria-hidden="true">›</span>
        <Link to="/shop" className="hover:text-terracotta">{content.productDetail.shopLabel}</Link>
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
          <p className="text-3xl font-semibold text-ink mb-3">{formatLkr(product.priceLkr)}</p>
          <p className="text-sm text-stone mb-3">{selectedVariant?.stock > 0 ? `${selectedVariant.stock} ${content.productDetail.availableLabel}` : content.productDetail.outOfStockLabel}</p>
          {product.description && <p className="text-base text-stone leading-relaxed max-w-xl mb-6 whitespace-pre-line">{product.description}</p>}

          {colorOptions.length > 0 && <div className="mb-6">
            <h2 className="text-sm font-semibold text-ink mb-3">{content.productDetail.colorLabel}{selectedColor ? `: ${selectedColor}` : ''}</h2>
            <div className="flex items-center gap-3">
              {colorOptions.map((color) => (
                <button
                  type="button"
                  key={color.color}
                  onClick={() => selectColor(color.color)}
                  aria-label={color.color}
                  aria-pressed={selectedColor === color.color}
                  className={`w-9 h-9 rounded-full border-2 p-0.5 ${selectedColor === color.color ? 'border-charcoal' : 'border-transparent'}`}
                >
                  <span className="block w-full h-full rounded-full border border-black/10" style={{ backgroundColor: color.colorValue }} />
                </button>
              ))}
            </div>
          </div>}

          {sizeOptions.length > 0 && <div className="mb-6">
            <h2 className="text-sm font-semibold text-ink mb-3">{content.productDetail.sizeLabel}{selectedVariant?.size ? `: ${selectedVariant.size}` : ''}</h2>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((variant) => <button type="button" key={variant.id} onClick={() => selectSize(variant.size)} aria-pressed={selectedVariant?.id === variant.id} className={`min-w-10 px-3 py-2 rounded-md border text-sm transition-colors ${selectedVariant?.id === variant.id ? 'bg-charcoal border-charcoal text-cream' : 'border-cream-dark text-ink hover:border-charcoal'}`}>{variant.size}</button>)}
            </div>
          </div>}

          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-between w-28 border border-cream-dark rounded-lg px-3 py-3">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button>
              <span className="text-sm" aria-label={content.productDetail.quantityLabel}>{quantity}</span>
              <button type="button" aria-label="Increase quantity" disabled={quantity >= (selectedVariant?.stock || 0)} onClick={() => setQuantity((value) => Math.min(selectedVariant?.stock || 0, value + 1))}><Plus size={15} /></button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedVariant?.stock > 0 && addToCart(product.id, quantity, {
                  variantId: selectedVariant.id,
                  size: selectedVariant.size,
                  color: selectedVariant.color,
                })) setAdded(true)
              }}
              disabled={!selectedVariant || selectedVariant.stock < 1}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-colors ${added ? 'bg-olive text-cream' : 'bg-charcoal text-cream hover:bg-ink'}`}
            >
              <ShoppingCart size={18} /> {!selectedVariant || selectedVariant.stock < 1 ? content.productDetail.outOfStockButtonLabel : added ? content.productDetail.addedToCartLabel : content.productDetail.addToCartLabel}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="p-3 border border-cream-dark rounded-lg text-ink hover:text-terracotta transition-colors"
            >
              <Heart size={20} className={wishlisted ? 'fill-terracotta text-terracotta' : ''} />
            </button>
          </div>

          <div className="border-t border-cream-dark">
            {[
              ...(product.fabricAndCare ? [{ title: content.productDetail.fabricCareLabel, content: product.fabricAndCare }] : []),
              { title: content.productDetail.shippingReturnsLabel, content: content.productDetail.shippingReturns },
            ].map(({ title, content }) => (
              <div key={title} className="border-b border-cream-dark">
                <button type="button" onClick={() => togglePanel(title)} className="w-full flex items-center justify-between py-4 text-left text-sm font-semibold text-ink">
                  {title}<ChevronDown size={17} className={`transition-transform ${openPanel === title ? 'rotate-180' : ''}`} />
                </button>
                {openPanel === title && <p className="whitespace-pre-line pb-4 text-sm text-stone leading-relaxed">{content}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}