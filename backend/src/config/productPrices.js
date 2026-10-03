// Keep this index-aligned with the product catalog in glam-cart/src/components/shop/ShopPage.jsx.
export const productPricesUsd = [
  30, 30, 30, 30, 30, 30, 20, 20, 20, 30, 30, 30, 20, 19, 30, 34, 42, 28, 75, 36, 32,
  18, 39, 44, 58, 22, 26, 19, 24, 29, 52, 68, 24, 55, 35, 27, 16, 48, 21, 14, 18, 33,
]

export const usdToLkr = 110

export function getProductPriceLkr(index) {
  if (!Number.isInteger(index) || index < 0 || index >= productPricesUsd.length) {
    throw new Error('Invalid product selection')
  }
  return Math.round(productPricesUsd[index] * usdToLkr)
}
