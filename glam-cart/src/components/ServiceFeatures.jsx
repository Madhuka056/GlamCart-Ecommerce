import { Truck, RotateCcw, ShieldCheck, BadgeCheck } from 'lucide-react'
import { useSiteContent } from '../context/SiteContentContext'

const featureIcons = [Truck, RotateCcw, ShieldCheck, BadgeCheck]

const borderClasses = [
  '',
  'border-l-2 border-stone/30',
  'border-t-2 border-stone/30 md:border-t-0 md:border-l-2',
  'border-t-2 border-l-2 border-stone/30 md:border-t-0',
]

export default function ServiceFeatures() {
  const { content } = useSiteContent()
  return (
    <section className="border-b border-cream-dark bg-cream">
      <div className="w-full px-6 md:px-12 py-8 grid grid-cols-2 md:grid-cols-4">
        {content.serviceFeatures.map(({ title, subtitle }, i) => {
          const Icon = featureIcons[i % featureIcons.length]
          return (
          <div
            key={title}
            className={`flex items-center gap-3 py-4 px-4 md:px-6 ${borderClasses[i]}`}
          >
            <Icon size={26} strokeWidth={1.5} className="text-terracotta shrink-0" />
            <div>
              <p className="text-sm font-semibold text-ink leading-tight">{title}</p>
              <p className="text-xs text-stone">{subtitle}</p>
            </div>
          </div>
          )
        })}
      </div>
    </section>
  )
}