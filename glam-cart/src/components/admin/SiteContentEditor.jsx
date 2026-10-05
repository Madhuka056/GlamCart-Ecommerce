import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import ImageUploadField from './ImageUploadField'

const inputClass = 'w-full rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-terracotta'

function fieldLabel(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function EditableValue({ label, value, onChange, fieldKey, onUploadingChange }) {
  if (fieldKey === 'target') {
    return (
      <label className="block text-sm text-stone">
        {label}
        <select className={`${inputClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="home">Home</option>
          <option value="shop">Shop</option>
          <option value="category">Category</option>
          <option value="tag">Product tag</option>
          <option value="about">About section</option>
        </select>
      </label>
    )
  }
  if (fieldKey === 'theme') {
    return (
      <label className="block text-sm text-stone">
        {label}
        <select className={`${inputClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="terracotta">Terracotta</option>
          <option value="sand">Sand</option>
          <option value="olive">Olive</option>
        </select>
      </label>
    )
  }

  const isImage = ['image', 'logoUrl', 'images entry'].includes(fieldKey)
  if (isImage) {
    return <ImageUploadField label={label} value={value} onChange={onChange} onUploadingChange={onUploadingChange} />
  }

  const isUrl = fieldKey === 'url' || fieldKey.toLowerCase().endsWith('url')
  const inputType = isUrl ? 'url' : fieldKey.toLowerCase().includes('email') ? 'email' : fieldKey.toLowerCase().includes('phone') ? 'tel' : 'text'
  const isLongText = value.length > 100 || ['description', 'subtitle', 'answer', 'quote', 'text', 'title'].includes(fieldKey.toLowerCase())
  const control = isLongText
    ? <textarea rows={value.length > 180 ? 4 : 2} maxLength={4000} className={`${inputClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)} />
    : <input type={inputType} maxLength={4000} className={`${inputClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)} />

  return <label className="block text-sm text-stone">{label}{control}</label>
}

function EditableNode({ value, onChange, fieldKey, path, onUploadingChange }) {
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
        {fieldLabel(fieldKey)}
      </label>
    )
  }

  if (typeof value === 'string') {
    return <EditableValue label={fieldLabel(fieldKey)} fieldKey={fieldKey} value={value} onChange={onChange} onUploadingChange={onUploadingChange} />
  }

  if (Array.isArray(value)) {
    const isImageColorVariant = fieldKey === 'variants'
    const template = value[0]
    return (
      <fieldset className="space-y-3 rounded-xl border border-cream-dark bg-white/60 p-3 md:p-4">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-semibold text-ink">{fieldLabel(fieldKey)}</legend>
          <button
            type="button"
            disabled={value.length >= 50}
            onClick={() => onChange([...value, structuredClone(template)])}
            className="inline-flex items-center gap-1 rounded-full border border-cream-dark bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-charcoal disabled:opacity-50"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {isImageColorVariant && <p className="text-xs text-stone">Each size/color combination is listed separately. Keep combinations unique.</p>}
        {value.map((entry, index) => (
          <div key={`${path}-${index}`} className="rounded-xl border border-cream-dark bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone">{fieldLabel(fieldKey)} {index + 1}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onChange(value.map((item, itemIndex) => itemIndex === index - 1 ? value[index] : itemIndex === index ? value[index - 1] : item))}
                  aria-label={`Move ${fieldLabel(fieldKey)} ${index + 1} up`}
                  className="rounded-md p-1.5 text-stone hover:bg-cream disabled:opacity-40"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  disabled={index === value.length - 1}
                  onClick={() => onChange(value.map((item, itemIndex) => itemIndex === index ? value[index + 1] : itemIndex === index + 1 ? value[index] : item))}
                  aria-label={`Move ${fieldLabel(fieldKey)} ${index + 1} down`}
                  className="rounded-md p-1.5 text-stone hover:bg-cream disabled:opacity-40"
                >
                  <ChevronDown size={15} />
                </button>
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label={`Remove ${fieldLabel(fieldKey)} ${index + 1}`}
                    className="rounded-md p-1.5 text-terracotta hover:bg-cream"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
            <EditableNode
              value={entry}
              fieldKey={`${fieldKey} entry`}
              path={`${path}-${index}`}
              onUploadingChange={onUploadingChange}
              onChange={(nextEntry) => onChange(value.map((item, itemIndex) => itemIndex === index ? nextEntry : item))}
            />
          </div>
        ))}
      </fieldset>
    )
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map(([key, child]) => (
          <div key={`${path}-${key}`} className={child && typeof child === 'object' ? 'md:col-span-2' : ''}>
            <EditableNode
              fieldKey={key}
              path={`${path}-${key}`}
              value={child}
              onUploadingChange={onUploadingChange}
              onChange={(nextChild) => onChange({ ...value, [key]: nextChild })}
            />
          </div>
        ))}
      </div>
    )
  }

  return null
}

export default function SiteContentEditor({ content, onChange, onUploadingChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink">Website content</h2>
        <p className="mt-1 text-sm text-stone">Edit the text, links, images and page sections shown to customers. Changes publish when saved.</p>
        <p className="mt-1 text-xs text-stone">Choose image files directly (JPEG, PNG, GIF or WebP up to 5 MB). Login credentials and payment-provider secrets are intentionally not editable here.</p>
      </div>
      {Object.entries(content).map(([section, value]) => (
        <details key={section} className="rounded-2xl border border-cream-dark bg-white" open={section === 'hero'}>
          <summary className="cursor-pointer list-none px-4 py-4 font-semibold text-ink marker:hidden">
            <span className="flex items-center justify-between">
              {fieldLabel(section)}
              <span className="text-xs font-normal text-stone">Edit section</span>
            </span>
          </summary>
          <div className="border-t border-cream-dark p-4">
            <EditableNode
              fieldKey={section}
              path={section}
              value={value}
              onUploadingChange={onUploadingChange}
              onChange={(nextValue) => onChange({ ...content, [section]: nextValue })}
            />
          </div>
        </details>
      ))}
    </div>
  )
}
