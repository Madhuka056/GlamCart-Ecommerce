import { useState } from 'react'
import { ArrowRight, Heart, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCatalog } from '../../context/CatalogContext'
import { apiRequest } from '../../lib/api'
import { DISTRICTS, getShippingFee } from '../../lib/shipping'
import { formatLkr } from '../../lib/currency'

const productPath = (id, name) =>
  `/shop/products/${id}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export default function CartPage() {
  const { cart, isLoadingCart, updateQuantity, removeItems, shippingDistrict, setShippingDistrict } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { products, loading: catalogLoading, error: catalogError } = useCatalog()
  const navigate = useNavigate()

  // Track UNselected lines so newly added items are selected by default
  const [unselected, setUnselected] = useState([])
  const [voucherInput, setVoucherInput] = useState('')
  const [voucher, setVoucher] = useState(null)
  const [voucherError, setVoucherError] = useState('')

  const cartItems = cart
    .map((entry) => {
      const product = products.find((item) => item.id === entry.productId)
      const variant = product?.variants?.find((item) => item.id === entry.variantId)
      return { ...entry, product, variant }
    })
    .filter((entry) => entry.product)

  const isSelected = (key) => !unselected.includes(key)
  const selectedItems = cartItems.filter((item) => isSelected(item.key))
  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length

  const toggleItem = (key) =>
    setUnselected((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]))
  const toggleAll = () => setUnselected(allSelected ? cartItems.map((item) => item.key) : [])

  const deleteSelected = () => removeItems(selectedItems.map((item) => item.key))

  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = selectedItems.reduce((sum, item) => sum + item.product.priceLkr * item.quantity, 0)
  const shippingFee = selectedItems.length > 0 ? getShippingFee(shippingDistrict) : null
  const discount = voucher
    ? Math.min(subtotal, voucher.type === 'percent' ? Math.round(subtotal * voucher.value / 100) : voucher.value)
    : 0
  const total = subtotal - discount + (shippingFee ?? 0)
  const canCheckout = selectedItems.length > 0 && shippingFee !== null && selectedItems.every((item) => item.variant && item.quantity <= item.variant.stock)

  const applyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase()
    if (!code) return
    try {
      const result = await apiRequest('/vouchers', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setVoucher(result.voucher)
      setVoucherError('')
      setVoucherInput('')
    } catch (error) {
      setVoucherError(error.message || 'Invalid voucher code')
    }
  }

  if (catalogLoading || isLoadingCart) {
    return <main className="min-h-[60vh] bg-[#f7f3ed] flex items-center justify-center"><p role="status" className="text-sm text-stone">Loading your cart...</p></main>
  }

  if (cartItems.length === 0) {
    return (
      <main className="bg-[#f7f3ed] px-6 md:px-12 py-16 min-h-[calc(100vh-152px)] flex flex-col items-center justify-center text-center">
        <ShoppingBag size={40} className="text-stone mb-4" strokeWidth={1.5} />
        <h1 className="font-display text-3xl text-ink mb-2">Your cart is empty</h1>
        <p className="text-sm text-stone mb-6">Looks like you haven't added anything yet.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-charcoal text-cream text-sm font-semibold px-6 py-3 rounded-full hover:bg-ink transition-colors"
        >
          Start Shopping
          <ArrowRight size={16} />
        </Link>
      </main>
    )
  }

  return (
    <main className="bg-[#f7f3ed] px-6 md:px-12 py-6 md:py-7 min-h-[calc(100vh-152px)]">
      <nav className="flex items-center gap-2 text-sm text-stone mb-6 max-w-[1200px] mx-auto" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-terracotta">Home</Link>
        <span aria-hidden="true">›</span>
        <span className="text-ink">Cart</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-ink mb-8 max-w-[1200px] mx-auto">Your Cart</h1>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 xl:gap-12 max-w-[1200px] mx-auto items-start">
        {/* Left: select bar + items */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-sand rounded-2xl px-4 py-3">
            <label className="flex items-center gap-3 text-sm text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 accent-charcoal cursor-pointer"
              />
              Select All ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </label>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={selectedItems.length === 0}
              className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-terracotta transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-stone"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>

          {cartItems.map(({ key, productId, quantity, size, color, product, variant }) => {
            const optionLabel = [size && `Size: ${size}`, color && `Color: ${color}`].filter(Boolean).join(', ')
            const path = productPath(productId, product.name)
            const wishlisted = isWishlisted(productId)

            return (
              <div key={key} className="flex gap-3 sm:gap-4 bg-sand rounded-2xl p-4 items-start">
                <input
                  type="checkbox"
                  checked={isSelected(key)}
                  onChange={() => toggleItem(key)}
                  aria-label={`Select ${product.name}`}
                  className="w-4 h-4 mt-10 accent-charcoal cursor-pointer shrink-0"
                />

                <Link to={path} className="shrink-0">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-cream-dark">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                </Link>

                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-stone mb-0.5">{product.category}</p>
                    <Link to={path} className="block text-sm font-medium text-ink hover:text-terracotta transition-colors">
                      {product.name}
                    </Link>
                    {optionLabel && <p className="text-xs text-stone mt-1">{optionLabel}</p>}
                    {!variant && <p className="text-xs text-terracotta mt-1">This option is no longer available. Remove it and choose an available option.</p>}
                    {variant && quantity > variant.stock && <p className="text-xs text-terracotta mt-1">Only {variant.stock} available for this size/color. Reduce the quantity.</p>}
                    {product.tag === 'Sale' && (
                      <span className="inline-block mt-2 bg-terracotta text-cream text-[10px] font-medium px-2 py-0.5 rounded-md">
                        Sale
                      </span>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                    <div className="sm:text-right">
                      <p className="text-base font-semibold text-terracotta">
                        {formatLkr(product.priceLkr * quantity)}
                      </p>
                      {quantity > 1 && <p className="text-xs text-stone">{formatLkr(product.priceLkr)} each</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 border border-cream-dark rounded-lg px-2 py-1.5 bg-cream">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={quantity <= 1}
                          onClick={() => updateQuantity(key, quantity - 1)}
                          className="text-ink hover:text-terracotta transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-ink"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm w-5 text-center">{quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={!variant || quantity >= variant.stock}
                          onClick={() => updateQuantity(key, quantity + 1)}
                          className="text-ink hover:text-terracotta transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label={wishlisted ? 'Remove from wishlist' : 'Move to wishlist'}
                        onClick={() => toggleWishlist(productId)}
                        className="text-stone hover:text-terracotta transition-colors"
                      >
                        <Heart size={18} className={wishlisted ? 'fill-terracotta text-terracotta' : ''} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${product.name} from cart`}
                        onClick={() => removeItems([key])}
                        className="text-stone hover:text-terracotta transition-colors"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: order summary */}
        <aside className="bg-sand rounded-2xl p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl text-ink mb-5">Order Summary</h2>

          <div className="flex justify-between text-sm text-stone mb-3">
            <span>Subtotal ({selectedCount} {selectedCount === 1 ? 'item' : 'items'})</span>
            <span className="text-ink font-medium">{formatLkr(subtotal)}</span>
          </div>

          <div className="mb-4">
            <label htmlFor="shipping-district" className="block text-sm text-stone mb-2">
              Delivery District
            </label>
            <select
              id="shipping-district"
              value={shippingDistrict}
              onChange={(event) => setShippingDistrict(event.target.value)}
              className="w-full bg-cream border border-cream-dark rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:border-terracotta transition-colors"
            >
              <option value="">Select district</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between text-sm text-stone mb-4">
            <span>Shipping Fee</span>
            <span className="text-ink font-medium">
              {shippingFee === null ? 'Select district' : formatLkr(shippingFee)}
            </span>
          </div>

          {/* Voucher */}
          <div className="mb-4">
            {voucher ? (
              <div className="flex items-center justify-between bg-cream border border-cream-dark rounded-lg px-3 py-2.5 text-sm">
                <span className="text-ink font-medium">{voucher.code} <span className="text-stone font-normal">({voucher.type === 'percent' ? `${voucher.value}% off` : `${formatLkr(voucher.value)} off`})</span></span>
                <button
                  type="button"
                  onClick={() => setVoucher(null)}
                  className="text-xs text-stone underline hover:text-terracotta"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(event) => {
                      setVoucherInput(event.target.value)
                      setVoucherError('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') applyVoucher()
                    }}
                    placeholder="Enter voucher code"
                    aria-label="Voucher code"
                    className="flex-1 min-w-0 bg-cream border border-cream-dark rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-stone outline-none focus:border-terracotta transition-colors"
                  />
                  <button
                    type="button"
                    onClick={applyVoucher}
                    className="bg-olive text-cream text-sm font-semibold px-4 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
                {(voucherError || catalogError) && <p role="alert" className="text-xs text-terracotta mt-2">{voucherError || catalogError}</p>}
              </>
            )}
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm text-stone mb-3">
              <span>Voucher Discount</span>
              <span className="text-olive font-medium">-{formatLkr(discount)}</span>
            </div>
          )}

          <div className="border-t border-cream-dark pt-4 mt-2 flex justify-between text-base font-semibold text-ink mb-6">
            <span>Total</span>
            <span className="text-terracotta">{formatLkr(total)}</span>
          </div>

          <button
            type="button"
            disabled={!canCheckout}
            onClick={() =>
              navigate('/checkout', {
                state: { keys: selectedItems.map((item) => item.key), voucher: voucher?.code || null },
              })
            }
            className="w-full inline-flex items-center justify-center gap-2 bg-charcoal text-cream text-sm font-semibold py-3.5 rounded-full hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-charcoal"
          >
            Proceed to Checkout ({selectedCount})
            <ArrowRight size={16} />
          </button>
          {!canCheckout && (
            <p className="text-xs text-stone text-center mt-3">
              {selectedItems.length === 0
                ? 'Select at least one item to continue.'
                : selectedItems.some((item) => !item.variant)
                  ? 'Remove unavailable options and choose an available size/color.'
                  : selectedItems.some((item) => item.quantity > item.variant.stock)
                    ? 'Reduce quantities to match available stock for the selected size/color.'
                  : 'Choose your delivery district to calculate shipping.'}
            </p>
          )}

          <Link
            to="/shop"
            className="block text-center text-sm text-ink underline mt-4 hover:text-terracotta transition-colors"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  )
}