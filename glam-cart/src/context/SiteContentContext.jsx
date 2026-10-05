import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import siteContentDefaults from '../../../shared/siteContentDefaults.json'
import { apiRequest } from '../lib/api'

const SiteContentContext = createContext(null)

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(siteContentDefaults)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshContent = useCallback(async () => {
    setError('')
    try {
      const data = await apiRequest('/site-content')
      setContent(data.content)
    } catch (requestError) {
      setError(requestError.message || 'Could not load website content.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshContent()
  }, [refreshContent])

  return (
    <SiteContentContext.Provider value={{ content, setContent, loading, error, refreshContent }}>
      {children}
    </SiteContentContext.Provider>
  )
}

export function useSiteContent() {
  const context = useContext(SiteContentContext)
  if (!context) throw new Error('useSiteContent must be used within a SiteContentProvider')
  return context
}
