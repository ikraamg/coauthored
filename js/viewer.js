/**
 * Viewer Module
 * Matrix-first readonly display with quadrant banner
 * Backward compatible with v1 bullet format
 */

import { getQuadrant, getAxisLabel, getLabel, getLabels, getBaseUrl, getBadgeServiceUrl } from '../config.js'
import { badgeUrl, badgeMarkdown } from '../core.js'
import { copyField } from './toast.js'
import { renderOutputPanel } from './output.js'

/**
 * Render the viewer mode
 * @param {Object} data - Decoded statement data
 * @param {string} encoded - Encoded statement string
 * @param {Object} config - App configuration
 * @param {Function} onEdit - Callback when edit button is clicked
 * @param {Function} onNew - Callback when new button is clicked
 */
export function renderViewer(data, encoded, config, onEdit, onNew) {
  const isV2 = data._v === 2
  const html = isV2
    ? renderV2Viewer(data, encoded, config)
    : renderV1Viewer(data, encoded, config)

  const labels = getLabels(config)

  document.getElementById('app').innerHTML = `
    ${html}
    <div class="viewer-actions">
      <button type="button" class="btn btn-primary" id="btn-edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        ${labels.edit}
      </button>
      <button type="button" class="btn btn-secondary" id="btn-new">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 5v14M5 12h14"/></svg>
        ${labels.createNew}
      </button>
    </div>
    ${renderViewerOutput(encoded, config)}
  `

  document.getElementById('btn-edit')?.addEventListener('click', () => {
    if (onEdit) onEdit(encoded)
  })
  document.getElementById('btn-new')?.addEventListener('click', () => {
    if (onNew) onNew()
  })
  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', () => copyField(btn.dataset.copy))
  })
}

/**
 * Render v2 matrix-first viewer
 */
function renderV2Viewer(data, encoded, config) {
  const stakes = data.stakes || 3
  const autonomy = data.autonomy || 3
  const q = getQuadrant(stakes, autonomy, config)

  const xPct = ((stakes - 1) / 4) * 100
  const yPct = ((5 - autonomy) / 4) * 100

  const notice = config.ui?.notices?.viewer || {}

  const detailBullets = renderV2Details(data, config)

  return `
    <div class="viewer">
      <div class="viewer-notice">
        <p class="viewer-notice-text">${notice.text || ''}</p>
      </div>

      <div class="viewer-quadrant-banner" style="--banner-color: #${q.color}">
        <span class="quadrant-dot" style="background: #${q.color}"></span>
        <span class="quadrant-name">${q.label}</span>
        <span class="quadrant-desc">${q.description}</span>
      </div>

      <div class="viewer-matrix-readonly">
        <div class="viewer-matrix-grid">
          <div class="matrix-dot" style="left: ${xPct}%; top: ${yPct}%; --dot-color: #${q.color}"></div>
          <div class="matrix-crosshair-h" style="top: ${yPct}%; --cross-color: #${q.color}"></div>
          <div class="matrix-crosshair-v" style="left: ${xPct}%; --cross-color: #${q.color}"></div>

          <div class="matrix-quadrant-label matrix-quadrant-label--top-left ${q.key === 'vibe' ? 'active' : ''}">${config.quadrants.vibe.label}</div>
          <div class="matrix-quadrant-label matrix-quadrant-label--top-right ${q.key === 'inspection' ? 'active' : ''}">${config.quadrants.inspection.label}</div>
          <div class="matrix-quadrant-label matrix-quadrant-label--bottom-left ${q.key === 'handcrafted' ? 'active' : ''}">${config.quadrants.handcrafted.label}</div>
          <div class="matrix-quadrant-label matrix-quadrant-label--bottom-right ${q.key === 'professional' ? 'active' : ''}">${config.quadrants.professional.label}</div>
          <div class="matrix-quadrant-label matrix-quadrant-label--center ${q.key === 'collaborative' ? 'active' : ''}">${config.quadrants.collaborative.label}</div>
        </div>

        <div class="viewer-axis-values">
          <div class="viewer-axis-item">
            <span class="viewer-axis-label">${config.axes.stakes.label}</span>
            <span class="viewer-axis-value">${getAxisLabel('stakes', stakes, config)}</span>
          </div>
          <div class="viewer-axis-item">
            <span class="viewer-axis-label">${config.axes.autonomy.label}</span>
            <span class="viewer-axis-value">${getAxisLabel('autonomy', autonomy, config)}</span>
          </div>
        </div>
      </div>

      ${detailBullets}
    </div>
  `
}

/**
 * Render detail bullets for v2 viewer
 */
