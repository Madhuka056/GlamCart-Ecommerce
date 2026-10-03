import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true, min: 0 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    image: { type: String, required: true, maxlength: 2048 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 100 },
    size: { type: String, trim: true, maxlength: 20 },
    color: { type: String, trim: true, maxlength: 40 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer: {
      fullName: { type: String, required: true, trim: true, maxlength: 100 },
      phone: { type: String, required: true, trim: true, maxlength: 30 },
      address: { type: String, required: true, trim: true, maxlength: 300 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      district: { type: String, required: true, trim: true, maxlength: 100 },
      postalCode: { type: String, trim: true, maxlength: 20, default: '' },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0 && items.length <= 100,
        message: 'An order must contain between 1 and 100 items',
      },
    },
    payment: { type: String, required: true, enum: ['Cash on Delivery', 'Bank Transfer'] },
    paymentDetails: {
      bankName: { type: String, trim: true, maxlength: 120, default: '' },
      accountName: { type: String, trim: true, maxlength: 120, default: '' },
      accountNumber: { type: String, trim: true, maxlength: 80, default: '' },
      branch: { type: String, trim: true, maxlength: 120, default: '' },
      reference: { type: String, trim: true, maxlength: 80, default: '' },
      slipName: { type: String, trim: true, maxlength: 200, default: '' },
      slipDataUrl: { type: String, trim: true, maxlength: 7500000, default: '' },
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    voucher: { type: String, trim: true, uppercase: true, maxlength: 40, default: null },
    total: { type: Number, required: true, min: 0 },
    deliveryEstimate: { type: String, required: true, trim: true, maxlength: 80 },
    status: {
      type: String,
      enum: ['placed', 'cancelled'],
      default: 'placed',
      index: true,
    },
    cancelledAt: { type: Date, default: null },
    confirmationEmailStatus: {
      type: String,
      enum: ['sent', 'failed', 'not_configured'],
      default: 'not_configured',
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
