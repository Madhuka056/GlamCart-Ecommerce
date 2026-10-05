import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Banknote, Check, CreditCard, Truck } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../context/CatalogContext'
import { apiRequest } from '../../lib/api'
import { startPayHerePayment } from '../../lib/payhere'
import { DISTRICTS, getDeliveryEstimate, getShippingFee } from '../../lib/shipping'
import { formatLkr } from '../../lib/currency'

const ADDRESS_KEY = 'glamcart-address'
const MAX_BANK_SLIP_SIZE = 5 * 1024 * 1024
const BANK_DETAILS = [
  { label: 'Bank Name', value: 'Commercial Bank of Ceylon PLC' },
  { label: 'Account Name', value: 'Glam Cart' },
  { label: 'Account Number', value: '1234567890' },
  { label: 'Branch', value: 'Colombo 03' },
]

const inputClass = (error) =>
  `w-full bg-cream border rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-stone outline-none transition-colors focus:border-terracotta ${
    error ? 'border-terracotta' : 'border-cream-dark'
  }`

function loadAddress(user) {
  if (!user?.id) return { fullName: user?.name || '', phone: '', address: '', city: '', postalCode: '' }

  try {
    const saved = JSON.parse(localStorage.getItem(`${ADDRESS_KEY}:${user.id}`))
    if (saved) return saved
  } catch {
    // ignore storage errors
  }
  return { fullName: user?.name || '', phone: '', address: '', city: '', postalCode: '' }
}

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { products, loading: catalogLoading } = useCatalog()
  const { cart, isLoadingCart, removeItems, shippingDistrict, setShippingDistrict } = useCart()
  const placedRef = useRef(false)
  // Card order eka create wela, payment eka complete wenne nathnam mekata save wenawa
  // (retry karanakota aluth order ekak hadanne nathuwa eka ma use karanna)
  const pendingCardRef = useRef(null)

  // Selected cart lines are passed from the cart page via router state
  const keys = location.state?.keys || []

  const [voucher, setVoucher] = useState(null)
  const [voucherInput, setVoucherInput] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [address, setAddress] = useState(() => loadAddress(user))
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery')
  const [bankTransfer, setBankTransfer] = useState({ slipName: '', slipDataUrl: '' })
  const [errors, setErrors] = useState({})
  const [orderError, setOrderError] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)

  useEffect(() => {
    setAddress(loadAddress(user))
  }, [user?.id])

  useEffect(() => {
    const code = location.state?.voucher
    if (!code) return
    apiRequest('/vouchers', { method: 'POST', body: JSON.stringify({ code }) })
      .then((result) => setVoucher(result.voucher))
      .catch((error) => setVoucherError(error.message || 'Voucher could not be verified.'))
  }, [location.state?.voucher])

  const items = cart
    .filter((entry) => keys.includes(entry.key))
    .map((entry) => {
      const product = products.find((item) => item.id === entry.productId)
      return { ...entry, product, variant: product?.variants?.find((item) => item.id === entry.variantId) }
    })
    .filter((entry) => entry.product)

  if (catalogLoading || isLoadingCart) {
    return <main className="min-h-[60vh] bg-[#f7f3ed] flex items-center justify-center"><p role="status" className="text-sm text-stone">Loading checkout...</p></main>
  }

  // Nothing to check out (or opened directly) -> back to cart
  if (!placedRef.current && items.length === 0) return <Navigate to="/cart" replace />
  if (!placedRef.current && items.some((item) => !item.variant || item.quantity > item.variant.stock)) return <Navigate to="/cart" replace />

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.priceLkr * item.quantity, 0)
  const shippingFee = getShippingFee(shippingDistrict)
  const discount = voucher
    ? Math.min(subtotal, voucher.type === 'percent' ? Math.round(subtotal * voucher.value / 100) : voucher.value)
    : 0
  const total = subtotal - discount + (shippingFee ?? 0)
  const estimate = getDeliveryEstimate(shippingDistrict)

  const setField = (field) => (event) => {
    setAddress((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSlipUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setBankTransfer({ slipName: '', slipDataUrl: '' })
      setErrors((current) => ({ ...current, 'bank-slip': 'Upload an image or PDF bank slip' }))
      event.target.value = ''
      return
    }

    if (file.size > MAX_BANK_SLIP_SIZE) {
      setBankTransfer({ slipName: '', slipDataUrl: '' })
      setErrors((current) => ({ ...current, 'bank-slip': 'Bank slip must be 700 KB or smaller' }))
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setBankTransfer((current) => ({
        ...current,
        slipName: file.name,
        slipDataUrl: typeof reader.result === 'string' ? reader.result : '',
      }))
      setErrors((current) => ({ ...current, 'bank-slip': undefined }))
    }
    reader.onerror = () => {
      setBankTransfer({ slipName: '', slipDataUrl: '' })
      setErrors((current) => ({ ...current, 'bank-slip': 'Could not read this file. Please choose it again.' }))
    }
    reader.readAsDataURL(file)
  }

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

  const validate = () => {
    const next = {}
    if (!address.fullName.trim()) next.fullName = 'Enter your full name'
    const phone = address.phone.replace(/[\s-]/g, '')
    if (!/^(?:\+94|0)?7\d{8}$/.test(phone)) next.phone = 'Enter a valid mobile number (ex: 0771234567)'
    if (!address.address.trim()) next.address = 'Enter your street address'
    if (!address.city.trim()) next.city = 'Enter your city'
    if (!shippingDistrict) next.district = 'Select your district'

    if (paymentMethod === 'Bank Transfer') {
      if (!bankTransfer.slipName.trim() || !bankTransfer.slipDataUrl.trim()) next['bank-slip'] = 'Upload your bank slip'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const placeOrder = async () => {
    if (!validate()) return
    if (placingOrder) return
    setOrderError('')
    setPlacingOrder(true)

    const isCard = paymentMethod === 'Card Payment'

    const order = {
      customer: { ...address, district: shippingDistrict },
      items: items.map(({ product, quantity, variantId }) => ({
        productId: product.id,
        variantId,
        quantity,
      })),
      payment: paymentMethod,
      paymentDetails: paymentMethod === 'Bank Transfer'
        ? {
            bankName: BANK_DETAILS[0].value,
            accountName: BANK_DETAILS[1].value,
            accountNumber: BANK_DETAILS[2].value,
            branch: BANK_DETAILS[3].value,
            slipName: bankTransfer.slipName,
            slipDataUrl: bankTransfer.slipDataUrl,
          }
        : {},
      voucher: voucher?.code || null,
      deliveryEstimate: estimate,
    }

    try {
      localStorage.setItem(`${ADDRESS_KEY}:${user.id}`, JSON.stringify(address))
    } catch {
      // Saving a convenience address must not prevent placing an order.
    }

    try {
      // Same card order ekata retry karanakota aluth order ekak hadanne naha
      const signature = JSON.stringify(order)
      let result

      if (isCard && pendingCardRef.current?.signature === signature) {
        result = pendingCardRef.current.result
      } else {
        result = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify(order),
        })
        if (isCard) pendingCardRef.current = { signature, result }
      }

      if (isCard) {
        // Backend eken hash ekka payment object eka ganna, ita passe PayHere popup eka open karanna
        const { payment } = await apiRequest('/payhere/start', {
          method: 'POST',
          body: JSON.stringify({ orderId: result.order.orderId }),
        })

        const outcome = await startPayHerePayment(payment)
        if (outcome !== 'completed') {
          setOrderError('Payment was not completed. Click "Pay Now" to try again.')
          return
        }
        pendingCardRef.current = null
      }

      placedRef.current = true
      removeItems(
        items.map((item) => item.key),
        true,
      )
      navigate('/order-success', {
        state: {
          order: result.order,
          confirmationEmailStatus: result.confirmationEmailStatus,
          confirmationEmail: result.confirmationEmail,
        },
        replace: true,
      })
    } catch (error) {
      setOrderError(error.message || 'We could not place your order. Please check your connection and try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const paymentOptions = [
    { id: 'Cash on Delivery', label: 'Cash on Delivery', description: 'Pay when you receive', icon: Banknote },
    { id: 'Bank Transfer', label: 'Bank Transfer', description: 'Transfer and upload proof', icon: Check },
    { id: 'Card Payment', label: 'Card Payment', description: 'Visa / Mastercard via PayHere', icon: CreditCard },
  ]

  return (
    <main className="bg-[#f7f3ed] px-6 md:px-12 py-6 md:py-7 min-h-[calc(100vh-152px)]">
      <nav className="flex items-center gap-2 text-sm text-stone mb-6 max-w-[1200px] mx-auto" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-terracotta">Home</Link>
        <span aria-hidden="true">›</span>
        <Link to="/cart" className="hover:text-terracotta">Cart</Link>
        <span aria-hidden="true">›</span>
        <span className="text-ink">Checkout</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-ink mb-8 max-w-[1200px] mx-auto">Checkout</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 xl:gap-12 max-w-[1200px] mx-auto items-start">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Shipping & billing */}
          <section className="bg-sand rounded-2xl p-6">
            <h2 className="font-display text-xl text-ink mb-5">Shipping &amp; Billing</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm text-stone mb-1.5">Full Name</label>
                <input id="fullName" type="text" value={address.fullName} onChange={setField('fullName')} placeholder="Your full name" className={inputClass(errors.fullName)} />
                {errors.fullName && <p className="text-xs text-terracotta mt-1.5">{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm text-stone mb-1.5">Mobile Number</label>
                <input id="phone" type="tel" value={address.phone} onChange={setField('phone')} placeholder="07X XXX XXXX" className={inputClass(errors.phone)} />
                {errors.phone && <p className="text-xs text-terracotta mt-1.5">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm text-stone mb-1.5">Address</label>
                <input id="address" type="text" value={address.address} onChange={setField('address')} placeholder="House no, street name" className={inputClass(errors.address)} />
                {errors.address && <p className="text-xs text-terracotta mt-1.5">{errors.address}</p>}
              </div>
              <div>
                <label htmlFor="city" className="block text-sm text-stone mb-1.5">City</label>
                <input id="city" type="text" value={address.city} onChange={setField('city')} placeholder="City / Town" className={inputClass(errors.city)} />
                {errors.city && <p className="text-xs text-terracotta mt-1.5">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="district" className="block text-sm text-stone mb-1.5">District</label>
                <select
                  id="district"
                  value={shippingDistrict}
                  onChange={(event) => {
                    setShippingDistrict(event.target.value)
                    setErrors((current) => ({ ...current, district: undefined }))
                  }}
                  className={inputClass(errors.district)}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {errors.district && <p className="text-xs text-terracotta mt-1.5">{errors.district}</p>}
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm text-stone mb-1.5">Postal Code (optional)</label>
                <input id="postalCode" type="text" value={address.postalCode} onChange={setField('postalCode')} placeholder="Postal code" className={inputClass(false)} />
              </div>
            </div>
          </section>

          {/* Package: delivery + items */}
          <section className="bg-sand rounded-2xl p-6">
            <h2 className="font-display text-xl text-ink mb-5">Delivery</h2>

            <div className="flex items-start gap-3 border border-charcoal rounded-xl p-4 bg-cream mb-6 max-w-sm">
              <span className="w-6 h-6 rounded-full bg-charcoal text-cream flex items-center justify-center shrink-0 mt-0.5">
                <Check size={14} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink inline-flex items-center gap-2">
                  <Truck size={16} /> Standard Delivery
                </p>
                <p className="text-sm text-ink mt-1">{shippingFee === null ? '—' : formatLkr(shippingFee)}</p>
                <p className="text-xs text-stone mt-2">
                  {estimate ? `Guaranteed by ${estimate}` : 'Select your district to see the delivery date'}
                </p>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-cream-dark">
              {items.map(({ key, product, quantity, size, color }) => {
                const variant = [size && `Size: ${size}`, color && `Color: ${color}`].filter(Boolean).join(', ')
                return (
                  <div key={key} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-center">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone mb-0.5">{product.category}</p>
                      <p className="text-sm font-medium text-ink">{product.name}</p>
                      {variant && <p className="text-xs text-stone mt-1">{variant}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-terracotta">{formatLkr(product.priceLkr * quantity)}</p>
                      <p className="text-xs text-stone mt-1">Qty: {quantity}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right column: payment + summary */}
        <aside className="bg-sand rounded-2xl p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl text-ink mb-4">Payment Method</h2>
          <div className="space-y-3 mb-6">
            {paymentOptions.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPaymentMethod(id)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  paymentMethod === id ? 'border-charcoal bg-cream shadow-sm' : 'border-cream-dark bg-cream/70 hover:border-charcoal/80'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center ${paymentMethod === id ? 'bg-charcoal text-cream' : 'bg-cream-dark text-ink'}`}>
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{label}</span>
                    <span className="block text-xs text-stone">{description}</span>
                  </span>
                </span>
                <span className={`w-4 h-4 rounded-full border ${paymentMethod === id ? 'border-charcoal bg-charcoal' : 'border-stone'}`} aria-hidden="true" />
              </button>
            ))}
          </div>

          {paymentMethod === 'Card Payment' && (
            <div className="mb-6 rounded-xl border border-cream-dark bg-cream p-4">
              <p className="text-sm text-ink font-medium mb-1">Secure card payment</p>
              <p className="text-xs text-stone">
                A secure PayHere window will open when you click Pay Now. You enter your card details there.
                Your card details are never stored on our website.
              </p>
            </div>
          )}

          {paymentMethod === 'Bank Transfer' && (
            <div className="mb-6 rounded-xl border border-cream-dark bg-cream p-4">
              <div className="mb-4 rounded-lg border border-cream-dark bg-[#f9f5f2] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-stone mb-2">Bank Details</p>
                <div className="space-y-2 text-sm text-ink">
                  {BANK_DETAILS.map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-3">
                      <span className="text-stone">{label}</span>
                      <span className="font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-stone mb-1.5">Upload Bank Slip</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleSlipUpload}
                  className="block w-full text-sm text-stone file:mr-3 file:rounded-full file:border-0 file:bg-charcoal file:px-3 file:py-2 file:text-xs file:font-semibold file:text-cream hover:file:bg-ink"
                />
                <p className="mt-1 text-xs text-stone">Image or PDF, up to 5 MB.</p>
                {bankTransfer.slipName && <p className="mt-2 text-xs text-olive">Uploaded: {bankTransfer.slipName}</p>}
                {errors['bank-slip'] && <p className="text-xs text-terracotta mt-1.5">{errors['bank-slip']}</p>}
              </div>
            </div>
          )}

          <h2 className="font-display text-xl text-ink mb-3">Promotion</h2>
          <div className="mb-6">
            {voucher ? (
              <div className="flex items-center justify-between bg-cream border border-cream-dark rounded-lg px-3 py-2.5 text-sm">
                <span className="text-ink font-medium">{voucher.code} <span className="text-stone font-normal">({voucher.label})</span></span>
                <button type="button" onClick={() => setVoucher(null)} className="text-xs text-stone underline hover:text-terracotta">
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
                  <button type="button" onClick={applyVoucher} className="bg-olive text-cream text-sm font-semibold px-4 rounded-lg hover:opacity-90 transition-opacity">
                    Apply
                  </button>
                </div>
                {voucherError && <p className="text-xs text-terracotta mt-2">{voucherError}</p>}
              </>
            )}
          </div>

          <h2 className="font-display text-xl text-ink mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm text-stone mb-3">
            <span>Items Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            <span className="text-ink font-medium">{formatLkr(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-stone mb-3">
            <span>Delivery Fee</span>
            <span className="text-ink font-medium">{shippingFee === null ? 'Select district' : formatLkr(shippingFee)}</span>
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
            onClick={placeOrder}
            disabled={placingOrder}
            className="w-full bg-charcoal text-cream text-sm font-semibold py-3.5 rounded-full hover:bg-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {placingOrder ? 'Preparing...' : paymentMethod === 'Card Payment' ? 'Pay Now' : 'Place Order'}
          </button>
          {orderError && <p role="alert" className="text-xs text-terracotta text-center mt-3">{orderError}</p>}
          <p className="text-xs text-stone text-center mt-3">
            By placing your order you agree to our terms and return policy.
          </p>
        </aside>
      </div>
    </main>
  )
}