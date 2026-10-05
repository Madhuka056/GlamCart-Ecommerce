import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'

const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshProducts = useCallback(async () => {
    setError('')
    try {
      const data = await apiRequest('/products')
      setProducts(data.products)
    } catch (requestError) {
      setError(requestError.message || 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshProducts()
  }, [refreshProducts])

  return (
    <CatalogContext.Provider value={{ products, loading, error, refreshProducts }}>
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog must be used within a CatalogProvider')
  return context
}
