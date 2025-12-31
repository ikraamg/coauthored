/**
 * Coauthored Assess - coauthored.dev assessment logic
 *
 * This is OUR opinion on how to assess a statement.
 * Forks may have different opinions.
 */

/**
 * Risk scores for various fields
 */
const RISK_SCORES = {
  // Deployment
  'risk.deploy': {
    local: 0,
    int: 1,
    cust: 3,
    pub: 4,
  },
  // Data sensitivity
  'risk.data': {
    none: 0,
    int: 1,
    pii: 2,
    fin: 3,
    health: 4,
  },
  // Safety implications
  'risk.safety': {
    none: 0,
    prop: 2,
    well: 3,
    life: 5,
  },
}

/**
 * Oversight scores (higher = more oversight)
 */
const OVERSIGHT_SCORES = {
  line: 5,
  func: 4,
  spot: 3,
  tests: 2,
  min: 1,
  none: 0,
}

/**
 * Assessment levels
 */
const LEVELS = {
  critical: { color: 'dc2626', label: 'Needs Review' },
  warning: { color: 'f59e0b', label: 'Caution' },
  good: { color: '16a34a', label: 'Well Supervised' },
  moderate: { color: '3b82f6', label: 'Supervised' },
  info: { color: '6b7280', label: 'Documented' },
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj, path) {
  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[part]
  }

  return current
}

/**
 * Calculate maximum risk score from data
 */
function calculateRisk(data) {
  let maxRisk = 0

  for (const [field, scores] of Object.entries(RISK_SCORES)) {
    const value = getNestedValue(data, field)
    if (value && scores[value] !== undefined) {
      maxRisk = Math.max(maxRisk, scores[value])
    }
  }

  return maxRisk
}

/**
 * Calculate oversight score from data
 */
function calculateOversight(data) {
  const oversight = data.oversight
  return OVERSIGHT_SCORES[oversight] ?? 0
}

/**
 * Check if validation has been done
 */
function hasValidation(data) {
  const valid = data.valid
  if (!valid) return { tests: false, review: false }

  const validArray = Array.isArray(valid) ? valid : [valid]

  return {
    tests: validArray.includes('unit') || validArray.includes('integ'),
    review: validArray.includes('sec') || validArray.includes('expert'),
  }
}

/**
 * Assess a statement and return level, color, and label
 *
 * @param {Object} data - Decoded statement data
 * @returns {Object} { level, color, label }
 */
export function assess(data) {
  if (!data) {
    return { level: 'info', ...LEVELS.info }
  }

  const risk = calculateRisk(data)
  const oversight = calculateOversight(data)
  const validation = hasValidation(data)

  // High risk + low oversight = critical
  if (risk >= 4 && oversight <= 2) {
    return { level: 'critical', ...LEVELS.critical }
  }

  // Medium-high risk + low oversight = warning
  if (risk >= 3 && oversight <= 2) {
    return { level: 'warning', ...LEVELS.warning }
  }

  // High oversight + tests = good
  if (oversight >= 4 && validation.tests) {
    return { level: 'good', ...LEVELS.good }
  }

  // Decent oversight = moderate
  if (oversight >= 3) {
    return { level: 'moderate', ...LEVELS.moderate }
  }

  // Default
  return { level: 'info', ...LEVELS.info }
}

/**
 * Get human-readable label for a field value
 *
 * @param {string} field - Field key
 * @param {string} value - Field value
 * @returns {string} Human-readable label
 */
export function getLabel(field, value) {
  // Import schema dynamically to avoid circular deps
  // For now, just format the value
  if (!value) return 'Not specified'

  // Convert shortcodes to readable
  const labels = {
    // Scope
    project: 'Project',
    pr: 'Pull Request',
    file: 'File',
    component: 'Component',
    // Intent
    explore: 'Exploration',
    proto: 'Prototype',
    validate: 'Validation',
    prod: 'Production',
    learn: 'Learning',
    // Trajectory
    throw: 'Throwaway',
    iter: 'Iterate',
    maint: 'Maintain',
    unk: 'Unknown',
    // Oversight
    line: 'Line by Line',
    func: 'Functional',
    spot: 'Spot Check',
    tests: 'Tests Only',
    min: 'Minimal',
    none: 'None',
    // Deployment
    local: 'Local',
    int: 'Internal',
    cust: 'Customer Facing',
    pub: 'Public Infrastructure',
    // Data
    pii: 'PII',
    fin: 'Financial',
    health: 'Health',
    // Safety
    prop: 'Property',
    well: 'Wellbeing',
    life: 'Life Critical',
    // AI involvement
    doc: 'Documentation',
    code: 'Code Generation',
    review: 'Code Review',
    arch: 'Architecture',
    test: 'Testing',
    sec: 'Security Sensitive',
    // Validation
    unit: 'Unit Tests',
    integ: 'Integration Tests',
    expert: 'Domain Expert',
  }

  return labels[value] || value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Format an array of values as labels
 */
export function formatFlags(values) {
  if (!values) return []
  const arr = Array.isArray(values) ? values : [values]
  return arr.map((v) => getLabel(null, v))
}
