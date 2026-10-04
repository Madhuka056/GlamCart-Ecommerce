import Order from '../models/Order.js'
import { getProductPriceLkr, usdToLkr } from '../config/productPrices.js'
import { sendOrderConfirmation } from '../utils/sendOrderConfirmation.js'

const districtZones = {
  Colombo: 'colombo',
  Gampaha: 'colombo',
  Kalutara: 'colombo',
  Kandy: 'main',
  Matale: 'main',
  Galle: 'main',
  Matara: 'main',
  Kurunegala: 'main',
  Puttalam: 'main',
  Kegalle: 'main',
  Ratnapura: 'main',
  'Nuwara Eliya': 'far',
  Hambantota: 'far',
  Jaffna: 'far',
  Kilinochchi: 'far',
  Mannar: 'far',
  Vavuniya: 'far',
  Mullaitivu: 'far',
  Batticaloa: 'far',
  Ampara: 'far',
  Trincomalee: 'far',
  Anuradhapura: 'far',
  Polonnaruwa: 'far',
  Badulla: 'far',
  Monaragala: 'far',
}

const voucherValues = { GLAM10: { type: 'percent', value: 10 }, WELCOME5: { type: 'amount', value: 5 } }

const toOrderResponse = (order) => ({
  orderId: order._id.toString(),
  id: `GC${order._id.toString().slice(-8).toUpperCase()}`,
  date: order.createdAt.toISOString(),
  customer: order.customer,
  items: order.items,
  payment: order.payment,
  paymentStatus: order.paymentStatus || 'pending',
  paidAt: order.paidAt || null,
  subtotal: order.subtotal,
  shippingFee: order.shippingFee,
  discount: order.discount,
  voucher: order.voucher,
  total: order.total,
  deliveryEstimate: order.deliveryEstimate,
  status: order.status || 'placed',
  cancelledAt: order.cancelledAt || null,
  confirmationEmailStatus: order.confirmationEmailStatus,
})

export function buildOrderValues(body, user) {
  const customer = body.customer
  const district = customer?.district
  const zone = districtZones[district]
  if (!zone) throw Object.assign(new Error('Select a valid delivery district'), { statusCode: 400 })

  const selectedPayment = typeof body.payment === 'string' ? body.payment : 'Cash on Delivery'
  const isBankTransfer = selectedPayment === 'Bank Transfer'

  if (isBankTransfer) {
    const bankName = String(body.paymentDetails?.bankName || '').trim()
    const accountName = String(body.paymentDetails?.accountName || '').trim()
    const accountNumber = String(body.paymentDetails?.accountNumber || '').trim()
    const branch = String(body.paymentDetails?.branch || '').trim()
    const slipName = String(body.paymentDetails?.slipName || '').trim()
    const slipDataUrl = String(body.paymentDetails?.slipDataUrl || '').trim()

    if (!bankName || !accountName || !accountNumber || !branch || !slipName || !slipDataUrl) {
      throw Object.assign(new Error('Bank details and uploaded slip are required'), { statusCode: 400 })
    }
  }

  const items = body.items.map((item) => {
    const quantity = Number(item.quantity)
    const index = Number(item.index)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw Object.assign(new Error('Invalid product quantity'), { statusCode: 400 })
    }

    let price
    try {
      price = getProductPriceLkr(index)
    } catch {
      throw Object.assign(new Error('Invalid product selection'), { statusCode: 400 })
    }

    if (typeof item.name !== 'string' || !item.name.trim() || typeof item.image !== 'string') {
      throw Object.assign(new Error('Invalid product details'), { statusCode: 400 })
    }

    return {
      index,
      name: item.name.trim().slice(0, 120),
      image: item.image,
      price,
      quantity,
      size: typeof item.size === 'string' ? item.size.slice(0, 20) : '',
      color: typeof item.color === 'string' ? item.color.slice(0, 40) : '',
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = ({ colombo: 2, main: 3, far: 4 })[zone] * usdToLkr
  const voucherCode = typeof body.voucher === 'string' ? body.voucher.trim().toUpperCase() : null
  const voucher = voucherCode ? voucherValues[voucherCode] : null
  if (voucherCode && !voucher) throw Object.assign(new Error('Invalid voucher code'), { statusCode: 400 })

  const rawDiscount = !voucher
    ? 0
    : voucher.type === 'percent'
      ? Math.round((subtotal * voucher.value) / 100)
      : voucher.value * usdToLkr
  const discount = Math.min(subtotal, rawDiscount)

  return {
    user: user._id,
    customer,
    items,
    payment: selectedPayment,
    paymentStatus: 'pending',
    paymentDetails: isBankTransfer
      ? {
          bankName: String(body.paymentDetails.bankName || '').trim(),
          accountName: String(body.paymentDetails.accountName || '').trim(),
          accountNumber: String(body.paymentDetails.accountNumber || '').trim(),
          branch: String(body.paymentDetails.branch || '').trim(),
          reference: '',
          slipName: String(body.paymentDetails.slipName || '').trim(),
          slipDataUrl: String(body.paymentDetails.slipDataUrl || '').trim(),
        }
      : {
          bankName: '',
          accountName: '',
          accountNumber: '',
          branch: '',
          reference: '',
          slipName: '',
          slipDataUrl: '',
        },
    subtotal,
    shippingFee,
    discount,
    voucher: voucherCode,
    total: subtotal - discount + shippingFee,
    deliveryEstimate: body.deliveryEstimate,
    status: 'placed',
  }
}

async function sendConfirmation(order, email) {
  try {
    order.confirmationEmailStatus = await sendOrderConfirmation(order, email)
    if (order.confirmationEmailStatus === 'not_configured') {
      console.warn('Order confirmation email was not sent: GMAIL_USER or GMAIL_APP_PASSWORD is missing.')
    }
  } catch (error) {
    order.confirmationEmailStatus = 'failed'
    console.error(`Order confirmation email failed for ${order._id}: ${error.message}`)
  }
  await order.save()
}

export const createOrder = async (req, res) => {
  const values = buildOrderValues(req.body, req.user)
  const order = await Order.create(values)

  // Card orders: confirmation email is sent after PayHere confirms the payment
  if (order.payment !== 'Card Payment') {
    await sendConfirmation(order, req.user.email)
  }

  res.status(201).json({
    success: true,
    order: toOrderResponse(order),
    confirmationEmailStatus: order.confirmationEmailStatus,
    confirmationEmail: req.user.email,
  })
}

export const getMyOrder = async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.orderId)) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id })
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
  return res.json({ success: true, order: toOrderResponse(order) })
}

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json({ success: true, orders: orders.map(toOrderResponse) })
}

export const cancelMyOrder = async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.orderId)) {
    res.status(404)
    return res.json({ success: false, message: 'Order not found' })
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.orderId,
      user: req.user._id,
      status: 'placed',
    },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { new: true, runValidators: true }
  )

  if (order) return res.json({ success: true, order: toOrderResponse(order) })

  const existingOrder = await Order.findOne({ _id: req.params.orderId, user: req.user._id })
  if (!existingOrder) {
    res.status(404)
    return res.json({ success: false, message: 'Order not found' })
  }
  return res.json({ success: true, order: toOrderResponse(existingOrder) })
}