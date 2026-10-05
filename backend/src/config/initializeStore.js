import initialCatalog from '../data/initialCatalog.json' with { type: 'json' }
import Product from '../models/Product.js'
import Voucher from '../models/Voucher.js'

export async function initializeStore() {
  if (!(await Product.exists({}))) {
    const products = initialCatalog.map(({ stock, ...product }) => ({ ...product, stock: 0 }))
    try {
      await Product.insertMany(products, { ordered: false })
    } catch (error) {
      if (error.code !== 11000) throw error
    }
  }

  const productsWithoutVariants = await Product.find({
    $or: [{ variants: { $exists: false } }, { variants: { $size: 0 } }],
  })
  await Promise.all(productsWithoutVariants.map(async (product) => {
    product.variants.push({ size: '', color: '', colorValue: '#d6c8b4', stock: product.stock, active: true })
    await product.save()
  }))

  await Promise.all([
    Voucher.updateOne(
      { code: 'GLAM10' },
      { $setOnInsert: { code: 'GLAM10', type: 'percent', value: 10, active: true } },
      { upsert: true },
    ),
    Voucher.updateOne(
      { code: 'WELCOME5' },
      { $setOnInsert: { code: 'WELCOME5', type: 'amount', value: 550, active: true } },
      { upsert: true },
    ),
  ])
}
