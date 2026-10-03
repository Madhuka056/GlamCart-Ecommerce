import { toLkr } from './currency'

// Shipping zones for Sri Lanka (island-wide delivery).
// The configured demo fees are USD values converted to LKR for checkout.
// Later, the backend should recompute the fee with the same logic so it can't be tampered with.

export const SHIPPING_ZONES = {
  colombo: { label: 'Colombo Area', fee: 2, days: [1, 2] },
  main: { label: 'Main Cities', fee: 3, days: [2, 4] },
  far: { label: 'Other Districts', fee: 4, days: [3, 6] },
}

const districtsByZone = {
  colombo: ['Colombo', 'Gampaha', 'Kalutara'],
  main: ['Kandy', 'Matale', 'Galle', 'Matara', 'Kurunegala', 'Puttalam', 'Kegalle', 'Ratnapura'],
  far: [
    'Nuwara Eliya',
    'Hambantota',
    'Jaffna',
    'Kilinochchi',
    'Mannar',
    'Vavuniya',
    'Mullaitivu',
    'Batticaloa',
    'Ampara',
    'Trincomalee',
    'Anuradhapura',
    'Polonnaruwa',
    'Badulla',
    'Monaragala',
  ],
}

// { Colombo: 'colombo', Kandy: 'main', ... }
export const DISTRICT_ZONES = Object.entries(districtsByZone).reduce((map, [zone, districts]) => {
  districts.forEach((district) => {
    map[district] = zone
  })
  return map
}, {})

// All 25 districts, alphabetical (for the dropdown)
export const DISTRICTS = Object.keys(DISTRICT_ZONES).sort()

// Returns the fee for a district, or null if no district is selected / unknown
export function getShippingFee(district) {
  const zone = DISTRICT_ZONES[district]
  return zone ? toLkr(SHIPPING_ZONES[zone].fee) : null
}

// Estimated delivery window as text, e.g. "Oct 2 - Oct 5". Returns null if no district is selected.
export function getDeliveryEstimate(district) {
  const zone = DISTRICT_ZONES[district]
  if (!zone) return null
  const [minDays, maxDays] = SHIPPING_ZONES[zone].days
  const format = (offset) => {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return `${format(minDays)} - ${format(maxDays)}`
}