import Product from '../models/Product.js'

const toProduct = (product) => ({
  id: product._id.toString(),
  legacyIndex: product.legacyIndex ?? null,
  name: product.name,
  category: product.category,
  priceLkr: product.priceLkr,
  tag: product.tag,
  image: product.image,
  images: product.images || [],
  description: product.description || '',
  fabricAndCare: product.fabricAndCare || '',
  variants: (product.variants || [])
    .filter((variant) => variant.active)
    .map((variant) => ({
      id: variant._id.toString(),
      size: variant.size,
      color: variant.color,
      colorValue: variant.colorValue,
      stock: variant.stock,
    })),
  stock: product.stock,
})

export const getProducts = async (req, res) => {
  const products = await Product.find({ active: true }).sort({ legacyIndex: 1, createdAt: -1 })
  res.json({ success: true, products: products.map(toProduct) })
}
