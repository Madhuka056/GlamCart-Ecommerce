import { useEffect, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { apiRequest } from '../../lib/api'
import { formatLkr } from '../../lib/currency'

const MAX_PAYMENT_CHECKS = 10
const PAYMENT_CHECK_INTERVAL_MS = 2000

export default function OrderSuccessPage() {
  const location = useLocation()
  const { order: routeOrder, confirmationEmailStatus, confirmationEmail } = location.state || {}
  const orderId = routeOrder?.orderId || new URLSearchParams(location.search).get('orderId')
  const paymentCancelled = new URLSearchParams(location.search).get('paymentCancelled') === '1'

  const [liveOrder, setLiveOrder] = useState(routeOrder || null)
  const [loadingOrder, setLoadingOrder] = useState(!routeOrder && Boolean(orderId))
  const [orderLoadError, setOrderLoadError] = useState(false)
  const order = liveOrder || routeOrder
  const isCard = order?.payment === 'Card Payment'
  const [checking, setChecking] = useState(isCard && order?.paymentStatus === 'pending')

  useEffect(() => {
    if (routeOrder || !orderId) return undefined

    let cancelled = false
    apiRequest(`/orders/${orderId}`)
      .then((data) => {
        if (!cancelled) {
          setLiveOrder(data.order)
          setChecking(data.order.payment === 'Card Payment' && data.order.paymentStatus === 'pending')
        }
      })
      .catch(() => {
        if (!cancelled) setOrderLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false)
      })

    return () => {
      cancelled = true
    }
  }, [orderId, routeOrder])

  // Card payment: PayHere notify eka backend ekata enna poddak welawa yanawa,
  // eka nisa order eka paid wenakan poll karanawa
  useEffect(() => {
    if (!order || order.payment !== 'Card Payment' || order.paymentStatus !== 'pending') return undefined

    let cancelled = false
    let attempts = 0
    let timer

    const check = async () => {
      attempts += 1
      try {
        const data = await apiRequest(`/orders/${order.orderId}`)
        if (cancelled) return
        setLiveOrder(data.order)
        if (data.order.paymentStatus !== 'pending') {
          setChecking(false)
          return
        }
      } catch {
        // try again on the next round
      }
      if (attempts >= MAX_PAYMENT_CHECKS) {
        if (!cancelled) setChecking(false)
        return
      }
      timer = setTimeout(check, PAYMENT_CHECK_INTERVAL_MS)
    }

    check()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [order?.orderId])

  if (!order && loadingOrder) {
    return (
      <main className="bg-[#f7f3ed] px-6 py-14 min-h-[calc(100vh-152px)] text-center">
        <p role="status" className="text-sm text-stone">Loading your order...</p>
      </main>
    )
  }
  if (!order && orderLoadError) {
    return (
      <main className="bg-[#f7f3ed] px-6 py-14 min-h-[calc(100vh-152px)] text-center">
        <p role="alert" className="text-sm text-terracotta mb-4">We could not load your order. Please check your order history.</p>
        <Link to="/order-history" className="text-sm text-ink underline">View order history</Link>
      </main>
    )
  }
  if (!order) return <Navigate to="/" replace />

  const current = order
  const { customer } = current
  const firstName = customer.fullName.trim().split(' ')[0]
  const isPaid = current.paymentStatus === 'paid'
  const paymentNotCompleted = paymentCancelled || (isCard && ['cancelled', 'failed'].includes(current.paymentStatus))

  // Card orders: email eka yanne payment eka confirm unata passe
  const emailStatus = isCard ? current.confirmationEmailStatus : confirmationEmailStatus
  const showEmailMessage = isCard ? isPaid && (emailStatus === 'sent' || emailStatus === 'failed') : true

  return (
    <main className="bg-[#f7f3ed] px-6 md:px-12 py-10 md:py-14 min-h-[calc(100vh-152px)]">
      <div className="max-w-[720px] mx-auto">
        <div className="text-center mb-8">
          <span className="w-14 h-14 rounded-full bg-olive text-cream inline-flex items-center justify-center mb-4">
            <Check size={28} />
          </span>
          <h1 className="font-display text-3xl md:text-4xl text-ink mb-2">
            {paymentNotCompleted ? 'Payment not completed' : `Thank you, ${firstName}!`}
          </h1>
          <p className="text-sm text-stone">
            {paymentCancelled && (
              <>Your card payment was cancelled. Your order <span className="text-ink font-semibold">{current.id}</span> is still unpaid.</>
            )}
            {!paymentCancelled && isCard && isPaid && (
              <>
                Your payment was received and your order <span className="text-ink font-semibold">{current.id}</span> has been placed successfully.
              </>
            )}
            {!paymentCancelled && isCard && !isPaid && current.paymentStatus === 'pending' && (
              <>
                Your order <span className="text-ink font-semibold">{current.id}</span> has been placed.
              </>
            )}
            {!paymentCancelled && isCard && current.paymentStatus === 'cancelled' && (
              <>Your card payment was cancelled. Your order <span className="text-ink font-semibold">{current.id}</span> is still unpaid.</>
            )}
            {!paymentCancelled && isCard && current.paymentStatus === 'failed' && (
              <>Your card payment could not be completed. Your order <span className="text-ink font-semibold">{current.id}</span> is still unpaid.</>
            )}
            {!paymentCancelled && !isCard && (
              <>
                Your order <span className="text-ink font-semibold">{current.id}</span> has been placed successfully.
              </>
            )}
          </p>

          {!paymentCancelled && isCard && current.paymentStatus === 'pending' && checking && (
            <p role="status" className="text-sm text-stone mt-2">Confirming your payment...</p>
          )}
          {!paymentCancelled && isCard && current.paymentStatus === 'pending' && !checking && (
            <p role="status" className="text-sm text-stone mt-2">
              We are still confirming your payment. This can take a minute. You can check the status in your orders.
            </p>
          )}

          {showEmailMessage && emailStatus === 'sent' && (
            <p className="text-sm text-stone mt-2">
              Confirmation email sent to <span className="text-ink font-medium">{confirmationEmail}</span>.
            </p>
          )}
          {showEmailMessage && emailStatus === 'failed' && (
            <p role="status" className="text-sm text-terracotta mt-2">
              Your order is saved, but we could not send the confirmation email.
            </p>
          )}
          {!isCard && emailStatus === 'not_configured' && (
            <p role="status" className="text-sm text-stone mt-2">
              Your order is saved. Email confirmation is not configured yet.
            </p>
          )}
        </div>

        <div className="bg-sand rounded-2xl p-6 mb-6 grid sm:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-xs text-stone mb-1">Delivery Address</p>
            <p className="text-ink">{customer.fullName}</p>
            <p className="text-ink">{customer.phone}</p>
            <p className="text-ink">
              {customer.address}, {customer.city}, {customer.district}
              {customer.postalCode ? ` ${customer.postalCode}` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone mb-1">Estimated Delivery</p>
            <p className="text-ink">{current.deliveryEstimate}</p>
          </div>
          <div>
            <p className="text-xs text-stone mb-1">Payment</p>
            <p className="text-ink">{current.payment}</p>
            {isCard && (
              <p className={`text-xs mt-1 ${isPaid ? 'text-olive' : 'text-stone'}`}>
                {isPaid ? 'Paid' : 'Awaiting confirmation'}
              </p>
            )}
          </div>
        </div>

        <div className="bg-sand rounded-2xl p-6 mb-8">
          <div className="flex flex-col divide-y divide-cream-dark mb-5">
            {current.items.map((item, i) => {
              const variant = [item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
                .filter(Boolean)
                .join(', ')
              return (
                <div key={`${item.index}-${i}`} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-center">
                  <div className="w-14 h-16 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    {variant && <p className="text-xs text-stone mt-1">{variant}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-ink">{formatLkr(item.price * item.quantity)}</p>
                    <p className="text-xs text-stone mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-cream-dark pt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-stone">
              <span>Items Total</span>
              <span className="text-ink font-medium">{formatLkr(current.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone">
              <span>Delivery Fee</span>
              <span className="text-ink font-medium">{formatLkr(current.shippingFee)}</span>
            </div>
            {current.discount > 0 && (
              <div className="flex justify-between text-stone">
                <span>Voucher Discount ({current.voucher})</span>
                <span className="text-olive font-medium">-{formatLkr(current.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-ink pt-2">
              <span>Total</span>
              <span className="text-terracotta">{formatLkr(current.total)}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-charcoal text-cream text-sm font-semibold px-6 py-3 rounded-full hover:bg-ink transition-colors"
          >
            Continue Shopping
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  )
}