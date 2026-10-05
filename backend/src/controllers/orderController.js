import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Voucher from '../models/Voucher.js'
import { usdToLkr } from '../config/productPrices.js'
import { sendOrderConfirmation } from '../utils/sendOrderConfirmation.js'
import { restoreProductStock, restoreOrderInventory } from '../utils/productInventory.js'

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

export async function buildOrderValues(body, user) {
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

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw Object.assign(new Error('Add at least one product to your order'), { statusCode: 400 })
  }

  const quantities = new Map()
  for (const item of body.items) {
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw Object.assign(new Error('Invalid product quantity'), { statusCode: 400 })
    }
    if (!/^[a-f\d]{24}$/i.test(String(item.productId || ''))) {
      throw Object.assign(new Error('Invalid product selection. Please refresh your cart.'), { statusCode: 400 })
    }
    if (!/^[a-f\d]{24}$/i.test(String(item.variantId || ''))) {
      throw Object.assign(new Error('Choose a valid product size and color. Please refresh your cart.'), { statusCode: 400 })
    }
    const key = `${item.productId}:${item.variantId}`
    quantities.set(key, {
      productId: item.productId,
      variantId: item.variantId,
      quantity: (quantities.get(key)?.quantity || 0) + quantity,
    })
  }

  const reservations = []
  const variantsByKey = new Map()
  const productsById = new Map()
  try {
    for (const { productId, variantId, quantity } of quantities.values()) {
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          active: true,
          variants: { $elemMatch: { _id: variantId, active: true, stock: { $gte: quantity } } },
        },
        { $inc: { stock: -quantity, 'variants.$.stock': -quantity } },
        { new: true },
      )
      if (!product) {
        const exists = await Product.exists({
          _id: productId,
          active: true,
          variants: { $elemMatch: { _id: variantId, active: true } },
        })
        throw Object.assign(
          new Error(exists ? 'One or more items are out of stock. Please update your cart.' : 'A product in your cart is no longer available.'),
          { statusCode: 409 },
        )
      }
      reservations.push({ productId, variantId, quantity })
      variantsByKey.set(`${productId}:${variantId}`, product.variants.id(variantId))
      productsById.set(productId, product)
    }

    const items = body.items.map((item) => {
      const productVariant = variantsByKey.get(`${item.productId}:${item.variantId}`)
      if (!productVariant) throw Object.assign(new Error('Invalid product selection'), { statusCode: 400 })
      const product = productsById.get(item.productId)
      const quantity = Number(item.quantity)
      if (!product) throw Object.assign(new Error('Invalid product selection'), { statusCode: 400 })

      return {
        productId: product._id,
        variantId: item.variantId,
        index: product.legacyIndex,
        name: product.name,
        image: product.image,
        price: product.priceLkr,
        quantity,
        size: productVariant.size,
        color: productVariant.color,
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shippingFee = ({ colombo: 2, main: 3, far: 4 })[zone] * usdToLkr
    const voucherCode = typeof body.voucher === 'string' ? body.voucher.trim().toUpperCase() : null
    const voucher = voucherCode
      ? await Voucher.findOne({
          code: voucherCode,
          active: true,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        })
      : null
    if (voucherCode && !voucher) throw Object.assign(new Error('Invalid or expired voucher code'), { statusCode: 400 })

    const rawDiscount = !voucher
      ? 0
      : voucher.type === 'percent'
        ? Math.round((subtotal * voucher.value) / 100)
        : voucher.value
    const discount = Math.min(subtotal, rawDiscount)

    return {
      reservations,
      values: {
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
      },
    }
  } catch (error) {
    await Promise.all(reservations.map(({ productId, variantId, quantity }) =>
      restoreProductStock(productId, variantId, quantity),
    ))
    throw error
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
  const { values, reservations } = await buildOrderValues(req.body, req.user)
  let order
  try {
    order = await Order.create(values)
  } catch (error) {
    await Promise.all(reservations.map(({ productId, variantId, quantity }) =>
      restoreProductStock(productId, variantId, quantity),
    ))
    throw error
  }

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
      paymentStatus: { $ne: 'paid' },
    },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { new: true, runValidators: true }
  )

  if (order) {
    await restoreOrderInventory(order.items)
    return res.json({ success: true, order: toOrderResponse(order) })
  }

  const existingOrder = await Order.findOne({ _id: req.params.orderId, user: req.user._id })
  if (!existingOrder) {
    res.status(404)
    return res.json({ success: false, message: 'Order not found' })
  }
  return res.json({ success: true, order: toOrderResponse(existingOrder) })
}