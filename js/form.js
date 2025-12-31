/**
 * Form Module
 * Handles form rendering, data collection, and population
 */

import { getFieldsByCategory, getBadge, getNestedValue } from '../config.js'
import { encode, badgeUrl, badgeMarkdown } from '../core.js'
import { Stepper, renderStepNav } from './stepper.js'
import { copyField } from './toast.js'
import { saveDraft, loadDraft } from './draft.js'

/** @type {Stepper|null} */
let stepper = null

/** @type {Object} */
let formData = {}

/** @type {Object|null} */
let currentConfig = null

/** @type {string[]} */
const steps = ['basics', 'ai', 'oversight', 'context', 'validation', 'meta']

/**
 * Get base URL for building statement URLs
 * @returns {string}
 */
function getBaseUrl() {
  return (
    window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '')
  )
}

/**
 * Set nested value in object using dot notation path
 * @param {Object} obj - Target object
 * @param {string} path - Dot notation path (e.g., 'tool.other')
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) current[parts[i]] = {}
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

/**
 * Render a form field based on its type
 * @param {Object} field - Field configuration
 * @returns {string} HTML string
 */
export function renderField(field) {
  const { key, type, label, description, values, placeholder, multiline } =
    field

  if (type === 'enum') {
    return `
      <div class="field-group">
        <span class="field-label">${label}</span>
        ${description ? `<p class="field-description">${description}</p>` : ''}
        <div class="radio-grid">
          ${values
            .map(
              (v) => `
            <label class="radio-card">
              <input type="radio" name="${key}" value="${v.value}">
              <div class="radio-content">
                <span class="radio-title">${v.label}</span>
                ${v.desc ? `<span class="radio-desc">${v.desc}</span>` : ''}
              </div>
            </label>
          `
            )
            .join('')}
        </div>
      </div>
    `
  }

  if (type === 'flags') {
    return `
      <div class="field-group">
        <span class="field-label">${label}</span>
        ${description ? `<p class="field-description">${description}</p>` : ''}
        <div class="checkbox-grid">
          ${values
            .map(
              (v) => `
            <label class="checkbox-card">
              <input type="checkbox" name="${key}" value="${v.value}">
              <div class="checkbox-content">
                <span class="checkbox-title">${v.label}</span>
                ${v.desc ? `<span class="checkbox-desc">${v.desc}</span>` : ''}
              </div>
            </label>
          `
            )
            .join('')}
        </div>
      </div>
    `
  }

  if (type === 'text') {
    if (multiline) {
      return `
        <div class="field-group">
          <label class="field-label" for="${key}">${label}</label>
          ${
            description ? `<p class="field-description">${description}</p>` : ''
          }
          <textarea name="${key}" id="${key}" placeholder="${
        placeholder || ''
      }"></textarea>
        </div>
      `
    }
    return `
      <div class="field-group">
        <label class="field-label" for="${key}">${label}</label>
        ${description ? `<p class="field-description">${description}</p>` : ''}
        <input type="text" name="${key}" id="${key}" placeholder="${
      placeholder || ''
    }">
      </div>
    `
  }

  return ''
}

/**
 * Collect form data from all inputs
 * @param {Object} config - App configuration
 * @returns {Object} Collected form data
 */
export function collectFormData(config) {
  const data = { created: formData.created }

  for (const [key, field] of Object.entries(config.fields)) {
    if (field.auto) continue

    if (field.type === 'flags') {
      const checked = [
        ...document.querySelectorAll(`input[name="${key}"]:checked`),
      ].map((el) => el.value)
      if (checked.length) setNestedValue(data, key, checked)
    } else if (field.type === 'enum') {
      const checked = document.querySelector(`input[name="${key}"]:checked`)
      if (checked?.value) setNestedValue(data, key, checked.value)
    } else {
      const el = document.querySelector(`[name="${key}"]`)
      if (el?.value) setNestedValue(data, key, el.value)
    }
  }

  return data
}

/**
 * Populate form with existing data
 * @param {Object} data - Data to populate
 * @param {Object} config - App configuration
 */
export function populateForm(data, config) {
  for (const [key, field] of Object.entries(config.fields)) {
    const value = getNestedValue(data, key)
    if (!value) continue

    if (field.type === 'flags') {
      const values = Array.isArray(value) ? value : [value]
      values.forEach((v) => {
        const checkbox = document.querySelector(
          `input[name="${key}"][value="${v}"]`
        )
        if (checkbox) checkbox.checked = true
      })
    } else if (field.type === 'enum') {
      const radio = document.querySelector(
        `input[name="${key}"][value="${value}"]`
      )
      if (radio) radio.checked = true
    } else {
      const el = document.querySelector(`[name="${key}"]`)
      if (el) el.value = value
    }
  }
}

/**
 * Update the live preview panel
 */
