export default function TopBar({ compact = false }) {
  if (compact) {
    return (
      <div className="bg-cream text-ink text-xs border-b border-cream-dark">
        <div className="w-full px-6 md:px-12 py-2 flex items-center justify-end">
          <a href="#track" className="hover:text-terracotta transition-colors">Track Order</a>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden md:block bg-charcoal text-cream text-xs">
      <div className="w-full px-6 md:px-12 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6 tracking-wide">
          <span>Island wide orders, weekly on all orders</span>
          <span>Easy 7 day returns</span>
          <span>New arrivals every week</span>
        </div>
        <div className="flex items-center gap-4 tracking-wide">
          <a href="#help" className="hover:text-terracotta transition-colors">
            Help
          </a>
          <a href="#track" className="hover:text-terracotta transition-colors">
            Track Order
          </a>
          <span>Sri Lanka / LKR</span>
        </div>
      </div>
    </div>
  )
}
