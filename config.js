/**
 * Config Loader - loads and validates coauthored config
 */

const REQUIRED_KEYS = ['meta', 'axes', 'quadrants', 'details', 'ui']
const REQUIRED_META = ['formatVersion', 'schemaVersion', 'origin']
const VALID_DETAIL_TYPES = ['enum', 'flags', 'text', 'date']

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

  for (const [key, axis] of Object.entries(config.axes)) {
    if (typeof axis.min !== 'number' || typeof axis.max !== 'number') {
      throw new Error(`Axis ${key} requires numeric min and max`)
    }
    if (!axis.stops?.length) {
      throw new Error(`Axis ${key} requires stops array`)
    }
  }

  for (const [key, q] of Object.entries(config.quadrants)) {
    if (!q.label || !q.color) {
      throw new Error(`Quadrant ${key} requires label and color`)
    }
    if (!q.stakes || !q.autonomy) {
      throw new Error(`Quadrant ${key} requires stakes and autonomy ranges`)
    }
  }

  for (const [key, field] of Object.entries(config.details)) {
    if (!VALID_DETAIL_TYPES.includes(field.type)) {
      throw new Error(`Invalid detail type for ${key}: ${field.type}`)
    }
    if ((field.type === 'enum' || field.type === 'flags') && !field.values) {
      throw new Error(`Detail ${key} requires values`)
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
 * Detect which quadrant a (stakes, autonomy) position falls into
 * @param {number} stakes - Stakes value (1-5)
 * @param {number} autonomy - Autonomy value (1-5)
 * @param {Object} config - Loaded config
 * @returns {Object} { key, label, description, color }
 */
export function getQuadrant(stakes, autonomy, config) {
  for (const [key, q] of Object.entries(config.quadrants)) {
    const [sMin, sMax] = q.stakes
    const [aMin, aMax] = q.autonomy
    if (stakes >= sMin && stakes <= sMax && autonomy >= aMin && autonomy <= aMax) {
      return { key, ...q }
    }
  }

  // Fallback to nearest quadrant by distance
  let best = null
  let bestDist = Infinity
  for (const [key, q] of Object.entries(config.quadrants)) {
    const sMid = (q.stakes[0] + q.stakes[1]) / 2
    const aMid = (q.autonomy[0] + q.autonomy[1]) / 2
    const dist = Math.abs(stakes - sMid) + Math.abs(autonomy - aMid)
    if (dist < bestDist) {
      bestDist = dist
      best = { key, ...q }
    }
  }
  return best
}

/**
 * Get human-readable label for an axis stop value
 * @param {string} axisKey - Axis key (e.g., 'stakes')
 * @param {number} value - Axis value
 * @param {Object} config - Loaded config
 * @returns {string} Human-readable label
 */
export function getAxisLabel(axisKey, value, config) {
  const axis = config.axes[axisKey]
  if (!axis) return String(value)
  const stop = axis.stops.find((s) => s.value === value)
  return stop?.label || String(value)
}

/**
 * Get human-readable label for a detail field value
 * @param {string} fieldKey - Detail field key
 * @param {string} value - Field value
 * @param {Object} config - Loaded config
 * @returns {string} Human-readable label
 */
export function getLabel(fieldKey, value, config) {
  if (!value) return 'Not specified'
  const field = config.details[fieldKey]
  if (!field?.values) return value
  const found = field.values.find((v) => v.value === value)
  return found?.label || value
}

/**
 * Get UI labels from config
 * @param {Object} config - Loaded config
 * @returns {Object} Labels object
 */
export function getLabels(config) {
  return config.ui.labels
}

/**
 * Get base URL from current location
 * @returns {string} Base URL
 */
export function getBaseUrl() {
  return (
    window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '')
  )
}

/**
 * Get storage key with app-specific prefix
 * @param {Object} config - Loaded config
 * @param {string} suffix - Key suffix
 * @returns {string} Full storage key
 */
export function getStorageKey(config, suffix) {
  const prefix = config?.meta?.name?.toLowerCase() || 'coauthored'
  return `${prefix}-${suffix}`
}

/**
 * Get badge service URL pattern
 * @param {Object} config - Loaded config
 * @returns {string} Badge service URL pattern
 */
export function getBadgeServiceUrl(config) {
  return (
    config?.ui?.badge?.service ||
    'https://img.shields.io/badge/{text}-{color}?style={style}'
  )
}