function updatePreview() {
  const data = collectFormData(currentConfig)
  const badge = getBadge(currentConfig)
  const encoded = encode(data, currentConfig)
  const baseUrl = getBaseUrl()

  const stmtEl = document.getElementById('output-statement')
  const urlEl = document.getElementById('output-url')
  const mdEl = document.getElementById('output-markdown')
  const badgeEl = document.getElementById('badge-preview')

  if (stmtEl) stmtEl.value = encoded
  if (urlEl) urlEl.value = `${baseUrl}/#${encoded}`
  if (mdEl)
    mdEl.value = badgeMarkdown(encoded, badge.text, badge.color, baseUrl)
  if (badgeEl)
    badgeEl.innerHTML = `<img src="${badgeUrl(
      badge.text,
      badge.color
    )}" alt="Badge">`

  // Store for submission
  window._currentEncoded = encoded

  // Save draft on every form change
  if (stepper && currentConfig) {
    saveDraft(data, stepper.currentStep, currentConfig.meta.schemaVersion)
  }
}

/**
 * Bind radio keyboard navigation (arrows move focus, space selects)
 */
function bindRadioKeyboard() {
  document.querySelectorAll('.radio-grid').forEach((grid) => {
    const radios = [...grid.querySelectorAll('input[type="radio"]')]

    radios.forEach((radio, index) => {
      radio.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault()
          radios[(index + 1) % radios.length].focus()
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault()
          radios[(index - 1 + radios.length) % radios.length].focus()
        } else if (e.key === ' ') {
          e.preventDefault()
          radio.checked = true
          radio.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
    })
  })
}

/**
 * Render the wizard form
 * @param {Object} config - App configuration
 * @param {Function} onSubmit - Callback when form is submitted
 */
export function renderWizard(config, onSubmit) {
  currentConfig = config
  const notice = config.ui?.notices?.wizard || {}
  const grouped = getFieldsByCategory(config)
  const isEditing = history.state?.editing && window._editingData

  formData = { created: new Date().toISOString().split('T')[0] }

  // Create stepper instance
  stepper = new Stepper(steps, config.categories)

  let html = stepper.renderTrack()

  html += `
    <div class="notice">
      <p class="notice-title">${notice.title || 'Good Faith Disclosure'}</p>
      <p class="notice-text">${notice.text || ''}</p>
    </div>

    <div class="step-container" id="step-container">
      ${steps
        .map((stepKey, i) => {
          const fields = grouped[stepKey] || []
          const cat = config.categories[stepKey]
          return `
          <section class="step" data-step="${stepKey}" aria-hidden="${i !== 0}">
            <div class="step-header">
              <h2 class="step-title">${cat?.label || stepKey}</h2>
              ${
                cat?.description
                  ? `<p class="step-description">${cat.description}</p>`
                  : ''
              }
            </div>
            <form id="form-${stepKey}">
              ${fields
                .filter((f) => !f.auto)
                .map((field) => renderField(field))
                .join('')}
            </form>
          </section>
        `
        })
        .join('')}
    </div>
  `

  html += renderStepNav()

  html += `
    <section class="preview-panel" aria-label="Preview">
      <div class="preview-header">
        <span class="preview-title">Live Preview</span>
        <div class="preview-badge" id="badge-preview"></div>
      </div>

      <div class="output-field">
        <span class="output-label">Statement</span>
        <div class="output-row">
          <input type="text" class="output-input" id="output-statement" readonly>
          <button type="button" class="btn-copy" data-copy="output-statement">Copy</button>
        </div>
      </div>

      <div class="output-field">
        <span class="output-label">URL</span>
        <div class="output-row">
          <input type="text" class="output-input" id="output-url" readonly>
          <button type="button" class="btn-copy" data-copy="output-url">Copy</button>
        </div>
      </div>

      <div class="output-field">
        <span class="output-label">Markdown Badge</span>
        <div class="output-row">
          <input type="text" class="output-input" id="output-markdown" readonly>
          <button type="button" class="btn-copy" data-copy="output-markdown">Copy</button>
        </div>
      </div>
    </section>
  `

  document.getElementById('app').innerHTML = html

  // Bind all event listeners
  stepper.bindStepClicks()
  stepper.bindNavButtons(onSubmit)

  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', () => copyField(btn.dataset.copy))
  })

  document.querySelectorAll('input, select, textarea').forEach((el) => {
    el.addEventListener('change', updatePreview)
    el.addEventListener('input', updatePreview)
  })

  bindRadioKeyboard()

  // Restore draft if exists and not editing
  const draft = loadDraft(config.meta.schemaVersion)
  if (draft && !isEditing) {
    populateForm(draft.formData, config)
    if (draft.currentStep > 0) {
      setTimeout(() => stepper.goToStep(draft.currentStep), 0)
    }
  }

  // Pre-populate if editing (takes precedence over draft)
  if (isEditing) {
    populateForm(window._editingData, config)
    delete window._editingData
    history.replaceState(null, '', window.location.pathname)
  }

  updatePreview()
}

/**
 * Get the current stepper instance
 * @returns {Stepper|null}
 */
export function getStepper() {
  return stepper
}
