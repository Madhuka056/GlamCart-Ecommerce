import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import logo from './assets/Logo.png'
import TopBar from './components/TopBar'
import Header from './components/Header'
import Hero from './components/Hero'
import ServiceFeatures from './components/ServiceFeatures'
import Categories from './components/Categories'
import FeaturedProducts from './components/FeaturedProducts'
import PromoBanners from './components/PromoBanners'
import WhyChooseUs from './components/WhyChooseUs'
import Newsletter from './components/Newsletter'
import Footer from './components/Footer'
import Reveal from './components/Reveal'
import ShopPage from './components/shop/ShopPage'
import ProductDetailPage from './components/shop/ProductDetailPage'
import WishlistPage from './components/shop/WishlistPage'
import CartPage from './components/shop/CartPage'
import CheckoutPage from './components/shop/CheckoutPage'
import OrderSuccessPage from './components/shop/OrderSuccessPage'
import OrderHistoryPage from './components/shop/OrderHistoryPage'
import AboutUs from './components/AboutUs'
import { WishlistProvider } from './context/WishlistContext'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { AuthPromptProvider } from './context/AuthPromptContext'
import AuthRequired from './components/AuthRequired'

export default function App() {
  const { pathname } = useLocation()
  const isShopPage = pathname.startsWith('/shop')

  return (
    <AuthProvider>
      <AuthPromptProvider>
        <WishlistProvider>
          <CartProvider>
            <div className="min-h-screen bg-cream">
              <ScrollToTop />
              <PageLoadingScreen />
              <TopBar compact={isShopPage} />
              <Header isShopPage={isShopPage} />
              <Routes>
                <Route path="/shop/products/:productId" element={<ProductDetailPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/wishlist" element={<AuthRequired message="Log in or sign up to view and manage your wishlist."><WishlistPage /></AuthRequired>} />
                <Route path="/cart" element={<AuthRequired message="Log in or sign up to view and manage your cart."><CartPage /></AuthRequired>} />
                <Route path="/checkout" element={<AuthRequired message="Log in or sign up to check out."><CheckoutPage /></AuthRequired>} />
                <Route path="/order-history" element={<AuthRequired message="Log in or sign up to view your order history."><OrderHistoryPage /></AuthRequired>} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
              <Footer />
            </div>
          </CartProvider>
        </WishlistProvider>
      </AuthPromptProvider>
    </AuthProvider>
  )
}

function PageLoadingScreen() {
  const { pathname, search } = useLocation()
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    setVisible(true)
    setExiting(false)

    const exitTimer = window.setTimeout(() => setExiting(true), 360)
    const hideTimer = window.setTimeout(() => setVisible(false), 540)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
    }
  }, [pathname, search])

  if (!visible) return null

  return (
    <div
      className={`page-loading-screen${exiting ? ' page-loading-screen-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Glam Cart"
    >
      <div className="page-loading-content">
        <img src={logo} alt="Glam Cart" className="page-loading-logo" />
        <p className="page-loading-brand">Glam Cart</p>
        <p className="page-loading-label">Loading your experience</p>
        <div className="page-loading-track" aria-hidden="true">
          <div className="page-loading-progress" />
        </div>
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])

  return null
}

function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <Reveal><ServiceFeatures /></Reveal>
        <Reveal delay={80}><Categories /></Reveal>
        <Reveal delay={120}><FeaturedProducts /></Reveal>
        <Reveal delay={80}><PromoBanners /></Reveal>
        <Reveal delay={100}><AboutUs /></Reveal>
        <Reveal><WhyChooseUs /></Reveal>
      </main>
      <Reveal><Newsletter /></Reveal>
    </>
  )
}