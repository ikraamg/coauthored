/**
 * Coauthored Core - Universal encoder/decoder
 *
 * Format: v:1;o:origin;field:value;nested.field:value
 *
 * - `;` separates pairs
 * - `:` separates key from value
 * - `.` in keys means nesting: `risk.deploy` -> { risk: { deploy: ... } }
 * - Multiple values use commas: `ai:doc,code` -> { ai: ['doc', 'code'] }
 * - Text with special chars: `~` prefix = base64url encoded
 */

const SAFE_VALUE = /^[a-zA-Z0-9_-]+$/

function b64Encode(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  } catch {
    return ''
  }
}

function b64Decode(str) {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/')
    return decodeURIComponent(escape(atob(padded)))
  } catch {
    return ''
  }
}

function encodeValue(val) {
  if (val === null || val === undefined || val === '') return ''
  if (Array.isArray(val)) return val.map((v) => encodeValue(v)).join(',')
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? '1' : '0'

  const str = String(val)
  return SAFE_VALUE.test(str) ? str : '~' + b64Encode(str)
}

function decodeValue(str) {
  if (str === '') return ''
  if (str.startsWith('~')) return b64Decode(str.slice(1))
  if (str.includes(',')) return str.split(',').map((s) => decodeValue(s))
  if (/^-?\d+$/.test(str)) return parseInt(str, 10)
  return str
}

function flatten(obj, prefix = '') {
  const pairs = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      pairs.push(...flatten(value, fullKey))
    } else {
      pairs.push([fullKey, value])
    }
  }
  return pairs
}

function unflatten(pairs) {
  const result = {}
  for (const [key, value] of pairs) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) current[parts[i]] = {}
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = value
  }
  return result
}

/**
 * Encode data object to self-describing string
 * @param {Object} data - The data to encode
 * @param {Object} config - Config object with meta.origin and meta.formatVersion
 * @returns {string} Encoded string
 */
export function encode(data, config) {
  const version = config?.meta?.formatVersion ?? 1
  const origin = config?.meta?.origin ?? 'co'

  const pairs = [
    ['v', version],
    ['o', origin],
  ]
  for (const [key, value] of flatten(data)) {
    if (key === '_v' || key === '_o') continue
    pairs.push([key, value])
  }

  return pairs.map(([k, v]) => `${k}:${encodeValue(v)}`).join(';')
}

/**
 * Decode self-describing string to data object
 * @param {string} str - The encoded string
 * @returns {Object|null} Decoded data with _v (version) and _o (origin)
 */
export function decode(str) {
  if (!str || typeof str !== 'string') return null

  try {
    const pairs = []
    for (const segment of str.split(';')) {
      if (!segment) continue
      const colonIndex = segment.indexOf(':')
      if (colonIndex === -1) continue

      const key = segment.slice(0, colonIndex)
      const value = segment.slice(colonIndex + 1)

      if (key === 'v') pairs.push(['_v', parseInt(value, 10)])
      else if (key === 'o') pairs.push(['_o', value])
      else pairs.push([key, decodeValue(value)])
    }
    return unflatten(pairs)
  } catch {
    return null
  }
}

/**
 * Parse URL hash to extract encoded string
 */
export function parseUrl(urlOrHash) {
  try {
    let hash = urlOrHash
    if (urlOrHash.includes('#')) hash = urlOrHash.split('#')[1] || ''
    if (hash.startsWith('/')) hash = hash.slice(1)
    return hash || null
  } catch {
    return null
  }
}

/**
 * Build URL for a statement
 */
export function buildUrl(encoded, baseUrl = 'https://coauthored.dev') {
  return `${baseUrl}/#${encoded}`
}

/**
 * Generate shields.io badge URL
 * @param {string} text - Badge text (e.g., "Coauthored with AI")
 * @param {string} color - Hex color without #
 * @param {string} style - Badge style (flat, flat-square, etc.)
 */
export function badgeUrl(text, color, style = 'flat') {
  // shields.io format: text with spaces → underscores, dashes → double dashes
  const encodedText = encodeURIComponent(
    text.replace(/-/g, '--').replace(/ /g, '_')
  )
  return `https://img.shields.io/badge/${encodedText}-↗-${color}?style=${style}`
}

/**
 * Generate markdown for badge with link
 */
export function badgeMarkdown(
  encoded,
  text,
  color,
  baseUrl = 'https://coauthored.dev'
) {
  return `[![${text}](${badgeUrl(text, color)})](${buildUrl(encoded, baseUrl)})`
}
