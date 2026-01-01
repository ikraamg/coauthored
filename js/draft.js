/**
 * Draft Module
 * Persists form data to localStorage for session recovery
 */

import { getStorageKey } from '../config.js'

/** @type {Object|null} */
let currentConfig = null

/**
 * Initialize draft module with config
 * @param {Object} config - App configuration
 */
export function initDraft(config) {
  currentConfig = config
}

/**
 * Get the storage key for drafts
 * @returns {string}
 */
function getDraftKey() {
  return getStorageKey(currentConfig, 'draft')
}

/**
 * Save draft to localStorage
 * @param {Object} formData - Form data from collectFormData()
 * @param {number} currentStep - Current step index
 * @param {string} schemaVersion - Config schema version for migration detection
 */
export function saveDraft(formData, currentStep, schemaVersion) {
  try {
    localStorage.setItem(
      getDraftKey(),
      JSON.stringify({
        schemaVersion,
        savedAt: new Date().toISOString(),
        currentStep,
        formData,
      })
    )
  } catch {
    // localStorage unavailable (private browsing, quota exceeded)
    // Fail silently - drafts are a convenience, not critical
  }
}

/**
 * Load draft from localStorage
 * @param {string} currentSchemaVersion - Current config schema version
 * @returns {{schemaVersion: string, savedAt: string, currentStep: number, formData: Object}|null}
 */
export function loadDraft(currentSchemaVersion) {
  try {
    const raw = localStorage.getItem(getDraftKey())
    if (!raw) return null

    const draft = JSON.parse(raw)

    // Validate structure
    if (!draft || typeof draft !== 'object') return null
    if (!draft.formData || typeof draft.formData !== 'object') return null
    if (typeof draft.currentStep !== 'number') return null

    // Schema version mismatch - discard draft
    if (draft.schemaVersion !== currentSchemaVersion) {
      clearDraft()
      return null
    }

    return draft
  } catch {
    // JSON parse failed or other error - clear corrupted data
    clearDraft()
    return null
  }
}

/**
 * Clear draft from localStorage
 */
export function clearDraft() {
  try {
    localStorage.removeItem(getDraftKey())
  } catch {
    // Fail silently
  }
}
