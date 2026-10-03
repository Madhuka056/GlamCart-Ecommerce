import { useEffect, useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function SocialIcon({ type }) {
  if (type === 'apple') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.365 1.43c0 1.14-.44 2.06-1.32 2.87-.98.9-2.06 1.34-3.25 1.24-.12-1.1.42-2.13 1.3-2.94.87-.82 2.1-1.34 3.27-1.17Zm3.35 16.06c-.5 1.16-1.09 2.24-1.87 3.24-.92 1.18-1.68 2-2.28 2.44-.94.7-1.95 1.06-3.03 1.08-.78.02-1.72-.22-2.82-.72-1.1-.5-1.99-.74-2.67-.74-.7 0-1.6.24-2.7.74-1.1.5-1.99.75-2.67.77-1.05.04-2.06-.34-3.03-1.14C1.63 22.6.7 21.35.02 19.86c-.72-1.6-1.08-3.14-1.08-4.65 0-1.73.37-3.2 1.13-4.42.6-1 1.38-1.78 2.36-2.36.98-.58 2.03-.88 3.16-.9.87-.02 1.9.28 3.08.9.88.47 1.44.7 1.7.7.19 0 .8-.27 1.85-.8 1.02-.5 1.9-.7 2.65-.63 1.9.15 3.34.9 4.29 2.27-1.7 1.03-2.55 2.47-2.53 4.33.02 1.44.55 2.65 1.6 3.6.45.44.94.78 1.48 1.02-.12.35-.25.68-.4 1.02Z" />
      </svg>
    )
  }
  if (type === 'google') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M12 10.9v3.5h4.9c-.2 1.2-1.6 3.6-4.9 3.6-2.9 0-5.3-2.4-5.3-5.4s2.4-5.4 5.3-5.4c1.7 0 2.8.7 3.4 1.3l2.3-2.2C16.4 5 14.4 4 12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5-.1-.9-.1-1.3H12Z" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7C18.3 21.1 22 17 22 12Z" />
    </svg>
  )
}

// Hides each browser's own built-in password reveal icon so only our
// custom Eye / EyeOff button shows inside password fields.
function PasswordFieldResetStyles() {
  return (
    <style>{`
      input[type="password"]::-ms-reveal,
      input[type="password"]::-ms-clear {
        display: none;
      }
      input::-webkit-credentials-auto-fill-button,
      input::-webkit-strong-password-auto-fill-button {
        display: none !important;
        visibility: hidden;
        pointer-events: none;
        position: absolute;
        right: 0;
      }
    `}</style>
  )
}

const inputClass =
  'w-full bg-cream text-ink rounded-md px-4 py-3.5 text-sm outline-none border border-cream-dark focus:border-terracotta transition-colors'

const emptyLogin = { email: '', password: '' }
const emptySignup = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  newsletter: false,
  agree: false,
}

