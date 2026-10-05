import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, X } from 'lucide-react'
import { apiRequest } from '../../lib/api'
import { formatLkr } from '../../lib/currency'

const formatDate = (date) =>
  new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingOrderId, setCancellingOrderId] = useState('')

  const loadOrders = useCallback(async () => {
    setError('')
    try {
      const data = await apiRequest('/orders/my-orders')
      setOrders(data.orders)
    } catch (requestError) {
      setError(requestError.message || 'Could not load your order history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.id}?`)) return

    setCancellingOrderId(order.orderId)
    setError('')
    try {
      const data = await apiRequest(`/orders/${order.orderId}/cancel`, { method: 'PATCH' })
      setOrders((current) =>
        current.map((item) => item.orderId === data.order.orderId ? data.order : item),
      )
    } catch (requestError) {
      setError(requestError.message || 'Could not cancel this order. Please try again.')
    } finally {
      setCancellingOrderId('')
    }
  }

  return (
    <main className="min-h-[60vh] bg-[#f7f3ed] px-6 md:px-12 py-8 md:py-10">
      <div className="max-w-[1000px] mx-auto">
        <nav className="flex items-center gap-2 text-sm text-stone mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-terracotta">Home</Link>
          <span aria-hidden="true">›</span>
          <span className="text-ink">Order History</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-ink mb-6">Order History</h1>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-terracotta/30 bg-cream px-4 py-3 text-sm text-terracotta">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-stone">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-sand py-14 px-6 flex flex-col items-center text-center">
            <Package size={38} className="text-stone mb-4" strokeWidth={1.5} />
            <h2 className="font-display text-2xl text-ink mb-2">No orders yet</h2>
            <p className="text-sm text-stone mb-5">Your placed orders will appear here.</p>
            <Link to="/shop" className="bg-charcoal text-cream text-sm font-semibold px-6 py-3 rounded-full hover:bg-ink transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {orders.map((order) => {
              const cancelled = order.status === 'cancelled'
              return (
                <article key={order.orderId} className="rounded-2xl bg-sand p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-cream-dark pb-4 mb-2">
                    <div>
                      <h2 className="font-semibold text-ink">{order.id}</h2>
                      <p className="text-xs text-stone mt-1">Placed {formatDate(order.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        cancelled ? 'bg-terracotta/10 text-terracotta' : 'bg-olive/15 text-olive'
                      }`}>
                        {cancelled && <X size={13} />}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      {order.status === 'placed' && order.paymentStatus !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order)}
                          disabled={cancellingOrderId === order.orderId}
                          className="text-xs font-semibold text-terracotta underline underline-offset-2 disabled:opacity-50"
                        >
                          {cancellingOrderId === order.orderId ? 'Cancelling...' : 'Cancel order'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-cream-dark">
                    {order.items.map((item, index) => (
                      <div key={`${item.index}-${index}`} className="flex items-center gap-3 py-3">
                        <img src={item.image} alt={item.name} className="w-14 h-16 rounded-lg object-cover bg-cream-dark" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink">{item.name}</p>
                          {(item.size || item.color) && (
                            <p className="text-xs text-stone mt-1">
                              {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          <p className="text-xs text-stone mt-1">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-ink">{formatLkr(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-t border-cream-dark pt-4 mt-1">
                    <div className="text-xs text-stone">
                      <p>{order.customer.district} · {order.payment}</p>
                      {cancelled && order.cancelledAt && <p className="mt-1">Cancelled {formatDate(order.cancelledAt)}</p>}
                    </div>
                    <p className="text-base font-semibold text-ink">
                      Total: <span className="text-terracotta">{formatLkr(order.total)}</span>
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
