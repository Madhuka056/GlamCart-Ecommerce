import nodemailer from 'nodemailer'

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })

const formatMoney = (amount) => `Rs. ${Math.round(amount).toLocaleString('en-LK')}`

export async function sendOrderConfirmation(order, recipient) {
  const gmailUser = process.env.GMAIL_USER?.trim()
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '')
  if (!gmailUser || !gmailAppPassword) return 'not_configured'

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })

  const orderNumber = `GC${order._id.toString().slice(-8).toUpperCase()}`
  const itemsHtml = order.items
    .map((item) => {
      const options = [item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
        .filter(Boolean)
        .join(' · ')
      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #e7dfd3">
          <strong>${escapeHtml(item.name)}</strong>
          ${options ? `<br><span style="color:#777">${escapeHtml(options)}</span>` : ''}
        </td>
        <td style="padding:12px;border-bottom:1px solid #e7dfd3;text-align:center">${item.quantity}</td>
        <td style="padding:12px;border-bottom:1px solid #e7dfd3;text-align:right">${formatMoney(item.price * item.quantity)}</td>
      </tr>`
    })
    .join('')

  const html = `
    <div style="font-family:Arial,sans-serif;color:#252525;max-width:640px;margin:auto">
      <h1 style="color:#6d7550">Thank you for your order, ${escapeHtml(order.customer.fullName)}!</h1>
      <p>Your Glam Cart order <strong>${orderNumber}</strong> has been placed successfully.</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="padding:12px;text-align:left">Item</th>
          <th style="padding:12px">Qty</th>
          <th style="padding:12px;text-align:right">Price</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p>Items total: ${formatMoney(order.subtotal)}<br>
      Delivery fee: ${formatMoney(order.shippingFee)}<br>
      ${order.discount > 0 ? `Discount: -${formatMoney(order.discount)}<br>` : ''}
      <strong>Order total: ${formatMoney(order.total)}</strong></p>
      <p><strong>Payment:</strong> ${escapeHtml(order.payment || 'Cash on Delivery')}</p>
      <p><strong>Delivery to:</strong><br>
      ${escapeHtml(order.customer.fullName)}<br>
      ${escapeHtml(order.customer.address)}, ${escapeHtml(order.customer.city)}, ${escapeHtml(order.customer.district)}
      ${order.customer.postalCode ? ` ${escapeHtml(order.customer.postalCode)}` : ''}<br>
      ${escapeHtml(order.customer.phone)}</p>
      <p><strong>Estimated delivery:</strong> ${escapeHtml(order.deliveryEstimate)}</p>
      <p style="color:#777;font-size:12px">This is an automatic order confirmation from Glam Cart.</p>
    </div>`

  await transporter.sendMail({
    from: `"Glam Cart" <${gmailUser}>`,
    to: recipient,
    subject: `Glam Cart order confirmation ${orderNumber}`,
    html,
  })

  return 'sent'
}
