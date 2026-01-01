/**
 * Output Panel Module
 * Shared output panel for form and viewer
 */

import { getLabels } from '../config.js'

/**
 * Escape HTML attribute value
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * Render a single output field row
 * @param {string} id - Input element ID
 * @param {string} label - Field label (optional)
 * @param {string} value - Field value (empty for form, filled for viewer)
 * @param {string} copyLabel - Copy button label
 * @returns {string} HTML string
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
 * @param {string} options.title - Panel title (e.g., 'Preview' or 'Share')
 * @param {string} options.badgeHtml - Badge HTML (img tag or empty div with id)
 * @param {string} [options.encoded] - Encoded string value
 * @param {string} [options.url] - Full URL value
 * @param {string} [options.markdown] - Markdown value
 * @returns {string} HTML string
 */
export function renderOutputPanel(config, options = {}) {
  const labels = getLabels(config)
  const { title, badgeHtml, encoded = '', url = '', markdown = '' } = options

  return `
    <section class="preview-panel" aria-label="${title}">
      <div class="preview-header">
        <span class="preview-title">${title}</span>
        <div class="preview-badge">${badgeHtml}</div>
      </div>
      ${renderOutputField('output-statement', '', encoded, labels.copy)}
      ${renderOutputField('output-url', labels.url, url, labels.copy)}
      ${renderOutputField(
        'output-markdown',
        labels.markdown,
        markdown,
        labels.copy
      )}
    </section>
  `
}
