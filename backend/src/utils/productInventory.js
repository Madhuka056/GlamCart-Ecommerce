import Product from '../models/Product.js'

export async function restoreProductStock(productId, variantId, quantity) {
  if (!variantId) {
    await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
    return
  }

  const activeVariant = await Product.updateOne(
    { _id: productId, variants: { $elemMatch: { _id: variantId, active: true } } },
    { $inc: { stock: quantity, 'variants.$[variant].stock': quantity } },
    { arrayFilters: [{ 'variant._id': variantId, 'variant.active': true }] },
  )
  if (activeVariant.matchedCount) return

  const inactiveVariant = await Product.updateOne(
    { _id: productId, variants: { $elemMatch: { _id: variantId } } },
    { $inc: { 'variants.$[variant].stock': quantity } },
    { arrayFilters: [{ 'variant._id': variantId }] },
  )
  if (!inactiveVariant.matchedCount) {
    throw new Error(`Cannot restore inventory: product variant ${variantId} no longer exists`)
  }
}

export async function restoreOrderInventory(items) {
  await Promise.all(items.filter((item) => item.productId).map(async (item) => {
    let variantId = item.variantId
    if (!variantId && (item.size || item.color)) {
      const product = await Product.findById(item.productId).select('variants')
      const variant = product?.variants.find((entry) => entry.size === item.size && entry.color === item.color)
        || (product?.variants.length === 1 ? product.variants[0] : null)
      variantId = variant?._id.toString() || ''
    }
    await restoreProductStock(item.productId, variantId, item.quantity)
  }))
}
