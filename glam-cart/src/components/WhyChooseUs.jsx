import { Leaf, Truck, Sparkles, Recycle, Heart, Quote } from 'lucide-react'
import { useSiteContent } from '../context/SiteContentContext'

const pointIcons = [Leaf, Recycle, Sparkles, Truck, Heart, Quote]

export default function WhyChooseUs() {
  const { content } = useSiteContent()
  return (
    <section className="w-full px-6 md:px-12 py-12">
      <h2 className="font-display text-2xl text-ink mb-8">{content.whyChooseUs.title}</h2>
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="grid grid-cols-3 gap-6">
          {content.whyChooseUs.points.map((label, index) => {
            const Icon = pointIcons[index % pointIcons.length]
            return (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <Icon size={22} strokeWidth={1.5} className="text-terracotta" />
              <span className="text-xs text-stone leading-tight">{label}</span>
            </div>
            )
          })}
        </div>

        <div className="relative rounded-xl overflow-hidden bg-cream-dark">
          <img
            src={content.whyChooseUs.image}
            alt={content.whyChooseUs.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-cream/95 rounded-lg p-4">
            <p className="text-sm italic text-ink leading-snug">
              “{content.whyChooseUs.quote}”
            </p>
            <p className="text-xs text-stone mt-1">— {content.whyChooseUs.attribution}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
