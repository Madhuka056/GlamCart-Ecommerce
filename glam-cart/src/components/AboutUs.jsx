import { Leaf, Recycle, Sparkles } from 'lucide-react'
import menImage from '../assets/categories/men.jpg'
import womenImage from '../assets/categories/women.jpg'
import heroImage from '../assets/hero3.jpeg'
import { useSiteContent } from '../context/SiteContentContext'

const valueIcons = [Leaf, Recycle, Sparkles]
const collageFallbacks = [womenImage, heroImage, menImage, womenImage]

export default function AboutUs() {
  const { content } = useSiteContent()
  const images = Array.from({ length: 4 }, (_, index) => content.about.images[index] || collageFallbacks[index])
  const values = content.about.values
  return (
    <section id="about-us" className="w-full overflow-hidden px-6 md:px-12 py-16 md:py-24 bg-[#f7f3ed]">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="about-collage grid grid-cols-[1.15fr_0.85fr] gap-4 items-start min-h-[440px] md:min-h-[560px]">
          <div className="space-y-4">
            <div className="about-image about-image-1 h-36 md:h-48 rounded-xl overflow-hidden bg-cream-dark">
              <img src={images[0]} alt="Glam Cart natural fashion collection" className="w-full h-full object-cover" />
            </div>
            <div className="about-image about-image-2 h-64 md:h-96 rounded-xl overflow-hidden bg-cream-dark">
              <img src={images[1]} alt="Glam Cart seasonal collection" className="w-full h-full object-cover object-center" />
            </div>
          </div>
          <div className="space-y-4 pt-10 md:pt-16">
            <div className="about-image about-image-3 h-44 md:h-60 rounded-xl overflow-hidden bg-cream-dark">
              <img src={images[2]} alt="Glam Cart everyday essentials" className="w-full h-full object-cover" />
            </div>
            <div className="about-image about-image-4 h-56 md:h-72 rounded-xl overflow-hidden bg-cream-dark">
              <img src={images[3]} alt="Glam Cart thoughtfully designed clothing" className="w-full h-full object-cover object-right" />
            </div>
          </div>
        </div>

        <div className="about-copy max-w-xl">
          <p className="about-copy-item text-xs uppercase tracking-[0.22em] text-terracotta font-semibold mb-4">{content.about.eyebrow}</p>
          <h2 className="about-copy-item about-copy-delay-1 font-display text-3xl md:text-5xl leading-tight text-ink mb-4">{content.about.title}</h2>
          <p className="about-copy-item about-copy-delay-2 text-base text-stone leading-relaxed mb-8">
            {content.about.description}
          </p>

          <div className="space-y-5 mb-9">
            {values.map(({ title, text }, index) => {
              const Icon = valueIcons[index % valueIcons.length]
              return (
              <div key={title} className={`about-value about-value-${index + 1} flex items-center gap-4`}>
                <Icon size={28} strokeWidth={1.4} className="text-charcoal shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="text-sm text-stone mt-1">{text}</p>
                </div>
              </div>
              )
            })}
          </div>

          <a href="#shop" className="about-cta inline-flex items-center justify-center bg-charcoal text-cream px-7 py-3 rounded-md text-sm font-medium hover:bg-ink hover:-translate-y-1 transition-all">
            {content.about.button}
          </a>
        </div>
      </div>
    </section>
  )
}
