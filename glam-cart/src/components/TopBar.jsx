import { useSiteContent } from '../context/SiteContentContext'

export default function TopBar({ compact = false }) {
  const { content } = useSiteContent()
  if (compact) {
    return (
      <div className="bg-cream text-ink text-xs border-b border-cream-dark">
        <div className="w-full px-6 md:px-12 py-2 flex items-center justify-end">
          <a href="/order-history" className="hover:text-terracotta transition-colors">{content.topBar.trackOrderLabel}</a>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden md:block bg-charcoal text-cream text-xs">
      <div className="w-full px-6 md:px-12 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6 tracking-wide">
          {content.topBar.messages.map((message, index) => <span key={`${index}-${message}`}>{message}</span>)}
        </div>
        <div className="flex items-center gap-4 tracking-wide">
          <a href="#help" className="hover:text-terracotta transition-colors">
            {content.topBar.helpLabel}
          </a>
          <a href="#track" className="hover:text-terracotta transition-colors">
            {content.topBar.trackOrderLabel}
          </a>
          <span>{content.topBar.currencyLabel}</span>
        </div>
      </div>
    </div>
  )
}
