import { Leaf, Truck, Sparkles, Recycle, Heart, Quote } from 'lucide-react'

const points = [
  { icon: Leaf, label: 'Premium Fabrics' },
  { icon: Recycle, label: 'Sustainable Fabrics' },
  { icon: Sparkles, label: 'Trendy Releases' },
  { icon: Truck, label: 'Fast & Reliable Delivery' },
  { icon: Heart, label: 'Easy Returns' },
  { icon: Quote, label: 'Loved by Thousands' },
]

export default function WhyChooseUs() {
  return (
    <section className="w-full px-6 md:px-12 py-12">
      <h2 className="font-display text-2xl text-ink mb-8">Why Choose Glam Cart?</h2>
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="grid grid-cols-3 gap-6">
          {points.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <Icon size={22} strokeWidth={1.5} className="text-terracotta" />
              <span className="text-xs text-stone leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <div className="relative rounded-xl overflow-hidden bg-cream-dark">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=700&auto=format&fit=crop"
            alt="Customer wearing Glam Cart styles"
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-cream/95 rounded-lg p-4">
            <p className="text-sm italic text-ink leading-snug">
              "Fashion is not just what you wear, but how you feel."
            </p>
            <p className="text-xs text-stone mt-1">— Glam Cart</p>
          </div>
        </div>
      </div>
    </section>
  )
}
