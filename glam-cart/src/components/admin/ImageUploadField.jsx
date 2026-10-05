import { useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { uploadImage } from '../../lib/api'

const inputClass = 'w-full rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-terracotta'

export default function ImageUploadField({ label, value, onChange, onUploadingChange, allowRemove = true, disabled = false }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const selectImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.')
      return
    }

    setUploading(true)
    setError('')
    onUploadingChange?.(true)
    try {
      onChange(await uploadImage(file))
    } catch (uploadError) {
      setError(uploadError.message || 'Image upload failed.')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm text-stone">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {value && (
          <img src={value} alt={`${label} preview`} className="h-20 w-20 rounded-lg border border-cream-dark bg-white object-cover" />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={selectImage}
          />
          <button
            type="button"
            disabled={uploading || disabled}
            onClick={() => inputRef.current?.click()}
            className={`${inputClass} inline-flex w-auto items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {uploading ? 'Uploading...' : value ? 'Choose another image' : 'Choose image'}
          </button>
          {value && allowRemove && (
            <button
              type="button"
              onClick={() => { setError(''); onChange('') }}
              className="inline-flex items-center gap-1 rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-terracotta hover:bg-cream"
            >
              <Trash2 size={15} /> Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-stone">JPEG, PNG, GIF or WebP; maximum 5 MB.</p>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  )
}
