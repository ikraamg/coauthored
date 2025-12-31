/**
 * Config Loader - loads and validates coauthored config
 */

import { compile } from './rules.js';

const REQUIRED_KEYS = ['meta', 'categories', 'fields', 'rules'];
const REQUIRED_META = ['formatVersion', 'schemaVersion', 'origin'];
const VALID_FIELD_TYPES = ['enum', 'flags', 'text', 'date'];
const VALID_COMPUTED_TYPES = ['max', 'lookup', 'includes_any'];

/**
 * Validate config structure
 * @param {Object} config
 * @throws {Error} If config is invalid
 */
export function validateConfig(config) {
  for (const key of REQUIRED_KEYS) {
    if (!config[key]) throw new Error(`Missing required config key: ${key}`);
  }

  for (const key of REQUIRED_META) {
    if (!config.meta[key]) throw new Error(`Missing required meta key: ${key}`);
  }

  for (const [key, field] of Object.entries(config.fields)) {
    if (!VALID_FIELD_TYPES.includes(field.type)) {
      throw new Error(`Invalid field type for ${key}: ${field.type}`);
    }
    if ((field.type === 'enum' || field.type === 'flags') && !field.values) {
      throw new Error(`Field ${key} requires values`);
    }
    if (field.category && !config.categories[field.category]) {
      throw new Error(`Field ${key} references unknown category: ${field.category}`);
    }
  }

  if (config.scoring?.computed) {
    for (const [name, computed] of Object.entries(config.scoring.computed)) {
      if (!VALID_COMPUTED_TYPES.includes(computed.type)) {
        throw new Error(`Invalid computed type for ${name}: ${computed.type}`);
      }
    }
  }

  for (const rule of config.rules) {
    if (!rule.condition) throw new Error(`Rule ${rule.id || '(unnamed)'} missing condition`);
    try {
      compile(rule.condition);
    } catch (e) {
      throw new Error(`Invalid rule condition for ${rule.id}: ${e.message}`);
    }
  }

  return true;
}

/**
 * Load config from URL and validate
 * @param {string} url - Config file URL
 * @returns {Promise<Object>} Validated config with compiled rules
 */
export async function loadConfig(url = './coauthored.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load config: ${response.status}`);

  const config = await response.json();
  validateConfig(config);

  // Pre-compile all rules
  config._compiledRules = config.rules.map(rule => ({
    ...rule,
    evaluator: compile(rule.condition)
  }));

  return config;
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

/**
 * Get score for a field value
 */
function getScore(data, fieldKey, config) {
  const value = getNestedValue(data, fieldKey);
  const field = config.fields[fieldKey];
  if (!field?.score || !value) return 0;
  return field.score[value] ?? 0;
}

/**
 * Compute scoring context from data
 */
export function computeContext(data, config) {
  const ctx = {};

  if (!config.scoring?.computed) return ctx;

  for (const [name, computed] of Object.entries(config.scoring.computed)) {
    switch (computed.type) {
      case 'max':
        ctx[name] = Math.max(...computed.fields.map(f => getScore(data, f, config)));
        break;

      case 'lookup':
        ctx[name] = getScore(data, computed.field, config);
        break;

      case 'includes_any': {
        const value = getNestedValue(data, computed.field);
        const arr = Array.isArray(value) ? value : (value ? [value] : []);
        ctx[name] = computed.values.some(v => arr.includes(v));
        break;
      }
    }
  }

  return ctx;
}

/**
 * Assess data using config rules
 * @param {Object} data - Statement data
 * @param {Object} config - Loaded config with compiled rules
 * @returns {Object} { level, color, label }
 */
export function assess(data, config) {
  if (!data) return { level: 'info', color: '6b7280', label: 'Documented' };

  const ctx = computeContext(data, config);

  for (const rule of config._compiledRules) {
    if (rule.evaluator(ctx)) {
      return { level: rule.level, color: rule.color, label: rule.label };
    }
  }

  return { level: 'info', color: '6b7280', label: 'Documented' };
}

/**
 * Get fields grouped by category
 */
export function getFieldsByCategory(config) {
  const grouped = {};

  for (const [key, field] of Object.entries(config.fields)) {
    const cat = field.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ key, ...field });
  }

  const sorted = {};
  const catOrder = Object.entries(config.categories)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key]) => key);

  for (const cat of catOrder) {
    if (grouped[cat]) sorted[cat] = grouped[cat];
  }

  for (const [cat, fields] of Object.entries(grouped)) {
    if (!sorted[cat]) sorted[cat] = fields;
  }

  return sorted;
}

/**
 * Get label for a field value
 */
export function getLabel(fieldKey, value, config) {
  if (!value) return 'Not specified';

  const field = config.fields[fieldKey];
  if (!field?.values) return value;

  const found = field.values.find(v => v.value === value);
  return found?.label || value;
}
