import siteContentDefaults from '../../../shared/siteContentDefaults.json' with { type: 'json' }
import SiteContent from '../models/SiteContent.js'

const cloneDefaults = () => structuredClone(siteContentDefaults)
const currentContentVersion = 2

function invalid(message) {
  return Object.assign(new Error(message), { statusCode: 400 })
}

function validateValue(value, template, path) {
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 50) {
      throw invalid(`${path} must contain between 1 and 50 entries`)
    }
    const entryTemplate = template[0]
    return value.map((entry, index) => validateValue(entry, entryTemplate, `${path}[${index}]`))
  }

  if (template && typeof template === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${path} must be an object`)
    const allowedKeys = Object.keys(template)
    for (const key of Object.keys(value)) {
      if (!allowedKeys.includes(key)) throw invalid(`${path}.${key} is not an editable website setting`)
    }
    return Object.fromEntries(allowedKeys.map((key) => [
      key,
      validateValue(value[key] === undefined ? template[key] : value[key], template[key], `${path}.${key}`),
    ]))
  }

  if (typeof template === 'string') {
    if (typeof value !== 'string' || value.length > 4000) throw invalid(`${path} must be text up to 4000 characters`)
    if ((path.endsWith('.image') || path.endsWith('.logoUrl') || path.endsWith('.url') || /images\[\d+\]$/.test(path)) && value) {
      let url
      try {
        url = new URL(value)
      } catch {
        throw invalid(`${path} must be a valid http or https URL`)
      }
      if (!['http:', 'https:'].includes(url.protocol)) throw invalid(`${path} must be a valid http or https URL`)
    }
    if (path.endsWith('.target') && !['home', 'shop', 'category', 'tag', 'about'].includes(value)) {
      throw invalid(`${path} must be a supported website destination`)
    }
    if (path.endsWith('.theme') && !['terracotta', 'sand', 'olive'].includes(value)) {
      throw invalid(`${path} must use a supported promotion theme`)
    }
    return value.trim()
  }

  if (typeof template === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid(`${path} must be a valid number`)
    return value
  }

  if (typeof template === 'boolean') {
    if (typeof value !== 'boolean') throw invalid(`${path} must be true or false`)
    return value
  }

  throw invalid(`${path} has an unsupported value`)
}

export const validateSiteContent = (content) => {
  const validated = validateValue(content, siteContentDefaults, 'content')
  const categoryNames = validated.categories.map(({ label }) => label.toLowerCase())
  if (validated.categories.some(({ label }) => !label) || new Set(categoryNames).size !== categoryNames.length) {
    throw invalid('Category names must be non-empty and unique')
  }

  const featuredNames = validated.featured.productNames.map((name) => name.toLowerCase())
  if (new Set(featuredNames).size !== featuredNames.length) {
    throw invalid('Featured product names must be unique')
  }

  const destinations = [...validated.navigation, ...validated.promotions]
  for (const destination of destinations) {
    if (destination.target === 'category' && !categoryNames.includes(destination.value.toLowerCase())) {
      throw invalid(`Website destination category "${destination.value}" does not exist`)
    }
    if (destination.target === 'tag' && !['Sale', 'New'].includes(destination.value)) {
      throw invalid('Product tag destinations must use Sale or New')
    }
  }
  return validated
}

function mergeDefaults(defaults, saved) {
  if (Array.isArray(defaults)) return Array.isArray(saved) && saved.length ? saved : defaults
  if (defaults && typeof defaults === 'object') {
    return Object.fromEntries(Object.keys(defaults).map((key) => [
      key,
      mergeDefaults(defaults[key], saved?.[key]),
    ]))
  }
  return saved === undefined ? defaults : saved
}

async function getCurrentSiteContent() {
  const saved = await SiteContent.findOne({ key: 'global' }).lean()
  if (!saved || (saved.contentVersion || 0) >= currentContentVersion) return saved

  const oldVersionFilter = saved.contentVersion == null
    ? { contentVersion: { $exists: false } }
    : { contentVersion: saved.contentVersion }
  return SiteContent.findOneAndUpdate(
    { _id: saved._id, ...oldVersionFilter },
    { $set: { content: cloneDefaults(), contentVersion: currentContentVersion } },
    { new: true },
  ).lean()
}

export const getSiteContent = async (req, res) => {
  const saved = await getCurrentSiteContent()
  res.json({ success: true, content: mergeDefaults(cloneDefaults(), saved?.content) })
}

export const getAdminSiteContent = async (req, res) => {
  const saved = await getCurrentSiteContent()
  res.json({
    success: true,
    content: mergeDefaults(cloneDefaults(), saved?.content),
    defaults: cloneDefaults(),
    updatedAt: saved?.updatedAt || null,
  })
}

export const updateSiteContent = async (req, res) => {
  const content = validateSiteContent(req.body?.content)
  const saved = await SiteContent.findOneAndUpdate(
    { key: 'global' },
    { $set: { content, contentVersion: currentContentVersion } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
  res.json({ success: true, content: saved.content, updatedAt: saved.updatedAt })
}

export const resetSiteContent = async (req, res) => {
  const content = cloneDefaults()
  const saved = await SiteContent.findOneAndUpdate(
    { key: 'global' },
    { $set: { content, contentVersion: currentContentVersion } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
  res.json({ success: true, content: saved.content, updatedAt: saved.updatedAt })
}
