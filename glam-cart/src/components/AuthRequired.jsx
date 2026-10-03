import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAuthPrompt } from '../context/AuthPromptContext'

export default function AuthRequired({ children, message }) {
  const { user, loading } = useAuth()
  const { openAuthPrompt } = useAuthPrompt()

  useEffect(() => {
    if (!loading && !user) openAuthPrompt(message)
  }, [loading, user, message, openAuthPrompt])

  if (loading || !user) {
    return (
      <main className="min-h-[60vh] bg-[#f7f3ed] px-6 flex flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl text-ink mb-2">Please sign in</h1>
        <p className="text-sm text-stone">{message}</p>
        {!loading && (
          <button
            type="button"
            onClick={() => openAuthPrompt(message)}
            className="mt-5 bg-charcoal text-cream text-sm font-semibold px-6 py-3 rounded-full hover:bg-ink transition-colors"
          >
            Log in or Sign up
          </button>
        )}
      </main>
    )
  }

  return children
}
