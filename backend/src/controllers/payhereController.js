import crypto from 'crypto'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { sendOrderConfirmation } from '../utils/sendOrderConfirmation.js'

const md5Upper = (value) =>
  crypto.createHash('md5').update(value).digest('hex').toUpperCase()

const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)

function getConfig() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET
  const serverUrl = process.env.SERVER_URL
  if (!merchantId || !merchantSecret || !serverUrl) {
    throw Object.assign(new Error('PayHere is not configured on the server'), { statusCode: 500 })
  }
  return {
    merchantId,
    merchantSecret,
    serverUrl: serverUrl.replace(/\/+$/, ''),
    sandbox: process.env.PAYHERE_MODE !== 'live',
  }
}

// Payment eka confirm unama confirmation email eka yawanawa
async function sendPaidConfirmation(order) {
  try {
    const user = await User.findById(order.user)
    if (!user?.email) return
    order.confirmationEmailStatus = await sendOrderConfirmation(order, user.email)
  } catch (error) {
    order.confirmationEmailStatus = 'failed'
    console.error(`Order confirmation email failed for ${order._id}: ${error.message}`)
  }
  await order.save()
}

// POST /api/payhere/start  (login wela inna user ekata)
export const startPayment = async (req, res) => {
  const { orderId } = req.body
  if (!isObjectId(orderId)) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 })
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id })
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
  if (order.payment !== 'Card Payment') {
    throw Object.assign(new Error('This order is not a card payment order'), { statusCode: 400 })
  }
  if (order.status !== 'placed') {
    throw Object.assign(new Error('This order has been cancelled'), { statusCode: 400 })
  }
  if (order.paymentStatus === 'paid') {
    throw Object.assign(new Error('This order is already paid'), { statusCode: 400 })
  }

  const { merchantId, merchantSecret, serverUrl, sandbox } = getConfig()
  const clientUrl = process.env.CLIENT_URL || req.get('origin')
  let clientOrigin
  try {
    const parsedClientUrl = new URL(clientUrl)
    if (!['http:', 'https:'].includes(parsedClientUrl.protocol)) throw new Error()
    clientOrigin = parsedClientUrl.origin
  } catch {
    throw Object.assign(new Error('Set a valid CLIENT_URL or send a valid browser origin'), { statusCode: 500 })
  }

  const currency = 'LKR'
  const orderRef = order._id.toString()
  // Amount eka DB eken. Frontend eken kisima amount ekak ganne naha
  const amount = Number(order.total).toFixed(2)

  const hash = md5Upper(merchantId + orderRef + amount + currency + md5Upper(merchantSecret))

  const [firstName, ...restName] = String(order.customer.fullName).trim().split(/\s+/)

  res.json({
    success: true,
    payment: {
      sandbox,
      merchant_id: merchantId,
      return_url: `${clientOrigin}/order-success?orderId=${encodeURIComponent(orderRef)}`,
      cancel_url: `${clientOrigin}/order-success?orderId=${encodeURIComponent(orderRef)}&paymentCancelled=1`,
      notify_url: `${serverUrl}/api/payhere/notify`,
      order_id: orderRef,
      items: `Glam Cart Order GC${orderRef.slice(-8).toUpperCase()}`,
      amount,
      currency,
      hash,
      first_name: firstName || 'Customer',
      last_name: restName.join(' ') || '-',
      email: req.user.email,
      phone: order.customer.phone,
      address: order.customer.address,
      city: order.customer.city,
      country: 'Sri Lanka',
    },
  })
}

// POST /api/payhere/notify  (PayHere server eken enne. Login naha, signature eken verify karanawa)
export const handleNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = req.body

    const { merchantId, merchantSecret } = getConfig()

    if (merchant_id !== merchantId) {
      return res.status(400).send('Invalid merchant')
    }

    const localSig = md5Upper(
      String(merchant_id) +
        String(order_id) +
        String(payhere_amount) +
        String(payhere_currency) +
        String(status_code) +
        md5Upper(merchantSecret)
    )

    if (localSig !== md5sig) {
      return res.status(400).send('Invalid signature')
    }

    if (!isObjectId(order_id)) return res.status(404).send('Order not found')
    const order = await Order.findById(order_id)
    if (!order) return res.status(404).send('Order not found')

    if (
      payhere_currency !== 'LKR' ||
      Number(payhere_amount).toFixed(2) !== Number(order.total).toFixed(2)
    ) {
      return res.status(400).send('Amount mismatch')
    }

    const code = String(status_code)

    if (code === '2') {
      // Success
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid'
        order.paidAt = new Date()
        order.payherePaymentId = String(payment_id || '')
        await order.save()
        await sendPaidConfirmation(order)
      }
    } else if (order.paymentStatus !== 'paid') {
      // -1 = cancelled, -2 = failed
      if (code === '-1') {
        order.paymentStatus = 'cancelled'
        await order.save()
      } else if (code === '-2') {
        order.paymentStatus = 'failed'
        await order.save()
      }
    }

    return res.status(200).send('OK')
  } catch (error) {
    console.error(`PayHere notify error: ${error.message}`)
    return res.status(500).send('Server error')
  }
}