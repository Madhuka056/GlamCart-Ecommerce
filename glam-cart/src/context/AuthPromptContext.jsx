import { createContext, useCallback, useContext, useState } from 'react'
import AuthModal from '../components/AuthModal'

const AuthPromptContext = createContext(null)

export function AuthPromptProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  const openAuthPrompt = useCallback((promptMessage = '') => {
    setMessage(promptMessage)
    setIsOpen(true)
  }, [])

  const closeAuthPrompt = useCallback(() => setIsOpen(false), [])

  return (
    <AuthPromptContext.Provider value={{ openAuthPrompt }}>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeAuthPrompt} promptMessage={message} />
    </AuthPromptContext.Provider>
  )
}

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext)
  if (!context) throw new Error('useAuthPrompt must be used within an AuthPromptProvider')
  return context
}
