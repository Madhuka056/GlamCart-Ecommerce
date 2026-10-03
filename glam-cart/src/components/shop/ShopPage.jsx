import { useState } from 'react'
import { Heart, SlidersHorizontal } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import menImage from '../../assets/categories/men.jpg'
import womenImage from '../../assets/categories/women.jpg'
import kidsImage from '../../assets/categories/kids.jpg'
import shoesImage from '../../assets/categories/shoes.jpg'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { formatLkr, toLkr } from '../../lib/currency'

export const products = [
  { name: 'Core Logo T-Shirt', category: 'Men', price: 30, tag: 'New', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500&auto=format&fit=crop' },
  { name: 'Linen Blend Dress', category: 'Women', price: 30, tag: 'New', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&auto=format&fit=crop' },
  { name: 'Linen Blend Shirt', category: 'Men', price: 30, tag: 'New', image: 'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?q=80&w=500&auto=format&fit=crop' },
  { name: 'Everyday Sneakers', category: 'Footwear', price: 30, tag: 'Sale', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=500&auto=format&fit=crop' },
  { name: 'Structured Handbag', category: 'Accessories', price: 30, tag: '', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=500&auto=format&fit=crop' },
  { name: 'Color Block Jacket', category: 'Men', price: 30, tag: '', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=500&auto=format&fit=crop' },
  { name: 'Classic Overshirt', category: 'Men', price: 20, tag: '', image: 'https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { name: 'Minimal Sunglasses', category: 'Accessories', price: 20, tag: '', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=500&auto=format&fit=crop' },
  { name: 'Core Logo T-Shirt', category: 'Men', price: 20, tag: '', image: 'https://images.unsplash.com/photo-1503341504253-dff99c4d4b8f?q=80&w=500&auto=format&fit=crop' },
  { name: 'Linen Blend Dress', category: 'Women', price: 30, tag: 'New', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=500&auto=format&fit=crop' },
  { name: 'Everyday Sneakers', category: 'Footwear', price: 30, tag: 'Sale', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=500&auto=format&fit=crop' },
  { name: 'Linen Logo T-Shirt', category: 'Men', price: 30, tag: '', image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=500&auto=format&fit=crop' },
  { name: 'Vintage Sunglasses', category: 'Accessories', price: 20, tag: '', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=500&auto=format&fit=crop' },
  { name: 'Linen Pleat Dress', category: 'Women', price: 19, tag: '', image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=500&auto=format&fit=crop' },
  { name: 'Linen Blend Jacket', category: 'Men', price: 30, tag: '', image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=500&auto=format&fit=crop' },
  { name: 'Relaxed Oxford Shirt', category: 'Men', price: 34, tag: 'New', image: 'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?q=80&w=500&auto=format&fit=crop' },
  { name: 'Everyday Tailored Trousers', category: 'Men', price: 42, tag: '', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=500&auto=format&fit=crop' },
  { name: 'Textured Knit Polo', category: 'Men', price: 28, tag: 'Sale', image: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?q=80&w=500&auto=format&fit=crop' },
  { name: 'Tailored Wool Coat', category: 'Men', price: 75, tag: '', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=500&auto=format&fit=crop' },
  { name: 'Classic Denim Shirt', category: 'Men', price: 36, tag: 'New', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=500&auto=format&fit=crop' },
  { name: 'Satin Summer Look', category: 'Women', price: 32, tag: 'New', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a13d27?q=80&w=500&auto=format&fit=crop' },
  { name: 'Ribbed Knit Top', category: 'Women', price: 18, tag: '', image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=500&auto=format&fit=crop' },
  { name: 'Wide Leg Trousers', category: 'Women', price: 39, tag: 'Sale', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=500&auto=format&fit=crop' },
  { name: 'Soft Knitwear', category: 'Women', price: 44, tag: '', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=500&auto=format&fit=crop' },
  { name: 'Evening Slip Dress', category: 'Women', price: 58, tag: 'New', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=500&auto=format&fit=crop' },
  { name: 'Kids Printed Hoodie', category: 'Kids', price: 22, tag: 'New', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500&auto=format&fit=crop' },
  { name: 'Kids Denim Overalls', category: 'Kids', price: 26, tag: '', image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=500&auto=format&fit=crop' },
  { name: 'Kids Summer Set', category: 'Kids', price: 19, tag: 'Sale', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=500&auto=format&fit=crop' },
  { name: 'Kids Cotton Dress', category: 'Kids', price: 24, tag: '', image: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?q=80&w=500&auto=format&fit=crop' },
  { name: 'Kids Canvas Sneakers', category: 'Kids', price: 29, tag: 'New', image: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=500&auto=format&fit=crop' },
  { name: 'Retro Runner Sneakers', category: 'Footwear', price: 52, tag: 'New', image: 'https://images.unsplash.com/photo-1549298916-f52d724204b4?q=80&w=500&auto=format&fit=crop' },
  { name: 'Leather Ankle Boots', category: 'Footwear', price: 68, tag: '', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=500&auto=format&fit=crop' },
  { name: 'Minimal Slide Sandals', category: 'Footwear', price: 24, tag: 'Sale', image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?q=80&w=500&auto=format&fit=crop' },
  { name: 'Classic Loafers', category: 'Footwear', price: 55, tag: '', image: 'https://images.unsplash.com/photo-1614252369475-531dfa835eb1?q=80&w=500&auto=format&fit=crop' },
  { name: 'Mini Crossbody Bag', category: 'Accessories', price: 35, tag: 'New', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=500&auto=format&fit=crop' },
  { name: 'Canvas Weekend Tote', category: 'Accessories', price: 27, tag: '', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=500&auto=format&fit=crop' },
  { name: 'Classic Leather Belt', category: 'Accessories', price: 16, tag: 'Sale', image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=500&auto=format&fit=crop' },
  { name: 'Gold Tone Watch', category: 'Accessories', price: 48, tag: 'New', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=500&auto=format&fit=crop' },
  { name: 'Hydrating Face Serum', category: 'Cosmetics', price: 21, tag: 'New', image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?q=80&w=500&auto=format&fit=crop' },
  { name: 'Everyday Lip Tint', category: 'Cosmetics', price: 14, tag: '', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=500&auto=format&fit=crop' },
  { name: 'Glow Body Lotion', category: 'Cosmetics', price: 18, tag: 'Sale', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=500&auto=format&fit=crop' },
  { name: 'Soft Matte Palette', category: 'Cosmetics', price: 33, tag: 'New', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=500&auto=format&fit=crop' },
]

const categories = ['Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Cosmetics']
const sizes = ['S', 'M', 'L', 'XL', 'XXL']
const categoryImages = {
  Men: menImage,
  Women: womenImage,
  Kids: kidsImage,
  Footwear: shoesImage,
  Accessories: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=500&auto=format&fit=crop',
  Cosmetics: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=500&auto=format&fit=crop',
}

export default function ShopPage() {
  const navigate = useNavigate()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const productsPerPage = 14
  const [maxPrice, setMaxPrice] = useState(toLkr(200))
  const [sortOption, setSortOption] = useState('Featured')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const requestedCategory = searchParams.get('category')
  const requestedTag = searchParams.get('tag')
  const requestedSearch = searchParams.get('search') || ''
  const selectedCategory = categories.includes(requestedCategory) ? requestedCategory : 'All'
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    const matchesTag = requestedTag === 'Sale' ? product.tag === 'Sale' : true
    const matchesSearch = requestedSearch
      ? product.name.toLowerCase().includes(requestedSearch.toLowerCase()) ||
        product.category.toLowerCase().includes(requestedSearch.toLowerCase())
      : true
    return matchesCategory && matchesTag && matchesSearch && toLkr(product.price) <= maxPrice
  })
  const sortedProducts = [...filteredProducts].sort((firstProduct, secondProduct) => {
    if (sortOption === 'Newest') return firstProduct.tag === 'New' ? -1 : secondProduct.tag === 'New' ? 1 : 0
    if (sortOption === 'Price: Low to High') return firstProduct.price - secondProduct.price
    if (sortOption === 'Price: High to Low') return secondProduct.price - firstProduct.price
    return 0
  })
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / productsPerPage))
  const firstProductIndex = (currentPage - 1) * productsPerPage
  const visibleProducts = sortedProducts.slice(firstProductIndex, firstProductIndex + productsPerPage)

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectCategory = (category) => {
    setSearchParams(category === 'All' ? {} : { category })
    setCurrentPage(1)
    setFiltersOpen(false)
  }

  const changeMaxPrice = (event) => {
    setMaxPrice(Number(event.target.value))
    setCurrentPage(1)
  }

  const changeSort = (event) => {
    setSortOption(event.target.value)
    setCurrentPage(1)
  }

  const getProductPath = (product) => {
    const productIndex = products.indexOf(product)
    return `/shop/products/${productIndex}-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  }

  return (
    <main className="w-full px-6 md:px-12 py-5 bg-[#f7f3ed] min-h-[calc(100vh-152px)]">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold mb-2">
            {requestedSearch ? 'Search results' : 'The collection'}
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-ink">
            {requestedSearch ? `"${requestedSearch}"` : 'Shop'}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-stone">
          Sort by:
          <select value={sortOption} onChange={changeSort} className="bg-sand border border-cream-dark rounded-lg px-3 py-2 text-sm text-ink outline-none">
            <option>Featured</option>
            <option>Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
          <button type="button" aria-label="Grid view" className="bg-charcoal text-cream p-2 rounded-md"><span aria-hidden="true">▦</span></button>
          <button type="button" aria-label="List view" className="border border-cream-dark text-ink p-2 rounded-md"><span aria-hidden="true">☷</span></button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFiltersOpen((open) => !open)}
        className="md:hidden inline-flex items-center gap-2 border border-cream-dark rounded-lg px-4 py-2 mb-5 text-sm text-ink"
      >
        <SlidersHorizontal size={16} />
        {filtersOpen ? 'Hide Filters' : 'Show Filters'}
      </button>

      <div className="grid md:grid-cols-[190px_minmax(0,1fr)] gap-5 items-start">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="border-b border-cream-dark pb-5 mb-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Categories</h2>
            <div className="space-y-3 text-sm text-ink">
              <button type="button" onClick={() => selectCategory('All')} className={`block transition-colors ${selectedCategory === 'All' ? 'text-terracotta font-semibold' : 'hover:text-terracotta'}`}>All Products</button>
              {categories.map((category) => <button type="button" key={category} onClick={() => selectCategory(category)} className={`block transition-colors ${selectedCategory === category ? 'text-terracotta font-semibold' : 'hover:text-terracotta'}`}>{category}</button>)}
            </div>
          </div>
          <div className="border-b border-cream-dark pb-5 mb-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Price Range</h2>
            <input type="range" min={toLkr(10)} max={toLkr(200)} value={maxPrice} onChange={changeMaxPrice} className="w-full accent-charcoal" aria-label="Maximum price" />
            <div className="flex justify-between mt-2 text-xs text-stone"><span>{formatLkr(toLkr(10))}</span><span>{formatLkr(maxPrice)}</span></div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink mb-4">Sizes</h2>
            <div className="flex flex-wrap gap-2">{sizes.map((size) => <button type="button" key={size} className="border border-cream-dark rounded-md px-2.5 py-1.5 text-xs hover:border-terracotta transition-colors">{size}</button>)}</div>
          </div>
          <div className="border-t border-cream-dark pt-5 mt-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Color Palettes</h2>
            <div className="flex flex-wrap gap-2">
              {['#191919', '#252d40', '#c9a977', '#a7b39e', '#eee7d8', '#df9682'].map((color) => <button type="button" key={color} aria-label={`Filter by ${color}`} className="w-7 h-7 rounded-md border border-black/10" style={{ backgroundColor: color }} />)}
            </div>
          </div>
        </aside>

        <div>
          <p className="text-sm text-stone mb-4">{filteredProducts.length} products</p>
          <div key={`${selectedCategory}-${maxPrice}-${currentPage}-${requestedSearch}`} className="shop-product-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-x-4 gap-y-7">
            {visibleProducts.map((product, index) => {
              const productIndex = products.indexOf(product)
              const wishlisted = isWishlisted(productIndex)
              return (
                <article
                  key={`${product.name}-${firstProductIndex + index}`}
                  role="link"
                  tabIndex="0"
                  onClick={() => navigate(getProductPath(product))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') navigate(getProductPath(product))
                  }}
                  className="group min-w-0 cursor-pointer rounded-2xl bg-sand p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:border-terracotta/50 hover:shadow-lg"
                >
                  <div className="relative rounded-xl overflow-hidden bg-cream-dark aspect-[3/4] mb-3">
                    {product.tag && <span className={`absolute top-3 left-3 z-10 ${product.tag === 'Sale' ? 'bg-terracotta' : 'bg-olive'} text-cream text-[10px] font-semibold tracking-wide px-2 py-1 rounded-full`}>{product.tag}</span>}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleWishlist(productIndex)
                      }}
                      aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                      className="absolute top-3 right-3 z-10 bg-cream/90 rounded-full p-1.5 text-charcoal hover:text-terracotta transition-colors"
                    >
                      <Heart size={14} className={wishlisted ? 'fill-terracotta text-terracotta' : ''} />
                    </button>
                    <img
                      src={product.image || categoryImages[product.category]}
                      alt={product.name}
                      onError={(event) => {
                        const fallback = categoryImages[product.category]
                        if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback
                      }}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm font-medium text-ink leading-tight">{product.name}</p>
                  <p className="text-sm text-stone mb-1.5">{formatLkr(toLkr(product.price))}</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      addToCart(productIndex)
                    }}
                    className="w-full bg-olive text-cream text-[15px] font-medium py-1.5 rounded-full hover:bg-ink transition-colors"
                  >
                    Add to Cart
                  </button>
                </article>
              )
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="py-16 text-center text-sm text-stone">
              No products found{requestedSearch ? ` for "${requestedSearch}"` : ' in this category yet'}.
            </div>
          )}
          <div className="flex items-center justify-between mt-8 text-sm text-stone">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} className="px-2 text-ink hover:text-terracotta disabled:opacity-40 disabled:pointer-events-none">&lt; Prev</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} onClick={() => goToPage(page)} className={`w-7 h-7 rounded-md ${page === currentPage ? 'bg-charcoal text-cream' : 'text-ink hover:bg-sand'}`}>{page}</button>)}
              <button type="button" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} className="px-2 text-ink hover:text-terracotta disabled:opacity-40 disabled:pointer-events-none">Next &gt;</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}