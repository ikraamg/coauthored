/**
 * Coauthored App
 * Single-page orchestration with risk matrix
 */

import { loadConfig } from '../config.js'
import { decode, encode, parseUrl } from '../core.js'
import { initTheme, toggleTheme } from './theme.js'
import { renderMatrix, initMatrix, getMatrixValues } from './matrix.js'
import { renderDetails, getDetailValues } from './details.js'
import { renderViewer } from './viewer.js'
import { renderOutputPanel, updateOutputValues } from './output.js'

/** @type {Object|null} */
let config = null

/**
 * Initialize the application
 */
async function init() {
  try {
    config = await loadConfig()
    initTheme(config)
    initKeyboardShortcuts()

    const footerText = document.getElementById('footer-text')
    if (footerText) {
      footerText.textContent = config.ui?.footer || ''
    }

    route()
    window.addEventListener('hashchange', route)
  } catch (e) {
    document.getElementById('app').innerHTML = `
      <div class="notice" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.1);">
        <p class="notice-title" style="color: #ef4444;">Error loading config</p>
        <p class="notice-text">${e.message}</p>
      </div>
    `
  }
}

/**
 * Route based on URL hash
 */
function route() {
  const hash = parseUrl(window.location.hash)
  if (hash) {
    const data = decode(hash)
    if (data) {
      renderViewer(data, hash, config, handleEdit, handleNew)
      return
    }
  }
  renderCreator()
}

/**
 * Render the matrix creator (single page)
 * @param {Object} initial - Initial values for editing
 */
function renderCreator(initial = {}) {
  const matrixHtml = renderMatrix(config, initial)
  const detailsHtml = renderDetails(config, initial)
  const outputHtml = renderOutputPanel(config)
  const labels = config.ui.labels

  document.getElementById('app').innerHTML = `
    ${matrixHtml}
    ${detailsHtml}
    <div class="submit-row">
      <button type="button" class="btn btn-primary" id="btn-submit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        ${labels.submit}
      </button>
    </div>
    ${outputHtml}
  `

  // Wire up matrix interactivity
  initMatrix(config, initial, (matrixData) => {
    updateEncoded()
  })

  // Wire up submit button
  document.getElementById('btn-submit')?.addEventListener('click', submitStatement)

  // Wire up detail field changes
  document.getElementById('app').addEventListener('input', (e) => {
    if (e.target.dataset.detail || e.target.closest('[data-detail]')) {
      updateEncoded()
    }
  })
  document.getElementById('app').addEventListener('change', (e) => {
    if (e.target.dataset.detail || e.target.closest('[data-detail]')) {
      updateEncoded()
    }
  })

  // Initial encoding
  updateEncoded()
}

/**
 * Build encoded string from current form state and update output panel
 */
function updateEncoded() {
  const { stakes, autonomy } = getMatrixValues()
  const details = getDetailValues(config)

  const data = { stakes, autonomy, ...details }
  const encoded = encode(data, config)

  updateOutputValues(encoded, config)
}

/**
 * Handle edit button click from viewer
 * @param {string} encoded - Encoded statement to edit
 */
function handleEdit(encoded) {
  const data = decode(encoded)
  if (!data) return

  history.pushState(null, '', window.location.pathname)
  renderCreator({
    stakes: data.stakes,
    autonomy: data.autonomy,
    ...data,
  })
}

/**
 * Handle new statement button click
 */
function handleNew() {
  history.pushState(null, '', window.location.pathname)
  route()
}

/**
 * Submit the current statement (navigate to viewer)
 */
function submitStatement() {
  const output = document.getElementById('output-statement')
  if (output?.value) {
    history.pushState(null, '', `#${output.value}`)
    route()
  }
}

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const isMod = e.metaKey || e.ctrlKey

    // Cmd/Ctrl + Enter: Submit (navigate to viewer)
    if (isMod && e.key === 'Enter') {
      e.preventDefault()
      submitStatement()
      return
    }

    // Cmd/Ctrl + D: Toggle theme
    if (isMod && e.key === 'd') {
      e.preventDefault()
      toggleTheme()
    }
  })
}

// Start the app
init()
