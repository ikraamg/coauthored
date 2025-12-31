/**
 * Coauthored Core - Universal encoder/decoder
 * 
 * Format: v:1;o:origin;field:value;nested.field:value
 * 
 * - `;` separates pairs
 * - `:` separates key from value
 * - `.` in keys means nesting: `risk.deploy` → { risk: { deploy: ... } }
 * - Multiple values use commas: `ai:doc,code` → { ai: ['doc', 'code'] }
 * - Text with special chars: `~` prefix = base64url encoded
 * 
 * This module is origin-agnostic. Any fork can use it.
 */

export const VERSION = 1;
export const DEFAULT_ORIGIN = 'co';

// Characters that don't need encoding in values
const SAFE_VALUE = /^[a-zA-Z0-9_-]+$/;

/**
 * Base64url encode (no padding)
 */
function b64Encode(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return '';
  }
}

/**
 * Base64url decode
 */
function b64Decode(str) {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return '';
  }
}

/**
 * Encode a value for the format
 */
function encodeValue(val) {
  if (val === null || val === undefined || val === '') {
    return '';
  }
  
  if (Array.isArray(val)) {
    // Arrays become comma-separated
    return val.map(v => encodeValue(v)).join(',');
  }
  
  if (typeof val === 'number') {
    return String(val);
  }
  
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  
  const str = String(val);
  
  // If safe characters only, use as-is
  if (SAFE_VALUE.test(str)) {
    return str;
  }
  
  // Otherwise base64url encode with ~ prefix
  return '~' + b64Encode(str);
}

/**
 * Decode a value from the format
 */
function decodeValue(str) {
  if (str === '') {
    return '';
  }
  
  // Check for base64url prefix
  if (str.startsWith('~')) {
    return b64Decode(str.slice(1));
  }
  
  // Check for comma-separated array
  if (str.includes(',')) {
    return str.split(',').map(s => decodeValue(s));
  }
  
  // Check for number
  if (/^-?\d+$/.test(str)) {
    return parseInt(str, 10);
  }
  
  // Check for boolean
  if (str === '1' || str === '0') {
    // Keep as string - caller can interpret as boolean if schema says so
    // This avoids ambiguity with actual numbers 0/1
  }
  
  return str;
}

/**
 * Flatten nested object to dot-notation keys
 * { risk: { deploy: 'int' } } → [['risk.deploy', 'int']]
 */
function flatten(obj, prefix = '') {
  const pairs = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested object
      pairs.push(...flatten(value, fullKey));
    } else {
      pairs.push([fullKey, value]);
    }
  }
  
  return pairs;
}

/**
 * Unflatten dot-notation keys to nested object
 * [['risk.deploy', 'int']] → { risk: { deploy: 'int' } }
 */
function unflatten(pairs) {
  const result = {};
  
  for (const [key, value] of pairs) {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  return result;
}

/**
 * Encode data object to self-describing string
 * 
 * @param {Object} data - The data to encode
 * @param {string} origin - Origin identifier (default: 'co')
 * @returns {string} Encoded string
 */
export function encode(data, origin = DEFAULT_ORIGIN) {
  const pairs = [
    ['v', VERSION],
    ['o', origin],
  ];
  
  // Flatten and add all data fields
  const flattened = flatten(data);
  for (const [key, value] of flattened) {
    // Skip internal fields
    if (key === '_v' || key === '_o') continue;
    pairs.push([key, value]);
  }
  
  // Build the string
  return pairs
    .map(([k, v]) => `${k}:${encodeValue(v)}`)
    .join(';');
}

/**
 * Decode self-describing string to data object
 * 
 * @param {string} str - The encoded string
 * @returns {Object|null} Decoded data with _v (version) and _o (origin), or null if invalid
 */
export function decode(str) {
  if (!str || typeof str !== 'string') {
    return null;
  }
  
  try {
    const pairs = [];
    
    // Split by `;` to get key:value pairs
    const segments = str.split(';');
    
    for (const segment of segments) {
      if (!segment) continue;
      
      const colonIndex = segment.indexOf(':');
      if (colonIndex === -1) {
        // Invalid segment, skip
        continue;
      }
      
      const key = segment.slice(0, colonIndex);
      const value = segment.slice(colonIndex + 1);
      
      // Handle special fields
      if (key === 'v') {
        pairs.push(['_v', parseInt(value, 10)]);
      } else if (key === 'o') {
        pairs.push(['_o', value]);
      } else {
        pairs.push([key, decodeValue(value)]);
      }
    }
    
    // Unflatten to nested object
    return unflatten(pairs);
  } catch (e) {
    console.error('Decode error:', e);
    return null;
  }
}

/**
 * Parse a URL hash or full URL to extract the encoded string
 * 
 * @param {string} urlOrHash - Full URL or just the hash part
 * @returns {string|null} The encoded string, or null
 */
export function parseUrl(urlOrHash) {
  try {
    let hash = urlOrHash;
    
    // If it's a full URL, extract hash
    if (urlOrHash.includes('#')) {
      hash = urlOrHash.split('#')[1] || '';
    }
    
    // Remove leading slash if present
    if (hash.startsWith('/')) {
      hash = hash.slice(1);
    }
    
    return hash || null;
  } catch {
    return null;
  }
}

/**
 * Build a URL for a statement
 * 
 * @param {string} encoded - The encoded string
 * @param {string} baseUrl - Base URL (default: current origin or coauthored.dev)
 * @returns {string} Full URL
 */
export function buildUrl(encoded, baseUrl = 'https://coauthored.dev') {
  return `${baseUrl}/#${encoded}`;
}

/**
 * Generate a shields.io badge URL
 * 
 * @param {string} label - Badge label text
 * @param {string} color - Hex color without #
 * @param {Object} options - Additional options
 * @returns {string} Shields.io URL
 */
export function badgeUrl(label, color, options = {}) {
  const { style = 'flat' } = options;
  const encodedLabel = encodeURIComponent(label.replace(/-/g, '--').replace(/_/g, '__'));
  return `https://img.shields.io/badge/Coauthored-${encodedLabel}-${color}?style=${style}`;
}

/**
 * Generate markdown for a badge with link
 * 
 * @param {string} encoded - Encoded statement
 * @param {string} label - Badge label
 * @param {string} color - Badge color
 * @param {string} baseUrl - Base URL for the link
 * @returns {string} Markdown string
 */
export function badgeMarkdown(encoded, label, color, baseUrl = 'https://coauthored.dev') {
  const imgUrl = badgeUrl(label, color);
  const linkUrl = buildUrl(encoded, baseUrl);
  return `[![Coauthored](${imgUrl})](${linkUrl})`;
}
