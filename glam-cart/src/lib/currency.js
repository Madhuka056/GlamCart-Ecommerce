export const USD_TO_LKR = 110

export const toLkr = (amount) => Math.round(amount * USD_TO_LKR)

export const formatLkr = (amount) => `Rs. ${Math.round(amount).toLocaleString('en-LK')}`
