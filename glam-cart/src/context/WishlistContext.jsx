import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useAuthPrompt } from './AuthPromptContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user, loading } = useAuth()
  const { openAuthPrompt } = useAuthPrompt()
  const [wishlist, setWishlist] = useState([])
  const [loadedFor, setLoadedFor] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    if (loading) return

    const accountId = user?.id
    const storageKey = accountId ? String(accountId) : 'guest'

    try {
      const savedWishlist = accountId ? localStorage.getItem(`glamcart-wishlist:${accountId}`) : null
      const parsedWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      setWishlist(Array.isArray(parsedWishlist) ? parsedWishlist : [])
    } catch {
      setWishlist([])
    }
    setLoadedFor(storageKey)
  }, [loading, user?.id])

  useEffect(() => {
    if (loading || !user?.id || loadedFor !== String(user.id)) return

    try {
      localStorage.setItem(`glamcart-wishlist:${user.id}`, JSON.stringify(wishlist))
    } catch {
      // Browser storage may be unavailable or full; keep the current session usable.
    }
  }, [loading, loadedFor, user?.id, wishlist])

  const showToast = (message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  const isWishlisted = (index) => wishlist.includes(index)

  const toggleWishlist = (index) => {
    if (loading || !user) {
      if (!loading) openAuthPrompt('Log in or sign up to save products to your wishlist.')
      return false
    }

    setWishlist((current) => {
      const alreadyIn = current.includes(index)
      showToast(alreadyIn ? 'Removed from wishlist' : 'Added to wishlist')
      return alreadyIn ? current.filter((item) => item !== index) : [...current, index]
    })
    return true
  }

  const removeFromWishlist = (index) => {
    if (!user) return
    setWishlist((current) => current.filter((item) => item !== index))
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