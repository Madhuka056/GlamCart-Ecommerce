import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import heroImage from '../assets/hero1.jpg'
import modelsImage from '../assets/hero2.jpg'
import secondHeroImage from '../assets/hero3.jpeg'
import { useSiteContent } from '../context/SiteContentContext'

const defaultHeroImages = [heroImage, modelsImage, secondHeroImage]

export default function Hero() {
  const navigate = useNavigate()
  const { content } = useSiteContent()
  const heroImages = content.hero.slides.map((slide, index) => ({
    src: slide.image || defaultHeroImages[index % defaultHeroImages.length],
    alt: slide.alt,
  }))
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % content.hero.slides.length)
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [content.hero.slides.length])

  const scrollToFeatured = () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="home-hero" className="relative w-full h-[520px] md:h-[720px] overflow-hidden bg-charcoal">
      {heroImages.map((image, index) => (
        <img
          key={`${image.src}-${index}`}
          src={image.src}
          alt={image.alt}
          aria-hidden={index !== activeImage % heroImages.length}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === 0
              ? 'hero-image object-[0%_40%] md:object-[center_40%]'
              : index === 1
                ? 'hero-image-models object-[center_30%]'
                : 'object-[75%_18%] md:object-[center_top]'
          } ${
            index === activeImage % heroImages.length ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/90 via-charcoal/30 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.38)_0%,transparent_28%,transparent_68%,rgba(15,15,15,0.32)_100%)]" />

      <div className="relative z-10 h-full w-full px-6 md:px-16 flex items-center text-left">
        <div className="hero-copy max-w-lg">
          <span className="hero-item inline-block bg-terracotta/80 text-sand/85 text-xs tracking-wide px-3 py-1.5 rounded-full mb-6">
            {content.hero.eyebrow}
          </span>
          <h1 className="hero-item hero-item-delay-1 font-display text-4xl sm:text-6xl leading-tight text-cream mb-5">
            {content.hero.titleLine1}
            <br />
            {content.hero.titleLine2}
          </h1>
          <p className="hero-item hero-item-delay-2 text-cream/85 max-w-md mb-8 leading-relaxed">
            {content.hero.description}
          </p>
          <div className="hero-item hero-item-delay-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 bg-cream-dark text-ink px-6 py-3 rounded-full text-sm font-medium hover:bg-terracotta hover:text-ink hover:-translate-y-0.5 transition-all"
            >
              {content.hero.primaryButton} <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={scrollToFeatured}
              className="inline-flex items-center gap-2 border border-cream text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-cream-dark hover:text-ink hover:-translate-y-0.5 transition-all"
            >
              {content.hero.secondaryButton} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}