import mongoose from 'mongoose'

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 40 },
    type: { type: String, required: true, enum: ['percent', 'amount'] },
    value: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const Voucher = mongoose.model('Voucher', voucherSchema)
export default Voucher
