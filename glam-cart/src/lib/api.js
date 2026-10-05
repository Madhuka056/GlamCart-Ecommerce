const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_URL}/admin/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) throw new Error(data.message || 'Image upload failed.')
  return new URL(data.path, new URL(API_URL, window.location.origin)).toString()
}

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
  }
  return data
}