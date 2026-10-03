import { ArrowRight, Check } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { formatLkr } from '../../lib/currency'

export default function OrderSuccessPage() {
  const { order, confirmationEmailStatus, confirmationEmail } = useLocation().state || {}

  // Opened directly (no order in state) -> home
  if (!order) return <Navigate to="/" replace />

  const { customer } = order
  const firstName = customer.fullName.trim().split(' ')[0]

  return (
    <main className="bg-[#f7f3ed] px-6 md:px-12 py-10 md:py-14 min-h-[calc(100vh-152px)]">
      <div className="max-w-[720px] mx-auto">
        <div className="text-center mb-8">
          <span className="w-14 h-14 rounded-full bg-olive text-cream inline-flex items-center justify-center mb-4">
            <Check size={28} />
          </span>
          <h1 className="font-display text-3xl md:text-4xl text-ink mb-2">Thank you, {firstName}!</h1>
          <p className="text-sm text-stone">
            Your order <span className="text-ink font-semibold">{order.id}</span> has been placed successfully.
          </p>
          {confirmationEmailStatus === 'sent' && (
            <p className="text-sm text-stone mt-2">
              Confirmation email sent to <span className="text-ink font-medium">{confirmationEmail}</span>.
            </p>
          )}
          {confirmationEmailStatus === 'failed' && (
            <p role="status" className="text-sm text-terracotta mt-2">
              Your order is saved, but we could not send the confirmation email.
            </p>
          )}
          {confirmationEmailStatus === 'not_configured' && (
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
            <p className="text-ink">{order.deliveryEstimate}</p>
          </div>
          <div>
            <p className="text-xs text-stone mb-1">Payment</p>
            <p className="text-ink">{order.payment}</p>
          </div>
        </div>

        <div className="bg-sand rounded-2xl p-6 mb-8">
          <div className="flex flex-col divide-y divide-cream-dark mb-5">
            {order.items.map((item, i) => {
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
              <span className="text-ink font-medium">{formatLkr(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone">
              <span>Delivery Fee</span>
              <span className="text-ink font-medium">{formatLkr(order.shippingFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-stone">
                <span>Voucher Discount ({order.voucher})</span>
                <span className="text-olive font-medium">-{formatLkr(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-ink pt-2">
              <span>Total</span>
              <span className="text-terracotta">{formatLkr(order.total)}</span>
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