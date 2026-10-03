import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import menImage from '../assets/categories/men.jpg'
import womenImage from '../assets/categories/women.jpg'
import kidsImage from '../assets/categories/kids.jpg'
import shoesImage from '../assets/categories/shoes.jpg'

const categories = [
  { label: 'Men', img: menImage },
  { label: 'Women', img: womenImage },
  { label: 'Kids', img: kidsImage },
  { label: 'Footwear', img: shoesImage },
  { label: 'Accessories', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=300&auto=format&fit=crop' },
  { label: 'Cosmetics', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300&auto=format&fit=crop' },
]

const half = Math.ceil(categories.length / 2) // first 3 = left group, last 3 = right group

export default function Categories() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const element = sectionRef.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setReducedMotion(true)
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) {
          // Bumping this key forces the animated items to remount every
          // time the section re-enters the viewport, guaranteeing the
          // slide-in animation replays on every scroll pass (down or up).
          setPlayCount((count) => count + 1)
        }
      },
      { threshold: 0.2, rootMargin: '0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="collections" ref={sectionRef} className="w-full px-6 md:px-12 py-12 overflow-hidden">
      <style>{`
        @keyframes slideInFromLeft {
          from { transform: translateX(-140px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromRight {
          from { transform: translateX(140px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .cat-item-left {
          animation: slideInFromLeft 0.75s ease-out both;
        }
        .cat-item-right {
          animation: slideInFromRight 0.75s ease-out both;
        }
      `}</style>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
        {categories.map((cat, index) => {
          const fromLeft = index < half
          const animClass = reducedMotion ? '' : fromLeft ? 'cat-item-left' : 'cat-item-right'
          const style = reducedMotion
            ? undefined
            : {
                animationDelay: `${(fromLeft ? index : index - half) * 110}ms`,
                opacity: visible ? undefined : 0,
              }

          return (
            <Link
              // Changing the key on every viewport entry forces React to
              // remount this element, which restarts the CSS animation.
              key={`${cat.label}-${playCount}`}
              to={`/shop?category=${encodeURIComponent(cat.label)}`}
              className={`flex flex-col items-center gap-5 group ${visible ? animClass : ''}`}
              style={style}
            >
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden bg-cream-dark ring-4 ring-cream-dark group-hover:ring-terracotta transition-all duration-300 group-hover:scale-110">
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium text-ink transition-transform duration-300 group-hover:scale-110">{cat.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}