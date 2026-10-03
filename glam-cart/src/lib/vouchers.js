import { formatLkr, toLkr } from './currency'

// Demo vouchers (frontend only). Real validation will move to the backend later.
export const VOUCHERS = {
  GLAM10: { type: 'percent', value: 10, label: '10% off' },
  WELCOME5: { type: 'amount', value: 5, label: `${formatLkr(toLkr(5))} off` },
}

// voucher = { type, value } or null
export function getDiscount(voucher, subtotal) {
  if (!voucher) return 0
  const raw = voucher.type === 'percent'
    ? Math.round((subtotal * voucher.value) / 100)
    : toLkr(voucher.value)
  return Math.min(subtotal, raw)
}