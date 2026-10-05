import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Voucher from '../models/Voucher.js'
import { restoreOrderInventory } from '../utils/productInventory.js'

const objectIdPattern = /^[a-f\d]{24}$/i
const orderStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled']

const serializeProduct = (product) => ({
  id: product._id.toString(),
  name: product.name,
  category: product.category,
  priceLkr: product.priceLkr,
  tag: product.tag,
  image: product.image,
  images: product.images || [],
  description: product.description || '',
  fabricAndCare: product.fabricAndCare || '',
  variants: (product.variants || []).map((variant) => ({
    id: variant._id.toString(),
    size: variant.size,
    color: variant.color,
    colorValue: variant.colorValue,
    stock: variant.stock,
    active: variant.active,
  })),
  stock: product.stock,
  active: product.active,
  createdAt: product.createdAt,
})

const serializeVoucher = (voucher) => ({
  id: voucher._id.toString(),
  code: voucher.code,
  type: voucher.type,
  value: voucher.value,
  active: voucher.active,
  expiresAt: voucher.expiresAt,
})

const serializeOrder = (order) => ({
  orderId: order._id.toString(),
  id: `GC${order._id.toString().slice(-8).toUpperCase()}`,
  date: order.createdAt,
  customer: order.customer,
  customerEmail: order.user?.email || '',
  items: order.items,
  payment: order.payment,
  paymentStatus: order.paymentStatus,
  subtotal: order.subtotal,
  shippingFee: order.shippingFee,
  discount: order.discount,
  total: order.total,
  status: order.status,
})

const validateProduct = (body) => {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const image = typeof body.image === 'string' ? body.image.trim() : ''
  const priceLkr = Number(body.priceLkr)
  const tag = body.tag || ''
  const active = body.active === undefined ? true : body.active
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const fabricAndCare = typeof body.fabricAndCare === 'string' ? body.fabricAndCare.trim() : ''
  const images = Array.isArray(body.images) ? body.images : []
  const variants = Array.isArray(body.variants) ? body.variants : []

  if (!name || name.length > 120) throw Object.assign(new Error('Enter a product name (maximum 120 characters)'), { statusCode: 400 })
  if (!category || category.length > 60) throw Object.assign(new Error('Enter a category (maximum 60 characters)'), { statusCode: 400 })
  if (!Number.isSafeInteger(priceLkr) || priceLkr < 1) throw Object.assign(new Error('Enter a valid price in LKR'), { statusCode: 400 })
  if (!['', 'New', 'Sale'].includes(tag)) throw Object.assign(new Error('Invalid product tag'), { statusCode: 400 })
  if (typeof active !== 'boolean') throw Object.assign(new Error('Product listing status must be true or false'), { statusCode: 400 })
  if (description.length > 2000) throw Object.assign(new Error('Product description cannot exceed 2000 characters'), { statusCode: 400 })
  if (fabricAndCare.length > 2000) throw Object.assign(new Error('Fabric and care information cannot exceed 2000 characters'), { statusCode: 400 })
  if (images.length > 8) throw Object.assign(new Error('Add no more than 8 gallery images'), { statusCode: 400 })
  if (variants.length === 0 || variants.length > 100) throw Object.assign(new Error('Add between 1 and 100 product variants'), { statusCode: 400 })

  const validateImageUrl = (value) => {
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    } catch {
      throw Object.assign(new Error('Enter valid http or https image URLs'), { statusCode: 400 })
    }
  }
  validateImageUrl(image)
  const cleanImages = images.map((entry) => typeof entry === 'string' ? entry.trim() : '')
  cleanImages.forEach(validateImageUrl)

  const cleanVariants = variants.map((variant) => {
    const size = typeof variant.size === 'string' ? variant.size.trim() : ''
    const color = typeof variant.color === 'string' ? variant.color.trim() : ''
    const colorValue = typeof variant.colorValue === 'string' ? variant.colorValue.trim() : '#d6c8b4'
    const stock = Number(variant.stock)
    const variantActive = variant.active === undefined ? true : variant.active
    if (size.length > 20 || color.length > 40) throw Object.assign(new Error('Variant size or color is too long'), { statusCode: 400 })
    if (!Number.isSafeInteger(stock) || stock < 0) throw Object.assign(new Error('Variant stock must be a non-negative whole number'), { statusCode: 400 })
    if (typeof variantActive !== 'boolean' || !/^#[a-f\d]{6}$/i.test(colorValue)) throw Object.assign(new Error('Enter a valid variant status and color'), { statusCode: 400 })
    return { id: typeof variant.id === 'string' ? variant.id : '', size, color, colorValue, stock, active: variantActive }
  })
  const uniqueVariants = new Set(cleanVariants.map(({ size, color }) => `${size.toLowerCase()}\u0000${color.toLowerCase()}`))
  if (uniqueVariants.size !== cleanVariants.length) throw Object.assign(new Error('Each size and color combination must be unique'), { statusCode: 400 })
  const variantIds = cleanVariants.map((variant) => variant.id).filter(Boolean)
  if (new Set(variantIds).size !== variantIds.length) throw Object.assign(new Error('A product variant cannot be submitted more than once'), { statusCode: 400 })

  return { name, category, image, images: cleanImages, description, fabricAndCare, priceLkr, tag, active, variants: cleanVariants }
}

