import { useSiteContent } from '../context/SiteContentContext'

export default function Newsletter() {
  const { content } = useSiteContent()
  return (
    <section className="bg-sand border-y border-cream-dark">
      <div className="w-full px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-xl text-ink">{content.newsletter.title}</h3>
          <p className="text-sm text-stone">{content.newsletter.description}</p>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex w-full md:w-auto items-center bg-cream rounded-full border border-cream-dark overflow-hidden"
        >
          <input
            type="email"
            required
            placeholder={content.newsletter.placeholder}
            className="flex-1 md:w-72 px-5 py-3 text-sm bg-transparent outline-none placeholder:text-stone"
          />
          <button
            type="submit"
            className="bg-charcoal text-cream text-sm font-medium px-6 py-3 hover:bg-ink transition-colors"
          >
            {content.newsletter.button} →
          </button>
        </form>
      </div>
    </section>
  )
}
