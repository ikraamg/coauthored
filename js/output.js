/**
 * Output Panel Module
 * Shared output panel with dynamic badge based on quadrant
 */

import { getLabels, getBaseUrl, getBadgeServiceUrl, getQuadrant } from '../config.js'
import { badgeUrl, badgeMarkdown, buildUrl, decode } from '../core.js'
import { copyField } from './toast.js'

/**
 * Escape HTML attribute value
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * Render a single output field row
 */
function renderOutputField(id, label, value, copyLabel) {
  const valueAttr = value ? ` value="${escapeAttr(value)}"` : ''
  const labelHtml = label ? `<span class="output-label">${label}</span>` : ''
  return `
    <div class="output-field">
      ${labelHtml}
      <div class="output-row">
        <input type="text" class="output-input" id="${id}"${valueAttr} readonly>
        <button type="button" class="btn-copy" data-copy="${id}">${copyLabel}</button>
      </div>
    </div>
  `
}

/**
 * Render the output panel
 * @param {Object} config - App configuration
 * @param {Object} options - Panel options
 * @returns {string} HTML string
 */
export function renderOutputPanel(config, options = {}) {
  const labels = getLabels(config)
  const {
    title = labels.share,
    badgeHtml = '<div id="output-badge"></div>',
    encoded = '',
    url = '',
    markdown = '',
  } = options

  return `
    <section class="preview-panel" aria-label="${title}">
      <div class="preview-header">
        <span class="preview-title">${title}</span>
        <div class="preview-badge" id="output-badge-container">${badgeHtml}</div>
      </div>
      ${renderOutputField('output-statement', '', encoded, labels.copy)}
      ${renderOutputField('output-url', labels.url, url, labels.copy)}
      ${renderOutputField('output-markdown', labels.markdown, markdown, labels.copy)}
    </section>
  `
}

/**
 * Update output panel values live (called from app.js on each change)
 * @param {string} encoded - New encoded string
 * @param {Object} config - App configuration
 */
export function updateOutputValues(encoded, config) {
  const baseUrl = getBaseUrl()
  const badgeService = getBadgeServiceUrl(config)
  const fullUrl = `${baseUrl}/#${encoded}`

  // Determine badge from encoded data
  const data = decode(encoded)
  let badgeText = 'AI Coauthored'
  let badgeColor = '58a6ff'

  if (data && data._v === 2) {
    const q = getQuadrant(data.stakes || 3, data.autonomy || 3, config)
    if (q) {
      badgeText = q.label
      badgeColor = q.color
    }
  }

  const markdown = badgeMarkdown(encoded, badgeText, badgeColor, baseUrl, badgeService)

  // Update DOM
  const stmtEl = document.getElementById('output-statement')
  const urlEl = document.getElementById('output-url')
  const mdEl = document.getElementById('output-markdown')
  const badgeContainer = document.getElementById('output-badge-container')

  if (stmtEl) stmtEl.value = encoded
  if (urlEl) urlEl.value = fullUrl
  if (mdEl) mdEl.value = markdown
  if (badgeContainer) {
    badgeContainer.innerHTML = `<img src="${badgeUrl(badgeText, badgeColor, badgeService)}" alt="Badge">`
  }

  // Rebind copy buttons
  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.replaceWith(btn.cloneNode(true))
  })
  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', () => copyField(btn.dataset.copy))
  })
}
