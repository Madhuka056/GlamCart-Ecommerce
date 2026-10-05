import { useNavigate } from 'react-router-dom'
import saleImage from '../assets/sale.jpg'
import discountImage from '../assets/discount.jpg'
import arrivalsImage from '../assets/newarrival.jpg'
import { useSiteContent } from '../context/SiteContentContext'

const defaultPromotionImages = [saleImage, discountImage, arrivalsImage]

const bannerThemes = {
  terracotta: 'bg-terracotta',
  sand: 'bg-sand',
  olive: 'bg-olive',
}

export default function PromoBanners() {
  const navigate = useNavigate()
  const { content } = useSiteContent()
  const openPromotion = (promotion) => {
    if (promotion.target === 'tag') navigate(`/shop?tag=${encodeURIComponent(promotion.value)}`)
    else if (promotion.target === 'category') navigate(`/shop?category=${encodeURIComponent(promotion.value)}`)
    else if (promotion.target === 'about') document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' })
    else if (promotion.target === 'home') navigate('/')
    else navigate('/shop')
  }

  return (
    <section className="w-full px-6 md:px-12 py-10">
      <div className="grid md:grid-cols-3 gap-4">
        {content.promotions.map((b, index) => (
          <div
            key={`${b.title}-${index}`}
            className={`${bannerThemes[b.theme]} text-cream relative overflow-hidden rounded-xl p-7 min-h-[200px] flex flex-col justify-between bg-cover bg-center`}
            style={{ backgroundImage: `linear-gradient(50deg, rgba(25, 23, 20, 0.72), rgba(25, 23, 20, 0.12)), url("${b.image || defaultPromotionImages[index % defaultPromotionImages.length]}")` }}
          >
            <div>
              <h3 className="font-display text-2xl mb-2">{b.title}</h3>
              <p className="text-sm opacity-85 max-w-[220px]">{b.subtitle}</p>
            </div>
            <button type="button" onClick={() => openPromotion(b)} className="self-start mt-4 bg-charcoal text-cream text-xs font-medium px-4 py-2 rounded-full hover:bg-ink transition-colors">
              {b.button} →
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
