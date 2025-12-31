/**
 * Coauthored App
 * Main orchestration module
 */

import { loadConfig } from '../config.js'
import { decode, parseUrl } from '../core.js'
import { initTheme, toggleTheme } from './theme.js'
import { renderWizard, getStepper } from './form.js'
import { renderViewer, editStatement } from './viewer.js'
import { clearDraft } from './draft.js'

/** @type {Object|null} */
let config = null

/**
 * Initialize the application
 */
async function init() {
  try {
    config = await loadConfig()
    initTheme()
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
  renderWizard(config, handleSubmit)
}

/**
 * Handle form submission - view the statement
 */
function handleSubmit() {
  if (window._currentEncoded) {
    clearDraft()
    history.pushState(null, '', `#${window._currentEncoded}`)
    route()
  }
}

/**
 * Handle edit button click
 * @param {string} encoded - Encoded statement to edit
 */
function handleEdit(encoded) {
  editStatement(encoded)
  route()
}

/**
 * Handle new statement button click
 */
function handleNew() {
  clearDraft()
  history.pushState(null, '', window.location.pathname)
  route()
}

/**
 * Reset the form
 */
function resetForm() {
  clearDraft()
  history.pushState(null, '', window.location.pathname)
  route()
}

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
      document.activeElement?.tagName
    )
    const isMod = e.metaKey || e.ctrlKey

    // Cmd/Ctrl + Enter: Submit
    if (isMod && e.key === 'Enter') {
      e.preventDefault()
      const viewBtn = document.querySelector('[data-action="view"]')
      if (viewBtn) viewBtn.click()
      return
    }

    // Cmd/Ctrl + D: Toggle theme
    if (isMod && e.key === 'd') {
      e.preventDefault()
      toggleTheme()
      return
    }

    if (isInput) return

    const stepper = getStepper()
    if (!stepper) return

    // Arrow navigation
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      stepper.next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      stepper.prev()
    }

    // Number keys for step jump
    if (/^[1-6]$/.test(e.key)) {
      e.preventDefault()
      stepper.goToStep(parseInt(e.key, 10) - 1)
    }

    // Escape to reset
    if (e.key === 'Escape') {
      if (confirm('Reset the form?')) {
        resetForm()
      }
    }
  })
}

// Start the app
init()
