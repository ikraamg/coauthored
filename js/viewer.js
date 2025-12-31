/**
 * Viewer Module
 * Renders the readonly statement viewer
 */

import { getBadge, getNestedValue, getLabel } from '../config.js'
import { decode, badgeUrl, badgeMarkdown } from '../core.js'
import { copyField } from './toast.js'

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
 * Escape HTML attribute value
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * Render the viewer mode
 * @param {Object} data - Decoded statement data
 * @param {string} encoded - Encoded statement string
 * @param {Object} config - App configuration
 * @param {Function} onEdit - Callback when edit button is clicked
 * @param {Function} onNew - Callback when new button is clicked
 */
export function renderViewer(data, encoded, config, onEdit, onNew) {
  const badge = getBadge(config)
  const notice = config.ui?.notices?.viewer || {}
  const baseUrl = getBaseUrl()
  const fullUrl = `${baseUrl}/#${encoded}`
  const markdown = badgeMarkdown(encoded, badge.text, badge.color, baseUrl)

  let rows = ''
  for (const [key, field] of Object.entries(config.fields)) {
    const value = getNestedValue(data, key)
    if (!value) continue

    let displayValue
    if (Array.isArray(value)) {
      displayValue = value.map((v) => getLabel(key, v, config)).join(', ')
    } else {
      displayValue = getLabel(key, value, config)
    }

    rows += `<tr><th>${field.label}</th><td>${displayValue}</td></tr>`
  }

  const html = `
    <div class="viewer">
      <div class="viewer-notice">
        <p class="viewer-notice-title">${
          notice.title || 'About this statement'
        }</p>
        <p class="viewer-notice-text">${notice.text || ''}</p>
      </div>

      <div class="viewer-content">
        <table class="viewer-table">
          ${rows}
        </table>
      </div>

      <div class="viewer-actions">
        <button type="button" class="btn btn-primary" id="btn-edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit Statement
        </button>
        <button type="button" class="btn btn-secondary" id="btn-new">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 5v14M5 12h14"/></svg>
          Create New
        </button>
      </div>
    </div>

    <section class="preview-panel" aria-label="Copy options">
      <div class="preview-header">
        <span class="preview-title">Share</span>
        <div class="preview-badge"><img src="${badgeUrl(
          badge.text,
          badge.color
        )}" alt="Badge"></div>
      </div>

      <div class="output-field">
        <span class="output-label">Statement</span>
        <div class="output-row">
          <input type="text" class="output-input" id="output-statement" value="${encoded}" readonly>
          <button type="button" class="btn-copy" data-copy="output-statement">Copy</button>
        </div>
      </div>

      <div class="output-field">
        <span class="output-label">URL</span>
        <div class="output-row">
          <input type="text" class="output-input" id="output-url" value="${fullUrl}" readonly>
          <button type="button" class="btn-copy" data-copy="output-url">Copy</button>
        </div>
      </div>

      <div class="output-field">
        <span class="output-label">Markdown Badge</span>
        <div class="output-row">
          <input type="text" class="output-input" id="output-markdown" value="${escapeAttr(
            markdown
          )}" readonly>
          <button type="button" class="btn-copy" data-copy="output-markdown">Copy</button>
        </div>
      </div>
    </section>
  `

  document.getElementById('app').innerHTML = html

  // Bind buttons
  document.getElementById('btn-edit').addEventListener('click', () => {
    if (onEdit) onEdit(encoded)
  })

  document.getElementById('btn-new').addEventListener('click', () => {
    if (onNew) onNew()
  })

  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', () => copyField(btn.dataset.copy))
  })
}

/**
 * Start editing an existing statement
 * @param {string} encoded - Encoded statement to edit
 */
export function editStatement(encoded) {
  const data = decode(encoded)
  if (!data) return

  window._editingData = data
  history.pushState({ editing: true }, '', window.location.pathname)
  // Caller should handle route() call
}
