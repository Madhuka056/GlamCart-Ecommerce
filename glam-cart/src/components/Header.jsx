import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, User, Heart, ShoppingBag, Menu, X, LogOut, ClipboardList, LayoutDashboard } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { formatLkr, toLkr } from '../lib/currency'
import { useAuth } from '../context/AuthContext'
import { useAuthPrompt } from '../context/AuthPromptContext'
import { useCatalog } from '../context/CatalogContext'
import { useSiteContent } from '../context/SiteContentContext'
import logo from '../assets/Logo.png'

const getNavigationHref = ({ target, value }) => {
  if (target === 'home') return '/'
  if (target === 'category') return `/shop?category=${encodeURIComponent(value)}`
  if (target === 'tag') return `/shop?tag=${encodeURIComponent(value)}`
  if (target === 'about') return '/#about-us'
  return '/shop'
}

export default function Header({ onNavigate, isShopPage = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { wishlist } = useWishlist()
  const { cartCount } = useCart()
  const { user, loading, logout } = useAuth()
  const { products } = useCatalog()
  const { content } = useSiteContent()
  const { openAuthPrompt } = useAuthPrompt()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const lastY = useRef(0)
  const pendingAboutScroll = useRef(false)
  const searchRef = useRef(null)
  const accountRef = useRef(null)
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setScrolled(y > 0)

      if (y > lastY.current && y > 120) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (location.pathname !== '/' || !pendingAboutScroll.current) return
    pendingAboutScroll.current = false

    requestAnimationFrame(() => {
      document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [location.pathname])

  const trimmedQuery = searchQuery.trim().toLowerCase()

  const suggestions = trimmedQuery
    ? products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(trimmedQuery) ||
            product.category.toLowerCase().includes(trimmedQuery),
        )
        .slice(0, 6)
    : []

  const getSuggestionPath = (product) =>
    `/shop/products/${product.id}-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  const goToSuggestion = (product) => {
    navigate(getSuggestionPath(product))
    setSearchQuery('')
    setShowSuggestions(false)
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
    setShowSuggestions(false)
  }

  const scrollToAbsoluteTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    if (location.pathname === '/') {
      scrollToAbsoluteTop()
    } else {
      navigate('/')
      // wait for the home page to mount, then jump straight to the very top of the page
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        })
      })
    }
  }

  const goToAboutUs = () => {
    if (location.pathname === '/') {
      document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    pendingAboutScroll.current = true
    navigate('/')
  }

  const handleNavigation = (event, item) => {
    event.preventDefault()
    if (item.target === 'home') goHome()
    else if (item.target === 'about') goToAboutUs()
    else navigate(getNavigationHref(item))
  }

  const handleAccountClick = () => {
    if (user) {
      setAccountOpen((open) => !open)
    } else {
      openAuthPrompt()
    }
  }

  const handleProtectedNavigation = (event, message, path) => {
    if (user) return
    event.preventDefault()
    if (!loading) openAuthPrompt(message)
    else navigate(path)
  }

  const handleLogout = async () => {
    setAccountOpen(false)
    setMenuOpen(false)
    await logout()
  }

  return (
    <>
      <header
        className={`${scrolled ? 'fixed top-0 inset-x-0 shadow-sm' : 'relative'} z-50 bg-cream border-b border-cream-dark transition-transform duration-300 ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="relative w-full px-4 md:px-8 h-[76px] flex items-center justify-between">
          <Link
            to="/"
            onClick={(event) => {
              event.preventDefault()
              goHome()
            }}
            className="flex items-center gap-0 shrink-0"
          >
            <img src={content.brand.logoUrl || logo} alt="" className="block h-16 w-16 shrink-0 translate-y-1 object-contain mix-blend-multiply" />
            <span
              className="-ml-2 text-2xl font- tracking-tight"
              style={{ fontFamily: '"lora", serif' }}
            >
              {content.brand.name}
            </span>
          </Link>

          {!isShopPage && (
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-bold text-charcoal">
              {content.navigation.map((link, index) => (
              <a
                key={`${link.label}-${index}`}
                href={getNavigationHref(link)}
                onClick={(event) => handleNavigation(event, link)}
                className="hover:text-terracotta transition-colors"
              >
                {link.label}
              </a>
            ))}
            </nav>
          )}

          <div className={`flex items-center gap-5 text-charcoal ${isShopPage ? 'ml-auto' : ''}`}>
            <div ref={searchRef} className="relative hidden sm:block">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => {
                    if (searchQuery) setShowSuggestions(true)
                  }}
                  placeholder={content.brand.searchPlaceholder}
                  aria-label="Search products"
                  className="w-32 lg:w-52 bg-sand border border-cream-dark rounded-full px-4 py-2 text-sm text-ink placeholder:text-stone outline-none focus:border-terracotta transition-colors"
                />
                <button type="submit" aria-label="Search" className="hover:text-terracotta transition-colors shrink-0">
                  <Search size={19} strokeWidth={1.75} />
                </button>
              </form>

              {showSuggestions && trimmedQuery && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-cream border border-cream-dark rounded-xl shadow-lg overflow-hidden z-50">
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => goToSuggestion(product)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-sand transition-colors"
                    >
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm text-ink truncate">{product.name}</span>
                        <span className="block text-xs text-stone">
                          {product.category} · {formatLkr(product.priceLkr)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && trimmedQuery && suggestions.length === 0 && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-cream border border-cream-dark rounded-xl shadow-lg px-3 py-3 text-sm text-stone z-50">
                  No products found for "{searchQuery}"
                </div>
              )}
            </div>

            {/* Account: login modal (guest) or dropdown (logged in) */}
            <div ref={accountRef} className="relative">
              <button
                aria-label="Account"
                onClick={handleAccountClick}
                className="inline-flex items-center gap-2 h-8 hover:text-terracotta transition-colors"
              >
                <User size={19} strokeWidth={1.75} />
                {user && (
                  <span className="hidden xl:inline text-sm font-bold max-w-[110px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                )}
              </button>

              {user && accountOpen && (
                <div className="absolute right-0 top-full mt-3 w-60 bg-cream border border-cream-dark rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-cream-dark">
                    <p className="text-sm font-bold text-ink truncate">{user.name}</p>
                    <p className="text-xs text-stone truncate">{user.email}</p>
                  </div>
                  {user.role !== 'admin' && (
                  <Link
                    to="/order-history"
                    onClick={() => setAccountOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-charcoal hover:bg-sand hover:text-terracotta transition-colors"
                  >
                    <ClipboardList size={16} strokeWidth={1.75} />
                    Order History
                  </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setAccountOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-charcoal hover:bg-sand hover:text-terracotta transition-colors"
                    >
                      <LayoutDashboard size={16} strokeWidth={1.75} />
                      Admin dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-charcoal hover:bg-sand hover:text-terracotta transition-colors"
                  >
                    <LogOut size={16} strokeWidth={1.75} />
                    Log out
                  </button>
                </div>
              )}
            </div>
            {user?.role !== 'admin' && (
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              onClick={(event) => handleProtectedNavigation(event, 'Log in or sign up to view and manage your wishlist.', '/wishlist')}
              className="relative inline-flex hover:text-terracotta transition-colors"
            >
              <Heart size={19} strokeWidth={1.75} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-terracotta text-cream text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            )}

            {user?.role !== 'admin' && (
            <Link
              to="/cart"
              aria-label="Cart"
              onClick={(event) => handleProtectedNavigation(event, 'Log in or sign up to view and manage your cart.', '/cart')}
              className="relative hover:text-terracotta transition-colors"
            >
              <ShoppingBag size={19} strokeWidth={1.75} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-terracotta text-cream text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            )}
            {!isShopPage && (
              <button
                aria-label="Toggle menu"
                onClick={() => setMenuOpen((open) => !open)}
                className="lg:hidden hover:text-terracotta transition-colors"
              >
                {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav panel (only page links; wishlist/account are available as header icons) */}
        {!isShopPage && menuOpen && (
          <nav className="lg:hidden border-t border-cream-dark bg-cream px-6 py-4 flex flex-col gap-4 text-sm font-bold text-charcoal">
            {content.navigation.map((link, index) => (
              <a
                key={`${link.label}-${index}`}
                href={getNavigationHref(link)}
                onClick={(event) => {
                  handleNavigation(event, link)
                  setMenuOpen(false)
                }}
                className="hover:text-terracotta transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* Spacer to prevent content jump once the header becomes fixed */}
      {scrolled && <div className="h-[76px]" />}

    </>
  )
}
