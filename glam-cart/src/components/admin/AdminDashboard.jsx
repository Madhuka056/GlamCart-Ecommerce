import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Boxes, ClipboardList, Globe, LoaderCircle, Plus, RefreshCw, TicketPercent, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../context/CatalogContext'
import { apiRequest, uploadImage } from '../../lib/api'
import { formatLkr } from '../../lib/currency'
import { useSiteContent } from '../../context/SiteContentContext'
import SiteContentEditor from './SiteContentEditor'
import ImageUploadField from './ImageUploadField'

const tabs = [
  { id: 'overview', label: 'Overview', icon: Boxes },
  { id: 'products', label: 'Products & stock', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'vouchers', label: 'Vouchers', icon: TicketPercent },
  { id: 'website', label: 'Website content', icon: Globe },
]

const statuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled']
const inputClass = 'w-full rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-terracotta'
const emptyProduct = {
  name: '',
  category: 'Men',
  priceLkr: '',
  tag: '',
  image: '',
  galleryImagesText: '',
  description: '',
  fabricAndCare: '',
  variants: [{ size: '', color: '', colorValue: '#d6c8b4', stock: 0, active: true }],
  active: true,
}
const emptyVoucher = { code: '', type: 'percent', value: '', active: true, expiresAt: '' }

function Notice({ children, error = false }) {
  if (!children) return null
  return <p role={error ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-olive/10 text-olive'}`}>{children}</p>
}

function ImageUploadPicker({ disabled, onSelect }) {
  return (
    <input
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      multiple
      disabled={disabled}
      className="sr-only"
      onChange={(event) => {
        const files = Array.from(event.target.files || [])
        event.target.value = ''
        if (files.length) onSelect(files)
      }}
    />
  )
}

function Metric({ label, value, detail }) {
  return (
    <article className="rounded-2xl border border-cream-dark bg-white p-5">
      <p className="text-sm text-stone">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      <p className="mt-1 text-xs text-stone">{detail}</p>
    </article>
  )
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const { refreshProducts } = useCatalog()
  const { setContent: setPublicContent } = useSiteContent()
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [websiteContent, setWebsiteContent] = useState(null)
  const [websiteDefaults, setWebsiteDefaults] = useState(null)
  const [uploadingWebsiteImage, setUploadingWebsiteImage] = useState(false)
  const websiteImageUploadCount = useRef(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [productForm, setProductForm] = useState(null)
  const [voucherForm, setVoucherForm] = useState(null)

  const onWebsiteImageUpload = useCallback((change) => {
    websiteImageUploadCount.current = Math.max(0, websiteImageUploadCount.current + (change ? 1 : -1))
    setUploadingWebsiteImage(websiteImageUploadCount.current > 0)
  }, [])

  const loadDashboard = useCallback(async () => {
    setError('')
    try {
      const [summaryData, productData, orderData, customerData, voucherData, contentData] = await Promise.all([
        apiRequest('/admin/dashboard'),
        apiRequest('/admin/products'),
        apiRequest('/admin/orders'),
        apiRequest('/admin/customers'),
        apiRequest('/admin/vouchers'),
        apiRequest('/admin/site-content'),
      ])
      setSummary(summaryData.summary)
      setProducts(productData.products)
      setOrders(orderData.orders)
      setCustomers(customerData.customers)
      setVouchers(voucherData.vouchers)
      setWebsiteContent(contentData.content)
      setWebsiteDefaults(contentData.defaults)
    } catch (requestError) {
      setError(requestError.message || 'The admin dashboard could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveWebsiteContent = async () => {
    setBusy(true)
    setError('')
    try {
      const data = await apiRequest('/admin/site-content', {
        method: 'PUT',
        body: JSON.stringify({ content: websiteContent }),
      })
      setWebsiteContent(data.content)
      setPublicContent(data.content)
      report('Website content saved and published.')
    } catch (requestError) {
      setError(requestError.message || 'Website content could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const resetWebsiteContent = async () => {
    if (!window.confirm('Restore all website text, links and images to their original defaults? Products, orders and vouchers will not change.')) return
    setBusy(true)
    setError('')
    try {
      const data = await apiRequest('/admin/site-content/reset', { method: 'POST' })
      setWebsiteContent(data.content)
      setPublicContent(data.content)
      report('Website content restored to defaults.')
    } catch (requestError) {
      setError(requestError.message || 'Website content could not be reset.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') loadDashboard()
  }, [loadDashboard, user?.role])

  const report = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    if (!productForm.image) {
      setError('Choose a main product image before saving.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const editing = Boolean(productForm.id)
      const { galleryImagesText, ...formValues } = productForm
      const data = await apiRequest(editing ? `/admin/products/${productForm.id}` : '/admin/products', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...formValues,
          images: galleryImagesText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
          priceLkr: Number(productForm.priceLkr),
          variants: productForm.variants.map((variant) => ({ ...variant, stock: Number(variant.stock) })),
        }),
      })
      setProducts((current) => editing
        ? current.map((item) => item.id === data.product.id ? data.product : item)
        : [data.product, ...current])
      setProductForm(null)
      await refreshProducts()
      report(editing ? 'Product updated.' : 'Product added.')
    } catch (requestError) {
      setError(requestError.message || 'Product could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const archiveProduct = async (product) => {
    if (!window.confirm(`Remove ${product.name} from the shop?`)) return
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/admin/products/${product.id}`, { method: 'DELETE' })
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, active: false } : item))
      await refreshProducts()
      report('Product removed from the shop. Its previous orders are preserved.')
    } catch (requestError) {
      setError(requestError.message || 'Product could not be removed.')
    } finally {
      setBusy(false)
    }
  }

  const saveVoucher = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const editing = Boolean(voucherForm.id)
      const data = await apiRequest(editing ? `/admin/vouchers/${voucherForm.id}` : '/admin/vouchers', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...voucherForm,
          value: Number(voucherForm.value),
          expiresAt: voucherForm.expiresAt || null,
        }),
      })
      setVouchers((current) => editing
        ? current.map((voucher) => voucher.id === data.voucher.id ? data.voucher : voucher)
        : [data.voucher, ...current])
      setVoucherForm(null)
      report(editing ? 'Voucher updated.' : 'Voucher created.')
    } catch (requestError) {
      setError(requestError.message || 'Voucher could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const removeVoucher = async (voucher) => {
    if (!window.confirm(`Delete voucher ${voucher.code}?`)) return
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/admin/vouchers/${voucher.id}`, { method: 'DELETE' })
      setVouchers((current) => current.filter((item) => item.id !== voucher.id))
      report('Voucher deleted.')
    } catch (requestError) {
      setError(requestError.message || 'Voucher could not be deleted.')
    } finally {
      setBusy(false)
    }
  }

  const changeOrderStatus = async (order, status) => {
    if (
      status === 'cancelled' &&
      !window.confirm(`Cancel ${order.id}? Any refund for a paid order must be processed separately in PayHere.`)
    ) return

    setBusy(true)
    setError('')
    try {
      const data = await apiRequest(`/admin/orders/${order.orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, confirmCancellation: status === 'cancelled' }),
      })
      setOrders((current) => current.map((item) => item.orderId === order.orderId ? data.order : item))
      await loadDashboard()
      report(`Order ${order.id} updated to ${status}.`)
    } catch (requestError) {
      setError(requestError.message || 'Order status could not be updated.')
    } finally {
      setBusy(false)
    }
  }

  if (authLoading) return <main className="min-h-[60vh] flex items-center justify-center bg-[#f7f3ed]"><p role="status" className="text-sm text-stone">Checking admin access...</p></main>
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  return (
    <main className="min-h-[calc(100vh-152px)] bg-[#f7f3ed] px-4 py-7 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="mb-3 inline-flex items-center gap-2 text-xs text-stone hover:text-terracotta"><ArrowLeft size={14} /> Back to shop</Link>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">Glam Cart</p>
            <h1 className="font-display text-3xl text-ink md:text-4xl">Admin dashboard</h1>
          </div>
          <button type="button" onClick={loadDashboard} className="inline-flex items-center gap-2 rounded-full border border-cream-dark bg-white px-4 py-2 text-sm text-ink hover:border-charcoal"><RefreshCw size={15} /> Refresh</button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto rounded-2xl bg-sand p-2 lg:flex-col lg:self-start">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ${tab === id ? 'bg-charcoal font-semibold text-cream' : 'text-ink hover:bg-cream'}`}>
                <Icon size={17} /> {label}
              </button>
            ))}
          </nav>

          <section className="min-w-0 rounded-2xl bg-sand p-4 md:p-6">
            {error && <div className="mb-4"><Notice error>{error}</Notice></div>}
            {notice && <div className="mb-4"><Notice>{notice}</Notice></div>}

            {loading ? (
              <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-stone"><LoaderCircle size={18} className="animate-spin" /> Loading dashboard...</div>
            ) : (
              <>
                {tab === 'overview' && <Overview summary={summary} orders={orders} onTab={setTab} />}
                {tab === 'products' && (
                  <ProductsPanel
                    products={products}
                    busy={busy}
                    onAdd={() => setProductForm({ ...emptyProduct })}
                    onEdit={(product) => setProductForm({
                      ...product,
                      galleryImagesText: (product.images || []).join('\n'),
                      fabricAndCare: product.fabricAndCare || '',
                      variants: product.variants?.length
                        ? product.variants.map((variant) => ({ ...variant }))
                        : [{ size: '', color: '', colorValue: '#d6c8b4', stock: product.stock || 0, active: true }],
                    })}
                    onRemove={archiveProduct}
                  />
                )}
                {tab === 'orders' && <OrdersPanel orders={orders} busy={busy} onStatusChange={changeOrderStatus} />}
                {tab === 'customers' && <CustomersPanel customers={customers} />}
                {tab === 'website' && (websiteContent ? (
                  <>
                                <SiteContentEditor content={websiteContent} onChange={setWebsiteContent} onUploadingChange={onWebsiteImageUpload} />
                    <div className="mt-5 flex flex-wrap justify-end gap-3">
                          <button type="button" disabled={busy || uploadingWebsiteImage} onClick={resetWebsiteContent} className="rounded-full border border-cream-dark bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-charcoal disabled:opacity-50">Restore defaults</button>
                          <button type="button" disabled={busy || uploadingWebsiteImage} onClick={saveWebsiteContent} className="rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ink disabled:opacity-50">{uploadingWebsiteImage ? 'Uploading image...' : busy ? 'Saving...' : 'Save and publish'}</button>
                    </div>
                  </>
                ) : <p role="status" className="py-10 text-center text-sm text-stone">Loading website content...</p>)}
                {tab === 'vouchers' && (
                  <VouchersPanel
                    vouchers={vouchers}
                    onAdd={() => setVoucherForm({ ...emptyVoucher })}
                    onEdit={(voucher) => setVoucherForm({
                      ...voucher,
                      expiresAt: voucher.expiresAt ? new Date(voucher.expiresAt).toISOString().slice(0, 10) : '',
                    })}
                    onRemove={removeVoucher}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {productForm && (
        <Modal title={productForm.id ? 'Edit product' : 'Add product'} onClose={() => setProductForm(null)}>
          <form onSubmit={saveProduct} className="space-y-4">
            {error && <Notice error>{error}</Notice>}
            <label className="block text-sm text-stone">Product name<input required maxLength={120} className={`${inputClass} mt-1`} value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-stone">Category<input required maxLength={60} className={`${inputClass} mt-1`} value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} /></label>
              <label className="block text-sm text-stone">Price (LKR)<input required min="1" step="1" type="number" className={`${inputClass} mt-1`} value={productForm.priceLkr} onChange={(event) => setProductForm({ ...productForm, priceLkr: event.target.value })} /></label>
              <label className="block text-sm text-stone">Stock<input required min="0" step="1" type="number" className={`${inputClass} mt-1`} value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} /></label>
              <label className="block text-sm text-stone">Product label<select className={`${inputClass} mt-1`} value={productForm.tag} onChange={(event) => setProductForm({ ...productForm, tag: event.target.value })}><option value="">No label</option><option value="New">New</option><option value="Sale">Sale</option></select></label>
            </div>
            <ImageUploadField label="Main product image" value={productForm.image} disabled={busy} onUploadingChange={setBusy} onChange={(image) => setProductForm((current) => ({ ...current, image }))} />
            <div className="space-y-2">
              <label className="block text-sm text-stone">Additional product images</label>
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-ink hover:border-terracotta ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                <ImageUploadPicker
                  disabled={busy}
                  onSelect={async (files) => {
                    const currentImages = productForm.galleryImagesText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean)
                    if (currentImages.length + files.length > 8) {
                      setError('Add no more than 8 gallery images.')
                      return
                    }
                    setBusy(true)
                    setError('')
                    try {
                      const uploadedImages = await Promise.all(files.map(uploadImage))
                      setProductForm((current) => ({
                        ...current,
                        galleryImagesText: [...current.galleryImagesText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean), ...uploadedImages].join('\n'),
                      }))
                    } catch (uploadError) {
                      setError(uploadError.message || 'Gallery image upload failed.')
                    } finally {
                      setBusy(false)
                    }
                  }}
                />
                <Plus size={16} /> Add gallery images
              </label>
              <p className="text-xs text-stone">Choose up to 8 images. JPEG, PNG, GIF or WebP; maximum 5 MB each.</p>
              {productForm.galleryImagesText && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {productForm.galleryImagesText.split(/\r?\n/).filter(Boolean).map((image, index) => (
                    <div key={`${image}-${index}`} className="relative">
                      <img src={image} alt={`Product gallery ${index + 1}`} className="h-24 w-full rounded-lg border border-cream-dark bg-white object-cover" />
                      <button type="button" aria-label={`Remove gallery image ${index + 1}`} onClick={() => setProductForm((current) => ({ ...current, galleryImagesText: current.galleryImagesText.split(/\r?\n/).filter((_, imageIndex) => imageIndex !== index).join('\n') }))} className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-1 text-xs text-terracotta">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="block text-sm text-stone">Product description<textarea maxLength={2000} rows="4" className={`${inputClass} mt-1`} value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label>
            <label className="block text-sm text-stone">Fabric & care information<textarea maxLength={2000} rows="3" className={`${inputClass} mt-1`} value={productForm.fabricAndCare} onChange={(event) => setProductForm({ ...productForm, fabricAndCare: event.target.value })} /></label>
            <fieldset className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <legend className="text-sm font-semibold text-ink">Size/color variants and stock</legend>
                <button type="button" onClick={() => setProductForm((current) => ({ ...current, variants: [...current.variants, { size: '', color: '', colorValue: '#d6c8b4', stock: 0, active: true }] }))} className="text-sm font-semibold text-terracotta hover:underline">Add variant</button>
              </div>
              <p className="text-xs text-stone">Each size/color combination has its own inventory. Leave size or color blank when it does not apply.</p>
              {productForm.variants.map((variant, index) => (
                <div key={variant.id || `variant-${index}`} className={`grid gap-2 rounded-xl border border-cream-dark bg-white p-3 sm:grid-cols-[1fr_1fr_52px_100px_auto] ${variant.active ? '' : 'opacity-60'}`}>
                  <label className="text-xs text-stone">Size<input maxLength={20} className={`${inputClass} mt-1`} value={variant.size} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, size: event.target.value } : item) }))} /></label>
                  <label className="text-xs text-stone">Color<input maxLength={40} className={`${inputClass} mt-1`} value={variant.color} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item) }))} /></label>
                  <label className="text-xs text-stone">Swatch<input aria-label="Variant swatch color" type="color" className="mt-1 h-[42px] w-full rounded-lg border border-cream-dark bg-white p-1" value={variant.colorValue || '#d6c8b4'} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, colorValue: event.target.value } : item) }))} /></label>
                  <label className="text-xs text-stone">Stock<input required min="0" step="1" type="number" className={`${inputClass} mt-1`} value={variant.stock} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, stock: event.target.value } : item) }))} /></label>
                  <button type="button" onClick={() => setProductForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, active: !item.active } : item) }))} className="self-end rounded-md border border-cream-dark px-2 py-2 text-xs font-semibold text-ink">{variant.active ? 'Disable' : 'Enable'}</button>
                </div>
              ))}
            </fieldset>
            {productForm.id && !productForm.active && <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={productForm.active} onChange={(event) => setProductForm({ ...productForm, active: event.target.checked })} /> Restore this product to the shop</label>}
            <FormActions busy={busy} onCancel={() => setProductForm(null)} />
          </form>
        </Modal>
      )}

      {voucherForm && (
        <Modal title={voucherForm.id ? 'Edit voucher' : 'Add voucher'} onClose={() => setVoucherForm(null)}>
          <form onSubmit={saveVoucher} className="space-y-4">
            <label className="block text-sm text-stone">Voucher code<input required maxLength={40} pattern="[A-Za-z0-9_-]{3,40}" className={`${inputClass} mt-1 uppercase`} value={voucherForm.code} onChange={(event) => setVoucherForm({ ...voucherForm, code: event.target.value.toUpperCase() })} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-stone">Discount type<select className={`${inputClass} mt-1`} value={voucherForm.type} onChange={(event) => setVoucherForm({ ...voucherForm, type: event.target.value })}><option value="percent">Percentage</option><option value="amount">Fixed LKR</option></select></label>
              <label className="block text-sm text-stone">Value{voucherForm.type === 'amount' ? ' (LKR)' : ' (%)'}<input required min="1" max={voucherForm.type === 'percent' ? 100 : undefined} step="1" type="number" className={`${inputClass} mt-1`} value={voucherForm.value} onChange={(event) => setVoucherForm({ ...voucherForm, value: event.target.value })} /></label>
            </div>
            <label className="block text-sm text-stone">Expiry date (optional)<input type="date" className={`${inputClass} mt-1`} value={voucherForm.expiresAt || ''} onChange={(event) => setVoucherForm({ ...voucherForm, expiresAt: event.target.value })} /></label>
            <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={voucherForm.active} onChange={(event) => setVoucherForm({ ...voucherForm, active: event.target.checked })} /> Voucher is active</label>
            <FormActions busy={busy} onCancel={() => setVoucherForm(null)} />
          </form>
        </Modal>
      )}
    </main>
  )
}

