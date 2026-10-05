import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useAuthPrompt } from './AuthPromptContext'
import { useCatalog } from './CatalogContext'

const CartContext = createContext(null)

// Each inventory variant is its own cart line; older saved entries are matched by size/color.
const makeKey = (productId, variantId, size, color) =>
  variantId ? `${productId}-variant-${variantId}` : (size || color ? `${productId}-${size || ''}-${color || ''}` : String(productId))

const normalizeCart = (entries, products) =>
  Array.isArray(entries)
    ? entries.map((entry) => {
        const product = products.find((item) => item.id === entry.productId || item.legacyIndex === entry.index)
        const productId = entry.productId || product?.id
        const variants = product?.variants || []
        const variant = variants.find((item) => item.id === entry.variantId)
          || variants.find((item) => item.size === (entry.size || '') && item.color === (entry.color || ''))
          || (variants.length === 1 ? variants[0] : null)
        return productId
          ? {
              ...entry,
              productId,
              variantId: variant?.id || entry.variantId || '',
              size: variant?.size ?? entry.size,
              color: variant?.color ?? entry.color,
              key: makeKey(productId, variant?.id || entry.variantId, entry.size, entry.color),
            }
          : entry
      })
    : []

const matches = (entry, k) => entry.key === String(k) || entry.productId === String(k)

export function CartProvider({ children }) {
  const { user, loading } = useAuth()
  const { products, loading: catalogLoading } = useCatalog()
  const { openAuthPrompt } = useAuthPrompt()
  const [cart, setCart] = useState([])
  const [shippingDistrict, setShippingDistrict] = useState('')
  const [loadedFor, setLoadedFor] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const accountId = user?.id
  const storageKey = accountId ? String(accountId) : 'guest'
  const isLoadingCart = loading || catalogLoading || loadedFor !== storageKey

  useEffect(() => {
    if (loading || catalogLoading) return

    try {
      const savedCart = accountId ? localStorage.getItem(`glamcart-cart:${accountId}`) : null
      const savedDistrict = accountId ? localStorage.getItem(`glamcart-district:${accountId}`) : null
      setCart(savedCart ? normalizeCart(JSON.parse(savedCart), products) : [])
      setShippingDistrict(savedDistrict || '')
    } catch {
      setCart([])
      setShippingDistrict('')
    }
    setLoadedFor(storageKey)
  }, [catalogLoading, loading, products, user?.id])

  useEffect(() => {
    if (loading || !user?.id || loadedFor !== String(user.id)) return

    try {
      localStorage.setItem(`glamcart-cart:${user.id}`, JSON.stringify(cart))
      localStorage.setItem(`glamcart-district:${user.id}`, shippingDistrict)
    } catch {
      // Browser storage may be unavailable or full; keep the current session usable.
    }
  }, [cart, catalogLoading, loading, loadedFor, shippingDistrict, user?.id])

  const showToast = (message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  // Total quantity of a product across all its sizes/colors
  const getQuantity = (productId) =>
    cart.filter((entry) => entry.productId === String(productId)).reduce((total, entry) => total + entry.quantity, 0)

  const addToCart = (productId, quantity = 1, options = {}) => {
    if (loading || !user) {
      if (!loading) openAuthPrompt('Log in or sign up to add products to your cart.')
      return false
    }

    const { variantId, size, color } = options
    const product = products.find((item) => item.id === String(productId))
    const variant = product?.variants?.find((item) => item.id === variantId)
    if (!variant || quantity < 1 || quantity > variant.stock) {
      showToast('That size/color is out of stock')
      return false
    }
    const key = makeKey(productId, variantId, size, color)
    const currentQuantity = cart.find((entry) => entry.key === key)?.quantity || 0
    if (currentQuantity + quantity > variant.stock) {
      showToast('There is not enough stock for that size/color')
      return false
    }
    setCart((current) => {
      const existing = current.find((entry) => entry.key === key)
      if (existing) {
        return current.map((entry) =>
          entry.key === key ? { ...entry, quantity: entry.quantity + quantity } : entry,
        )
      }
      return [...current, { key, productId: String(productId), variantId, quantity, size, color }]
    })
    showToast('Added to cart')
    return true
  }

  const removeFromCart = (k) => {
    if (!user) return
    setCart((current) => current.filter((entry) => !matches(entry, k)))
    showToast('Removed from cart')
  }

  // Remove many lines at once (used by "Delete" in the cart page and after placing an order)
  const removeItems = (keys, silent = false) => {
    if (!user) return
    setCart((current) => current.filter((entry) => !keys.includes(entry.key)))
    if (!silent) showToast(keys.length > 1 ? 'Items removed from cart' : 'Removed from cart')
  }

  const updateQuantity = (k, quantity) => {
    if (!user) return
    if (quantity < 1) {
      removeFromCart(k)
      return
    }
    setCart((current) => current.map((entry) => (matches(entry, k) ? { ...entry, quantity } : entry)))
  }

  const clearCart = () => {
    if (user) setCart([])
  }

  const cartCount = cart.reduce((total, entry) => total + entry.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isLoadingCart,
        getQuantity,
        addToCart,
        removeFromCart,
        removeItems,
        updateQuantity,
        clearCart,
        shippingDistrict,
        setShippingDistrict,
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-charcoal text-cream text-sm font-medium px-5 py-3 rounded-full shadow-lg animate-toast-in">
          {toast}
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}