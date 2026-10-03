import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useAuthPrompt } from './AuthPromptContext'

const CartContext = createContext(null)

// Same product with a different size/color is a separate cart line.
// Items added without options keep key = String(index), so old saved carts and old calls still work.
const makeKey = (index, size, color) => (size || color ? `${index}-${size || ''}-${color || ''}` : String(index))

const normalizeCart = (entries) =>
  Array.isArray(entries)
    ? entries.map((entry) => ({ ...entry, key: entry.key ?? makeKey(entry.index, entry.size, entry.color) }))
    : []

// k can be a line key (string) or, for older callers, a product index (number)
const matches = (entry, k) => entry.key === String(k) || (typeof k === 'number' && entry.index === k)

export function CartProvider({ children }) {
  const { user, loading } = useAuth()
  const { openAuthPrompt } = useAuthPrompt()
  const [cart, setCart] = useState([])
  const [shippingDistrict, setShippingDistrict] = useState('')
  const [loadedFor, setLoadedFor] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    if (loading) return

    const accountId = user?.id
    const storageKey = accountId ? String(accountId) : 'guest'

    try {
      const savedCart = accountId ? localStorage.getItem(`glamcart-cart:${accountId}`) : null
      const savedDistrict = accountId ? localStorage.getItem(`glamcart-district:${accountId}`) : null
      setCart(savedCart ? normalizeCart(JSON.parse(savedCart)) : [])
      setShippingDistrict(savedDistrict || '')
    } catch {
      setCart([])
      setShippingDistrict('')
    }
    setLoadedFor(storageKey)
  }, [loading, user?.id])

  useEffect(() => {
    if (loading || !user?.id || loadedFor !== String(user.id)) return

    try {
      localStorage.setItem(`glamcart-cart:${user.id}`, JSON.stringify(cart))
      localStorage.setItem(`glamcart-district:${user.id}`, shippingDistrict)
    } catch {
      // Browser storage may be unavailable or full; keep the current session usable.
    }
  }, [cart, loading, loadedFor, shippingDistrict, user?.id])

  const showToast = (message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  // Total quantity of a product across all its sizes/colors
  const getQuantity = (index) =>
    cart.filter((entry) => entry.index === index).reduce((total, entry) => total + entry.quantity, 0)

  const addToCart = (index, quantity = 1, options = {}) => {
    if (loading || !user) {
      if (!loading) openAuthPrompt('Log in or sign up to add products to your cart.')
      return false
    }

    const { size, color } = options
    const key = makeKey(index, size, color)
    setCart((current) => {
      const existing = current.find((entry) => entry.key === key)
      if (existing) {
        return current.map((entry) =>
          entry.key === key ? { ...entry, quantity: entry.quantity + quantity } : entry,
        )
      }
      return [...current, { key, index, quantity, size, color }]
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