function Overview({ summary, orders, onTab }) {
  if (!summary) return <p className="py-10 text-center text-sm text-stone">Dashboard summary is unavailable.</p>
  const recentOrders = orders.slice(0, 5)
  return (
    <div>
      <h2 className="mb-5 font-display text-2xl text-ink">Store overview</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Active products" value={summary.activeProducts} detail={`${summary.products} total, including archived`} />
        <Metric label="Low-stock products" value={summary.lowStock} detail="5 or fewer units available" />
        <Metric label="Orders to process" value={summary.pendingOrders} detail={`${summary.orders} total orders`} />
        <Metric label="Customers" value={summary.customers} detail="Registered customer accounts" />
        <Metric label="Paid revenue" value={formatLkr(summary.paidRevenueLkr)} detail="Paid, non-cancelled orders" />
        <Metric label="Payment handling" value="Manual" detail="Refunds are processed through the payment provider" />
      </div>
      <div className="mt-7 flex items-center justify-between gap-3">
        <h3 className="font-display text-xl text-ink">Recent orders</h3>
        <button type="button" onClick={() => onTab('orders')} className="text-sm font-semibold text-terracotta hover:underline">View all</button>
      </div>
      {recentOrders.length === 0 ? <p className="py-8 text-sm text-stone">No orders yet.</p> : (
        <div className="mt-3 divide-y divide-cream-dark rounded-xl border border-cream-dark bg-white">
          {recentOrders.map((order) => <div key={order.orderId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span className="font-semibold text-ink">{order.id}</span><span className="text-stone">{order.customer.fullName}</span><span className="text-ink">{formatLkr(order.total)}</span><span className="rounded-full bg-cream px-3 py-1 text-xs capitalize text-ink">{order.status}</span></div>)}
        </div>
      )}
    </div>
  )
}

function ProductsPanel({ products, busy, onAdd, onEdit, onRemove }) {
  const [showArchived, setShowArchived] = useState(false)
  const visibleProducts = products.filter((product) => showArchived || product.active)
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl text-ink">Products & stock</h2><p className="mt-1 text-sm text-stone">Update product listings and available inventory.</p></div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-stone"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show removed</label>
          <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-sm font-semibold text-cream hover:bg-ink"><Plus size={16} /> Add product</button>
        </div>
      </div>
      {visibleProducts.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm text-stone">No products in this view.</p> : (
        <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wide text-stone"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Listing</th><th className="p-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-cream-dark">
              {visibleProducts.map((product) => (
                <tr key={product.id} className={!product.active ? 'opacity-60' : ''}>
                  <td className="p-3"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-12 w-10 rounded-md object-cover" /><span className="font-medium text-ink">{product.name}</span></div></td>
                  <td className="p-3 text-stone">{product.category}</td>
                  <td className="p-3 text-ink">{formatLkr(product.priceLkr)}</td>
                  <td className={`p-3 font-medium ${product.stock <= 5 ? 'text-terracotta' : 'text-ink'}`}>{product.stock} <span className="block text-xs font-normal text-stone">{product.variants?.filter((variant) => variant.active).length || 0} variants</span></td>
                  <td className="p-3 text-stone">{product.active ? product.tag || 'Active' : 'Removed'}</td>
                  <td className="p-3"><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => onEdit(product)} className="rounded-md border border-cream-dark px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-charcoal disabled:opacity-50">{product.active ? 'Edit' : 'Restore'}</button>{product.active && <button type="button" disabled={busy} onClick={() => onRemove(product)} className="rounded-md border border-terracotta/30 px-2.5 py-1.5 text-xs font-semibold text-terracotta disabled:opacity-50">Remove</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OrdersPanel({ orders, busy, onStatusChange }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Orders</h2>
      <p className="mb-5 mt-1 text-sm text-stone">Latest 200 orders. Payment refunds are not issued by changing delivery status.</p>
      {orders.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm text-stone">No orders yet.</p> : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.orderId} className="rounded-xl border border-cream-dark bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-semibold text-ink">{order.id} · {order.customer.fullName}</h3><p className="mt-1 text-xs text-stone">{order.customerEmail} · {new Date(order.date).toLocaleString()}</p></div>
                <div className="text-right"><p className="font-semibold text-ink">{formatLkr(order.total)}</p><p className="mt-1 text-xs text-stone">{order.payment} · Payment {order.paymentStatus}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-cream-dark pt-3">
                <p className="text-xs text-stone">{order.items.map((item) => {
                  const options = [item.size && `Size ${item.size}`, item.color && `Color ${item.color}`].filter(Boolean)
                  return `${item.name}${options.length ? ` (${options.join(', ')})` : ''} × ${item.quantity}`
                }).join(', ')}</p>
                <label className="flex items-center gap-2 text-xs text-stone">Order status<select aria-label={`Status for ${order.id}`} disabled={busy || order.status === 'cancelled'} value={order.status} onChange={(event) => onStatusChange(order, event.target.value)} className={`${inputClass} w-auto py-1.5 capitalize`}><option value="placed">Placed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function CustomersPanel({ customers }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Customers</h2>
      <p className="mb-5 mt-1 text-sm text-stone">Latest 500 customer accounts and their order totals.</p>
      {customers.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm text-stone">No customers yet.</p> : (
        <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wide text-stone"><tr><th className="p-3">Customer</th><th className="p-3">Email</th><th className="p-3">Joined</th><th className="p-3">Orders</th><th className="p-3">Paid total</th></tr></thead>
            <tbody className="divide-y divide-cream-dark">{customers.map((customer) => <tr key={customer.id}><td className="p-3 font-medium text-ink">{customer.name}</td><td className="p-3 text-stone">{customer.email}</td><td className="p-3 text-stone">{new Date(customer.joinedAt).toLocaleDateString()}</td><td className="p-3 text-ink">{customer.orderCount}</td><td className="p-3 text-ink">{formatLkr(customer.spentLkr)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function VouchersPanel({ vouchers, onAdd, onEdit, onRemove }) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl text-ink">Vouchers</h2><p className="mt-1 text-sm text-stone">Discounts are validated and calculated by the backend.</p></div><button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-sm font-semibold text-cream hover:bg-ink"><Plus size={16} /> Add voucher</button></div>
      {vouchers.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm text-stone">No vouchers configured.</p> : (
        <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wide text-stone"><tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-cream-dark">{vouchers.map((voucher) => <tr key={voucher.id}><td className="p-3 font-semibold text-ink">{voucher.code}</td><td className="p-3 text-stone">{voucher.type === 'percent' ? `${voucher.value}%` : `${formatLkr(voucher.value)} off`}</td><td className="p-3 text-stone">{voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString() : 'Never'}</td><td className="p-3 text-stone">{voucher.active ? 'Active' : 'Inactive'}</td><td className="p-3"><div className="flex gap-2"><button type="button" onClick={() => onEdit(voucher)} className="rounded-md border border-cream-dark px-2.5 py-1.5 text-xs font-semibold text-ink">Edit</button><button type="button" onClick={() => onRemove(voucher)} className="rounded-md border border-terracotta/30 px-2.5 py-1.5 text-xs font-semibold text-terracotta">Delete</button></div></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#f7f3ed] p-5 shadow-2xl md:p-7">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 id="admin-modal-title" className="font-display text-2xl text-ink">{title}</h2><button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-stone hover:bg-sand" aria-label="Close dialog">×</button></div>
        {children}
      </section>
    </div>
  )
}

function FormActions({ busy, onCancel }) {
  return <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onCancel} className="rounded-full border border-cream-dark px-5 py-2.5 text-sm text-ink">Cancel</button><button type="submit" disabled={busy} className="rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-50">{busy ? 'Saving...' : 'Save'}</button></div>
}
