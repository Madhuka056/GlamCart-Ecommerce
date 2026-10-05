import Voucher from '../models/Voucher.js'

export const validateVoucher = async (req, res) => {
  const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : ''
  const voucher = await Voucher.findOne({
    code,
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
  if (!voucher) throw Object.assign(new Error('Invalid or expired voucher code'), { statusCode: 404 })
  res.json({ success: true, voucher: { code: voucher.code, type: voucher.type, value: voucher.value } })
}

export const getActiveVouchers = async (req, res) => {
  const vouchers = await Voucher.find({
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).select('code type value')
  res.json({ success: true, vouchers })
}
