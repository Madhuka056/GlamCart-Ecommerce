import mongoose from 'mongoose'

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    contentVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const SiteContent = mongoose.model('SiteContent', siteContentSchema)
export default SiteContent