function renderV2Details(data, config) {
  const bullets = []

  const detailFields = [
    { key: 'scope', label: 'Scope' },
    { key: 'tools', label: 'Tools' },
    { key: 'review', label: 'Review' },
    { key: 'watch', label: 'Watch areas' },
  ]

  for (const { key, label } of detailFields) {
    const value = data[key]
    if (!value) continue

    if (Array.isArray(value)) {
      const labels = value.map((v) => getLabel(key, v, config))
      bullets.push(`<li><span class="bullet-label">${label}</span>${labels.join(', ')}</li>`)
    } else {
      const display = getLabel(key, value, config)
      bullets.push(`<li><span class="bullet-label">${label}</span>${display}</li>`)
    }
  }

  if (data.notes) {
    bullets.push(`<li><span class="bullet-label">Notes</span>${data.notes}</li>`)
  }

  if (data.created) {
    bullets.push(`<li><span class="bullet-label">Created</span>${data.created}</li>`)
  }

  if (bullets.length === 0) return ''

  return `
    <div class="viewer-details">
      <div class="viewer-section-title">Details</div>
      <ul>${bullets.join('')}</ul>
    </div>
  `
}

/**
 * Render v1 legacy bullet format viewer
 */
function renderV1Viewer(data, encoded, config) {
  const notice = config.ui?.notices?.viewer || {}

  // v1 fields - render as simple bullet list
  const bulletFields = [
    { key: 'scope', label: 'Scope' },
    { key: 'intent', label: 'Purpose' },
    { key: 'traj', label: 'Lifespan' },
    { key: 'ai', label: 'AI helped' },
    { key: 'tools', label: 'Tools' },
    { key: 'review', label: 'Review' },
    { key: 'strengths', label: 'Expertise' },
    { key: 'env', label: 'Environment' },
    { key: 'data', label: 'Data sensitivity' },
    { key: 'valid', label: 'Testing' },
    { key: 'watch', label: 'Watch areas' },
  ]

  const bullets = []
  for (const { key, label } of bulletFields) {
    const value = data[key]
    if (!value) continue
    const display = Array.isArray(value) ? value.join(', ') : value
    bullets.push(`<li><span class="bullet-label">${label}</span>${display}</li>`)
  }

  if (data.notes) {
    bullets.push(`<li><span class="bullet-label">Notes</span>${data.notes}</li>`)
  }

  return `
    <div class="viewer">
      <div class="viewer-notice">
        <p class="viewer-notice-text">${notice.text || ''}</p>
      </div>
      <div class="viewer-legacy-banner">
        <span class="legacy-badge">v1</span>
        Legacy format
      </div>
      <div class="viewer-bullets">
        <ul>${bullets.join('')}</ul>
      </div>
    </div>
  `
}

/**
 * Render output panel for viewer mode
 */
function renderViewerOutput(encoded, config) {
  const labels = getLabels(config)
  const baseUrl = getBaseUrl()
  const badgeService = getBadgeServiceUrl(config)
  const fullUrl = `${baseUrl}/#${encoded}`

  // Determine badge text/color from encoded data
  const { decode } = import('../core.js').then ? {} : {}
  let badgeText = 'AI Coauthored'
  let badgeColor = '58a6ff'

  // Try to get quadrant info from the hash
  const data = decodeFromString(encoded)
  if (data && data._v === 2) {
    const q = getQuadrant(data.stakes || 3, data.autonomy || 3, config)
    if (q) {
      badgeText = q.label
      badgeColor = q.color
    }
  }

  const markdown = badgeMarkdown(encoded, badgeText, badgeColor, baseUrl, badgeService)
  const badgeImgHtml = `<img src="${badgeUrl(badgeText, badgeColor, badgeService)}" alt="Badge">`

  return renderOutputPanel(config, {
    title: labels.share,
    badgeHtml: badgeImgHtml,
    encoded,
    url: fullUrl,
    markdown,
    badgeText,
    badgeColor,
  })
}

/**
 * Inline decode to avoid circular import
 */
function decodeFromString(str) {
  if (!str || typeof str !== 'string') return null
  try {
    const result = {}
    for (const segment of str.split(';')) {
      if (!segment) continue
      const ci = segment.indexOf(':')
      if (ci === -1) continue
      const key = segment.slice(0, ci)
      const val = segment.slice(ci + 1)
      if (key === 'v') result._v = parseInt(val, 10)
      else if (key === 'o') result._o = val
      else if (/^-?\d+$/.test(val)) result[key] = parseInt(val, 10)
      else result[key] = val
    }
    return result
  } catch {
    return null
  }
}