const productValuesWithStableVariants = (body, existingVariants = []) => {
  const values = validateProduct(body)
  const existingById = new Map(existingVariants.map((variant) => [variant._id.toString(), variant]))
  const includedIds = new Set()
  const variants = values.variants.map(({ id, ...variant }) => {
    const existing = existingById.get(id)
    if (!existing) return variant
    includedIds.add(id)
    return { ...variant, _id: existing._id }
  })

  for (const existing of existingVariants) {
    if (!includedIds.has(existing._id.toString())) {
      variants.push({ ...existing.toObject(), active: false })
    }
  }

  return {
    ...values,
    stock: variants.reduce((total, variant) => total + (variant.active ? variant.stock : 0), 0),
    variants,
  }
}

const buildVoucherValues = (body) => {
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  const type = body.type
  const value = Number(body.value)
  const active = body.active !== false
  const expiresAt = body.expiresAt
    ? new Date(`${String(body.expiresAt).slice(0, 10)}T23:59:59.999Z`)
    : null
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw Object.assign(new Error('Voucher code must be 3–40 letters, numbers, _ or -'), { statusCode: 400 })
  if (!['percent', 'amount'].includes(type)) throw Object.assign(new Error('Choose a percentage or fixed LKR discount'), { statusCode: 400 })
  if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) throw Object.assign(new Error('Enter a valid voucher value'), { statusCode: 400 })
  if (expiresAt && Number.isNaN(expiresAt.getTime())) throw Object.assign(new Error('Enter a valid expiry date'), { statusCode: 400 })
  return { code, type, value, active, expiresAt }
}

export const getDashboardSummary = async (req, res) => {
  const [products, activeProducts, lowStock, orders, customers, pendingOrders, revenue] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ active: true }),
    Product.countDocuments({ active: true, stock: { $lte: 5 } }),
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ status: { $in: ['placed', 'processing'] } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ])
  res.json({
    success: true,
    summary: {
      products,
      activeProducts,
      lowStock,
      orders,
      customers,
      pendingOrders,
      paidRevenueLkr: revenue[0]?.total || 0,
    },
  })
}

export const listProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 })
  res.json({ success: true, products: products.map(serializeProduct) })
}

export const createProduct = async (req, res) => {
  const product = await Product.create(productValuesWithStableVariants(req.body))
  res.status(201).json({ success: true, product: serializeProduct(product) })
}

export const updateProduct = async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  const existing = await Product.findById(req.params.id)
  if (!existing) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  const product = await Product.findByIdAndUpdate(req.params.id, productValuesWithStableVariants(req.body, existing.variants), {
    new: true,
    runValidators: true,
  })
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  res.json({ success: true, product: serializeProduct(product) })
}

export const deleteProduct = async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true })
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  res.json({ success: true, product: serializeProduct(product) })
}

export const listOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(200)
  res.json({ success: true, orders: orders.map(serializeOrder) })
}

export const updateOrderStatus = async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
  const { status } = req.body
  if (!orderStatuses.includes(status)) throw Object.assign(new Error('Invalid order status'), { statusCode: 400 })
  if (status === 'cancelled' && !req.body.confirmCancellation) {
    throw Object.assign(new Error('Confirm order cancellation'), { statusCode: 400 })
  }
  const before = status === 'cancelled'
    ? await Order.findOneAndUpdate(
        { _id: req.params.id, status: { $ne: 'cancelled' } },
        { status, cancelledAt: new Date() },
        { new: true, runValidators: true },
      ).populate('user', 'name email')
    : await Order.findOneAndUpdate(
        { _id: req.params.id, status: { $ne: 'cancelled' } },
        { status },
        { new: true, runValidators: true },
      ).populate('user', 'name email')
  const order = before
  if (!order) throw Object.assign(new Error('Order not found or already cancelled'), { statusCode: 404 })
  if (status === 'cancelled') {
    await restoreOrderInventory(order.items)
  }
  res.json({ success: true, order: serializeOrder(order) })
}

export const listCustomers = async (req, res) => {
  const customers = await User.find({ role: 'user' }).select('name email createdAt').sort({ createdAt: -1 }).limit(500)
  const orderCounts = await Order.aggregate([
    { $group: { _id: '$user', orderCount: { $sum: 1 }, spentLkr: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } } } },
  ])
  const totals = new Map(orderCounts.map((entry) => [entry._id.toString(), entry]))
  res.json({
    success: true,
    customers: customers.map((customer) => {
      const totalsForCustomer = totals.get(customer._id.toString())
      return {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        joinedAt: customer.createdAt,
        orderCount: totalsForCustomer?.orderCount || 0,
        spentLkr: totalsForCustomer?.spentLkr || 0,
      }
    }),
  })
}

export const listVouchers = async (req, res) => {
  const vouchers = await Voucher.find().sort({ createdAt: -1 })
  res.json({ success: true, vouchers: vouchers.map(serializeVoucher) })
}

export const createVoucher = async (req, res) => {
  const voucher = await Voucher.create(buildVoucherValues(req.body))
  res.status(201).json({ success: true, voucher: serializeVoucher(voucher) })
}

export const updateVoucher = async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw Object.assign(new Error('Voucher not found'), { statusCode: 404 })
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, buildVoucherValues(req.body), {
    new: true,
    runValidators: true,
  })
  if (!voucher) throw Object.assign(new Error('Voucher not found'), { statusCode: 404 })
  res.json({ success: true, voucher: serializeVoucher(voucher) })
}

export const deleteVoucher = async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw Object.assign(new Error('Voucher not found'), { statusCode: 404 })
  const voucher = await Voucher.findByIdAndDelete(req.params.id)
  if (!voucher) throw Object.assign(new Error('Voucher not found'), { statusCode: 404 })
  res.json({ success: true })
}
