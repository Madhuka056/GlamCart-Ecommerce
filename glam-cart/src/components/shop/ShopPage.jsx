import { useState } from 'react'
import { Heart, SlidersHorizontal } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import menImage from '../../assets/categories/men.jpg'
import womenImage from '../../assets/categories/women.jpg'
import kidsImage from '../../assets/categories/kids.jpg'
import shoesImage from '../../assets/categories/shoes.jpg'
import { useWishlist } from '../../context/WishlistContext'
import { useCatalog } from '../../context/CatalogContext'
import { formatLkr, toLkr } from '../../lib/currency'
import { useSiteContent } from '../../context/SiteContentContext'

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
  const { products, loading, error } = useCatalog()
  const { content } = useSiteContent()
  const shopUi = content.shopUi
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [searchParams, setSearchParams] = useSearchParams()
  const productsPerPage = 14
  const categories = content.categories.map((category) => category.label)
  const [maxPrice, setMaxPrice] = useState(toLkr(200))
  const [sortOption, setSortOption] = useState('Featured')
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
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
    const matchesOptions = !selectedSizes.length && !selectedColors.length
      ? true
      : product.variants?.some((variant) =>
          (!selectedSizes.length || selectedSizes.includes(variant.size)) &&
          (!selectedColors.length || selectedColors.includes(variant.colorValue)),
        )
    return matchesCategory && matchesTag && matchesSearch && product.priceLkr <= maxPrice && matchesOptions
  })
  const sortedProducts = [...filteredProducts].sort((firstProduct, secondProduct) => {
    if (sortOption === 'Newest') return firstProduct.tag === 'New' ? -1 : secondProduct.tag === 'New' ? 1 : 0
    if (sortOption === 'Price: Low to High') return firstProduct.priceLkr - secondProduct.priceLkr
    if (sortOption === 'Price: High to Low') return secondProduct.priceLkr - firstProduct.priceLkr
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
  const toggleFilterValue = (current, setCurrent, value) => {
    setCurrent(current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value])
    setCurrentPage(1)
  }
  const availableSizes = [...new Set(products.flatMap((product) => product.variants?.map((variant) => variant.size).filter(Boolean) || []))]
  const availableColors = [...new Map(products.flatMap((product) => product.variants || [])
    .filter((variant) => variant.color && variant.colorValue)
    .map((variant) => [variant.colorValue, variant])).values()]

  const changeMaxPrice = (event) => {
    setMaxPrice(Number(event.target.value))
    setCurrentPage(1)
  }

  const changeSort = (event) => {
    setSortOption(event.target.value)
    setCurrentPage(1)
  }

  const getProductPath = (product) => {
    return `/shop/products/${product.id}-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  }

  return (
    <main className="w-full px-6 md:px-12 py-5 bg-[#f7f3ed] min-h-[calc(100vh-152px)]">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold mb-2">
            {requestedSearch ? shopUi.searchResultsLabel : shopUi.collectionLabel}
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-ink">
            {requestedSearch ? `"${requestedSearch}"` : shopUi.shopTitle}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-stone">
          {shopUi.sortLabel}
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
            <h2 className="text-sm font-semibold text-ink mb-4">{shopUi.categoriesLabel}</h2>
            <div className="space-y-3 text-sm text-ink">
              <button type="button" onClick={() => selectCategory('All')} className={`block transition-colors ${selectedCategory === 'All' ? 'text-terracotta font-semibold' : 'hover:text-terracotta'}`}>{shopUi.allProductsLabel}</button>
              {categories.map((category) => <button type="button" key={category} onClick={() => selectCategory(category)} className={`block transition-colors ${selectedCategory === category ? 'text-terracotta font-semibold' : 'hover:text-terracotta'}`}>{category}</button>)}
            </div>
          </div>
          <div className="border-b border-cream-dark pb-5 mb-5">
            <h2 className="text-sm font-semibold text-ink mb-4">{shopUi.priceRangeLabel}</h2>
            <input type="range" min={toLkr(10)} max={toLkr(200)} value={maxPrice} onChange={changeMaxPrice} className="w-full accent-charcoal" aria-label="Maximum price" />
            <div className="flex justify-between mt-2 text-xs text-stone"><span>{formatLkr(toLkr(10))}</span><span>{formatLkr(maxPrice)}</span></div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink mb-4">{shopUi.sizesLabel}</h2>
            <div className="flex flex-wrap gap-2">{(availableSizes.length ? availableSizes : sizes).map((size) => <button type="button" key={size} aria-pressed={selectedSizes.includes(size)} onClick={() => toggleFilterValue(selectedSizes, setSelectedSizes, size)} className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${selectedSizes.includes(size) ? 'border-charcoal bg-charcoal text-cream' : 'border-cream-dark hover:border-terracotta'}`}>{size}</button>)}</div>
          </div>
        </aside>

        <div>
          {error && <p role="alert" className="mb-4 rounded-xl border border-terracotta/30 bg-cream px-4 py-3 text-sm text-terracotta">{error}</p>}
          <p className="text-sm text-stone mb-4">{filteredProducts.length} {shopUi.productsSuffix}</p>
          <div key={`${selectedCategory}-${maxPrice}-${currentPage}-${requestedSearch}`} className="shop-product-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-x-4 gap-y-7">
            {visibleProducts.map((product, index) => {
              const wishlisted = isWishlisted(product.id)
              return (
                <article
                  key={product.id}
                  role="link"
                  tabIndex="0"
                  onClick={() => navigate(getProductPath(product))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') navigate(getProductPath(product))
                  }}
                  className="group min-w-0 cursor-pointer rounded-2xl bg-sand p-3 shadow-sm transition-all duration-300 ohover:-translate-y-1 hover:scale-[1.04] hover:border-terracotta/50 hover:shadow-lg"
                >
                  <div className="relative rounded-xl overflow-hidden bg-cream-dark aspect-[3/4] mb-3">
                    {product.tag && <span className={`absolute top-3 left-3 z-10 ${product.tag === 'Sale' ? 'bg-terracotta' : 'bg-olive'} text-cream text-[10px] font-semibold tracking-wide px-2 py-1 rounded-full`}>{product.tag}</span>}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleWishlist(product.id)
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
                  <p className="text-sm text-stone mb-1.5">{formatLkr(product.priceLkr)}</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(getProductPath(product))
                    }}
                    disabled={product.stock < 1}
                    className="w-full bg-olive text-cream text-[15px] font-medium py-1.5 rounded-full hover:bg-ink transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </article>
              )
            })}
          </div>
          {!loading && filteredProducts.length === 0 && (
            <div className="py-16 text-center text-sm text-stone">
              {shopUi.noProductsLabel}{requestedSearch ? ` for "${requestedSearch}"` : ' in this category yet'}.
            </div>
          )}
          {!loading && filteredProducts.length > 0 && <div className="flex items-center justify-between mt-8 text-sm text-stone">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} className="px-2 text-ink hover:text-terracotta disabled:opacity-40 disabled:pointer-events-none">&lt; Prev</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} onClick={() => goToPage(page)} className={`w-7 h-7 rounded-md ${page === currentPage ? 'bg-charcoal text-cream' : 'text-ink hover:bg-sand'}`}>{page}</button>)}
              <button type="button" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} className="px-2 text-ink hover:text-terracotta disabled:opacity-40 disabled:pointer-events-none">Next &gt;</button>
            </div>
          </div>}
            {loading && <p role="status" className="py-16 text-center text-sm text-stone">{shopUi.loadingLabel}</p>}
          </div>
        </div>
    </main>
  )
}