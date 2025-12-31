/**
 * Config Loader - loads and validates coauthored config
 */

const REQUIRED_KEYS = ['meta', 'categories', 'fields', 'ui']
const REQUIRED_META = ['formatVersion', 'schemaVersion', 'origin']
const VALID_FIELD_TYPES = ['enum', 'flags', 'text', 'date']

/**
 * Validate config structure
 * @param {Object} config
 * @throws {Error} If config is invalid
 */
export function validateConfig(config) {
  for (const key of REQUIRED_KEYS) {
    if (!config[key]) throw new Error(`Missing required config key: ${key}`)
  }

  for (const key of REQUIRED_META) {
    if (!config.meta[key]) throw new Error(`Missing required meta key: ${key}`)
  }

  for (const [key, field] of Object.entries(config.fields)) {
    if (!VALID_FIELD_TYPES.includes(field.type)) {
      throw new Error(`Invalid field type for ${key}: ${field.type}`)
    }
    if ((field.type === 'enum' || field.type === 'flags') && !field.values) {
      throw new Error(`Field ${key} requires values`)
    }
    if (field.category && !config.categories[field.category]) {
      throw new Error(
        `Field ${key} references unknown category: ${field.category}`
      )
    }
  }

  return true
}

/**
 * Load config from URL and validate
 * @param {string} url - Config file URL
 * @returns {Promise<Object>} Validated config
 */
export async function loadConfig(url = './coauthored.json') {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load config: ${response.status}`)

  const config = await response.json()
  validateConfig(config)

  return config
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-notation path (e.g., 'risk.deploy')
 * @returns {*} Value at path or undefined
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj)
}

/**
 * Get fields grouped by category, sorted by category order
 * @param {Object} config - Loaded config
 * @returns {Object} Fields grouped by category key
 */
export function getFieldsByCategory(config) {
  const grouped = {}

  for (const [key, field] of Object.entries(config.fields)) {
    const cat = field.category || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push({ key, ...field })
  }

  const sorted = {}
  const catOrder = Object.entries(config.categories)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key]) => key)

  for (const cat of catOrder) {
    if (grouped[cat]) sorted[cat] = grouped[cat]
  }

  for (const [cat, fields] of Object.entries(grouped)) {
    if (!sorted[cat]) sorted[cat] = fields
  }

  return sorted
}

/**
 * Get human-readable label for a field value
 * @param {string} fieldKey - Field key (e.g., 'review')
 * @param {string} value - Field value (e.g., 'func')
 * @param {Object} config - Loaded config
 * @returns {string} Human-readable label
 */
export function getLabel(fieldKey, value, config) {
  if (!value) return 'Not specified'

  const field = config.fields[fieldKey]
  if (!field?.values) return value

  const found = field.values.find((v) => v.value === value)
  return found?.label || value
}

/**
 * Get badge config
 * @param {Object} config - Loaded config
 * @returns {Object} { text, color }
 */
export function getBadge(config) {
  return config.ui?.badge || { text: 'Coauthored with AI', color: '3b82f6' }
}
