import { Leaf, Recycle, Sparkles } from 'lucide-react'
import menImage from '../assets/categories/men.jpg'
import womenImage from '../assets/categories/women.jpg'
import heroImage from '../assets/hero3.jpeg'

const values = [
  { icon: Leaf, title: 'Pure Materials', text: 'Breathable and carefully selected fabrics' },
  { icon: Recycle, title: 'Ethical Craft', text: 'Made with care and integrity' },
  { icon: Sparkles, title: 'Timeless Design', text: 'Simple styles made to last' },
]

export default function AboutUs() {
  return (
    <section id="about-us" className="w-full overflow-hidden px-6 md:px-12 py-16 md:py-24 bg-[#f7f3ed]">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="about-collage grid grid-cols-[1.15fr_0.85fr] gap-4 items-start min-h-[440px] md:min-h-[560px]">
          <div className="space-y-4">
            <div className="about-image about-image-1 h-36 md:h-48 rounded-xl overflow-hidden bg-cream-dark">
              <img src={womenImage} alt="Glam Cart natural fashion collection" className="w-full h-full object-cover" />
            </div>
            <div className="about-image about-image-2 h-64 md:h-96 rounded-xl overflow-hidden bg-cream-dark">
              <img src={heroImage} alt="Glam Cart seasonal collection" className="w-full h-full object-cover object-center" />
            </div>
          </div>
          <div className="space-y-4 pt-10 md:pt-16">
            <div className="about-image about-image-3 h-44 md:h-60 rounded-xl overflow-hidden bg-cream-dark">
              <img src={menImage} alt="Glam Cart everyday essentials" className="w-full h-full object-cover" />
            </div>
            <div className="about-image about-image-4 h-56 md:h-72 rounded-xl overflow-hidden bg-cream-dark">
              <img src={womenImage} alt="Glam Cart thoughtfully designed clothing" className="w-full h-full object-cover object-right" />
            </div>
          </div>
        </div>

        <div className="about-copy max-w-xl">
          <p className="about-copy-item text-xs uppercase tracking-[0.22em] text-terracotta font-semibold mb-4">Our Story</p>
          <h2 className="about-copy-item about-copy-delay-1 font-display text-3xl md:text-5xl leading-tight text-ink mb-4">Thoughtfully Designed, Sustainably Crafted.</h2>
          <p className="about-copy-item about-copy-delay-2 text-base text-stone leading-relaxed mb-8">
            We believe in creating beautiful pieces that fit naturally into everyday life, using considered materials and responsible practices wherever possible.
          </p>

          <div className="space-y-5 mb-9">
            {values.map(({ icon: Icon, title, text }, index) => (
              <div key={title} className={`about-value about-value-${index + 1} flex items-center gap-4`}>
                <Icon size={28} strokeWidth={1.4} className="text-charcoal shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="text-sm text-stone mt-1">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <a href="#shop" className="about-cta inline-flex items-center justify-center bg-charcoal text-cream px-7 py-3 rounded-md text-sm font-medium hover:bg-ink hover:-translate-y-1 transition-all">
            Discover More
          </a>
        </div>
      </div>
    </section>
  )
}
