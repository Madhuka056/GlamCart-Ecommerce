import mongoose from 'mongoose'

const productVariantSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true, maxlength: 20, default: '' },
    color: { type: String, trim: true, maxlength: 40, default: '' },
    colorValue: { type: String, trim: true, match: /^#[a-f\d]{6}$/i, default: '#d6c8b4' },
    stock: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    priceLkr: { type: Number, required: true, min: 1 },
    tag: { type: String, enum: ['', 'New', 'Sale'], default: '' },
    image: { type: String, required: true, trim: true, maxlength: 2048 },
    images: { type: [String], default: [] },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    fabricAndCare: { type: String, trim: true, maxlength: 2000, default: '' },
    variants: { type: [productVariantSchema], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true, index: true },
    legacyIndex: { type: Number, min: 0, unique: true, sparse: true },
  },
  { timestamps: true }
)

const Product = mongoose.model('Product', productSchema)
export default Product
