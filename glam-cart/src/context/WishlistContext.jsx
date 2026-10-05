import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useAuthPrompt } from './AuthPromptContext'
import { useCatalog } from './CatalogContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user, loading } = useAuth()
  const { products, loading: catalogLoading } = useCatalog()
  const { openAuthPrompt } = useAuthPrompt()
  const [wishlist, setWishlist] = useState([])
  const [loadedFor, setLoadedFor] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    if (loading || catalogLoading) return

    const accountId = user?.id
    const storageKey = accountId ? String(accountId) : 'guest'

    try {
      const savedWishlist = accountId ? localStorage.getItem(`glamcart-wishlist:${accountId}`) : null
      const parsedWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      setWishlist(
        Array.isArray(parsedWishlist)
          ? parsedWishlist.map((entry) => {
              if (typeof entry === 'string') return entry
              return products.find((product) => product.legacyIndex === entry)?.id
            }).filter(Boolean)
          : [],
      )
    } catch {
      setWishlist([])
    }
    setLoadedFor(storageKey)
  }, [catalogLoading, loading, products, user?.id])

  useEffect(() => {
    if (loading || !user?.id || loadedFor !== String(user.id)) return

    try {
      localStorage.setItem(`glamcart-wishlist:${user.id}`, JSON.stringify(wishlist))
    } catch {
      // Browser storage may be unavailable or full; keep the current session usable.
    }
  }, [catalogLoading, loading, loadedFor, user?.id, wishlist])

  const showToast = (message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  const isWishlisted = (productId) => wishlist.includes(String(productId))

  const toggleWishlist = (productId) => {
    if (loading || !user) {
      if (!loading) openAuthPrompt('Log in or sign up to save products to your wishlist.')
      return false
    }

    const normalizedId = String(productId)
    setWishlist((current) => {
      const alreadyIn = current.includes(normalizedId)
      showToast(alreadyIn ? 'Removed from wishlist' : 'Added to wishlist')
      return alreadyIn ? current.filter((item) => item !== normalizedId) : [...current, normalizedId]
    })
    return true
  }

  const removeFromWishlist = (productId) => {
    if (!user) return
    setWishlist((current) => current.filter((item) => item !== String(productId)))
    showToast('Removed from wishlist')
  }

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, removeFromWishlist }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-charcoal text-cream text-sm font-medium px-5 py-3 rounded-full shadow-lg animate-toast-in">
          {toast}
        </div>
      )}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider')
  return context
}