export default function AuthModal({ isOpen, onClose, promptMessage = '' }) {
  const { login, register } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [showSignupPass, setShowSignupPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [signupForm, setSignupForm] = useState(emptySignup)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset everything every time the modal is freshly opened
  useEffect(() => {
    if (isOpen) {
      setMode('login')
      setLoginForm(emptyLogin)
      setSignupForm(emptySignup)
      setError('')
      setSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const switchMode = (next) => {
    setMode(next)
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(loginForm.email, loginForm.password)
      onClose()
      window.location.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (!signupForm.firstName.trim()) return setError('First name is required')
    if (signupForm.password.length < 6)
      return setError('Password must be at least 6 characters')
    if (signupForm.password !== signupForm.confirmPassword)
      return setError('Passwords do not match')
    if (!signupForm.agree)
      return setError('Please agree to the Terms & Conditions')

    const fullName = `${signupForm.firstName} ${signupForm.lastName}`.trim()

    setSubmitting(true)
    try {
      await register(fullName, signupForm.email, signupForm.password)
      onClose()
      window.location.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <PasswordFieldResetStyles />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl bg-cream"
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-6 right-6 z-10 text-stone hover:text-terracotta transition-colors"
        >
          <X size={24} strokeWidth={1.75} />
        </button>

        <div className="px-10 sm:px-16 pt-12 pb-5 text-center">
          <span className="font-display text-4xl tracking-wide text-ink">Glam Cart</span>
        </div>

        {/* Tabs */}
        <div className="px-10 sm:px-16">
          <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-cream-dark">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-3.5 text-sm font-bold tracking-wide transition-colors ${
                mode === 'login'
                  ? 'bg-cream text-ink border-b-2 border-terracotta'
                  : 'bg-sand text-stone hover:text-ink'
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-3.5 text-sm font-bold tracking-wide transition-colors ${
                mode === 'signup'
                  ? 'bg-cream text-ink border-b-2 border-terracotta'
                  : 'bg-sand text-stone hover:text-ink'
              }`}
            >
              SIGN UP
            </button>
          </div>
        </div>

        <div className="px-10 sm:px-16 py-9">
          {mode === 'login' ? (
            <div>
              <h2 className="font-display text-3xl mb-1.5 text-ink">Welcome Back</h2>
              <p className="text-sm text-stone mb-7">
                {promptMessage || 'Log in to access your account, orders, and saved items.'}
              </p>

              <form className="space-y-4" onSubmit={handleLogin}>
                <input
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className={inputClass}
                />
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone hover:text-charcoal transition-colors"
                  >
                    {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="text-right">
                  <a href="#" className="text-xs text-stone hover:text-terracotta underline underline-offset-2">
                    Forgot Password?
                  </a>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-charcoal hover:bg-ink text-cream font-bold text-sm tracking-wide py-3.5 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'LOGGING IN...' : 'LOG IN'}
                </button>
              </form>

              <div className="flex items-center gap-3 my-7">
                <div className="h-px flex-1 bg-cream-dark" />
                <span className="text-[11px] tracking-widest text-stone">OR LOG IN WITH</span>
                <div className="h-px flex-1 bg-cream-dark" />
              </div>

              <div className="flex items-center justify-center gap-4 mb-2">
                {['apple', 'google', 'facebook'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-label={type}
                    className="w-12 h-12 rounded-full border border-cream-dark flex items-center justify-center text-charcoal hover:border-terracotta hover:text-terracotta transition-colors"
                  >
                    <SocialIcon type={type} />
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-stone mt-5">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="underline underline-offset-2 hover:text-terracotta font-bold text-ink"
                >
                  Sign Up
                </button>
              </p>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-3xl mb-1.5 text-ink">Join GlamCart</h2>
              <p className="text-sm text-stone mb-7">
                Create an account for personalized experiences, early access, and easy checkout.
              </p>

              <form className="space-y-4" onSubmit={handleSignup}>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    autoComplete="given-name"
                    required
                    value={signupForm.firstName}
                    onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    autoComplete="family-name"
                    value={signupForm.lastName}
                    onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <input
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className={inputClass}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type={showSignupPass ? 'text' : 'password'}
                      placeholder="Password"
                      autoComplete="new-password"
                      required
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-charcoal transition-colors"
                    >
                      {showSignupPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      required
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                      }
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-charcoal transition-colors"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-stone">
                    <input
                      type="checkbox"
                      checked={signupForm.newsletter}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, newsletter: e.target.checked })
                      }
                      className="accent-terracotta w-3.5 h-3.5"
                    />
                    Sign up for our newsletter?
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone">
                    <input
                      type="checkbox"
                      checked={signupForm.agree}
                      onChange={(e) => setSignupForm({ ...signupForm, agree: e.target.checked })}
                      className="accent-terracotta w-3.5 h-3.5"
                    />
                    I agree to{' '}
                    <a href="#" className="underline underline-offset-2 hover:text-terracotta">
                      Terms &amp; Conditions
                    </a>
                    .
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-terracotta hover:bg-terracotta/90 text-cream font-bold text-sm tracking-wide py-3.5 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <p className="text-center text-xs text-stone mt-6">
                Have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="underline underline-offset-2 hover:text-terracotta font-bold text-ink"
                >
                  Login
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}