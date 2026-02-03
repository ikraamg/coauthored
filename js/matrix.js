/**
 * Matrix Module
 * 5x5 risk matrix grid with sliders, dot positioning, and quadrant detection
 * Fully accessible with ARIA support for screen readers
 */

import { getQuadrant, getAxisLabel } from '../config.js'
import { encode } from '../core.js'

/**
 * Render the interactive matrix creator
 * @param {Object} config - App configuration
 * @param {Object} initial - Initial values { stakes, autonomy }
 * @param {Function} onChange - Called with { stakes, autonomy, quadrant, encoded } on change
 * @returns {string} HTML string
 */
export function renderMatrix(config, initial = {}, onChange) {
  const stakesAxis = config.axes.stakes
  const autonomyAxis = config.axes.autonomy
  const stakes = initial.stakes ?? stakesAxis.default
  const autonomy = initial.autonomy ?? autonomyAxis.default
  const initialQuadrant = getQuadrant(stakes, autonomy, config)

  const html = `
    <div class="matrix-section" role="region" aria-labelledby="matrix-heading">
      <h2 class="matrix-heading" id="matrix-heading">${config.ui.heading}</h2>

      <div class="matrix-container">
        <div class="matrix-y-label" aria-hidden="true">${autonomyAxis.label}</div>
        <div class="matrix-grid" id="matrix-grid"
             role="img"
             aria-label="Risk matrix visualization showing ${initialQuadrant.label}. Use the sliders below to adjust stakes and AI autonomy levels."
             tabindex="0">
          ${renderQuadrantLabels(config)}
          <div class="matrix-dot" id="matrix-dot" aria-hidden="true"></div>
          <div class="matrix-crosshair-h" id="crosshair-h" aria-hidden="true"></div>
          <div class="matrix-crosshair-v" id="crosshair-v" aria-hidden="true"></div>
        </div>
        <div class="matrix-x-label" aria-hidden="true">${stakesAxis.label}</div>
      </div>

      <div class="matrix-sliders" role="group" aria-label="Risk level controls">
        <div class="slider-group">
          <label class="slider-label" for="slider-stakes" id="stakes-slider-label">
            <span class="slider-name">${stakesAxis.label}</span>
            <span class="slider-value" id="stakes-label">${getAxisLabel('stakes', stakes, config)}</span>
          </label>
          <input type="range" id="slider-stakes" class="slider"
            min="${stakesAxis.min}" max="${stakesAxis.max}" value="${stakes}" step="1"
            aria-labelledby="stakes-slider-label"
            aria-valuemin="${stakesAxis.min}"
            aria-valuemax="${stakesAxis.max}"
            aria-valuenow="${stakes}"
            aria-valuetext="${getAxisLabel('stakes', stakes, config)}">
        </div>
        <div class="slider-group">
          <label class="slider-label" for="slider-autonomy" id="autonomy-slider-label">
            <span class="slider-name">${autonomyAxis.label}</span>
            <span class="slider-value" id="autonomy-label">${getAxisLabel('autonomy', autonomy, config)}</span>
          </label>
          <input type="range" id="slider-autonomy" class="slider"
            min="${autonomyAxis.min}" max="${autonomyAxis.max}" value="${autonomy}" step="1"
            aria-labelledby="autonomy-slider-label"
            aria-valuemin="${autonomyAxis.min}"
            aria-valuemax="${autonomyAxis.max}"
            aria-valuenow="${autonomy}"
            aria-valuetext="${getAxisLabel('autonomy', autonomy, config)}">
        </div>
      </div>

      <div class="quadrant-banner" id="quadrant-banner" role="status" aria-live="polite" aria-atomic="true"></div>

      <!-- Screen reader announcements -->
      <div id="sr-announcements" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
    </div>
  `

  return html
}

/**
 * Render quadrant label overlays for the grid
 * @param {Object} config
 * @returns {string} HTML
 */
function renderQuadrantLabels(config) {
  const positions = {
    vibe: 'top-left',
    inspection: 'top-right',
    handcrafted: 'bottom-left',
    professional: 'bottom-right',
    collaborative: 'center',
  }

  return Object.entries(config.quadrants)
    .map(([key, q]) => {
      const pos = positions[key] || 'center'
      return `<div class="matrix-quadrant-label matrix-quadrant-label--${pos}" data-quadrant="${key}" aria-hidden="true">${q.label}</div>`
    })
    .join('')
}

/**
 * Initialize matrix interactivity after DOM is ready
 * @param {Object} config - App configuration
 * @param {Object} initial - Initial values
 * @param {Function} onChange - Callback
 */
export function initMatrix(config, initial = {}, onChange) {
  const stakesSlider = document.getElementById('slider-stakes')
  const autonomySlider = document.getElementById('slider-autonomy')
  const stakesLabel = document.getElementById('stakes-label')
  const autonomyLabel = document.getElementById('autonomy-label')
  const grid = document.getElementById('matrix-grid')

  if (!stakesSlider || !autonomySlider || !grid) return

  let lastQuadrant = null

  function update(announceChange = false) {
    const s = parseInt(stakesSlider.value, 10)
    const a = parseInt(autonomySlider.value, 10)

    const stakesText = getAxisLabel('stakes', s, config)
    const autonomyText = getAxisLabel('autonomy', a, config)

    stakesLabel.textContent = stakesText
    autonomyLabel.textContent = autonomyText

    // Update ARIA values for screen readers
    stakesSlider.setAttribute('aria-valuenow', s)
    stakesSlider.setAttribute('aria-valuetext', stakesText)
    autonomySlider.setAttribute('aria-valuenow', a)
    autonomySlider.setAttribute('aria-valuetext', autonomyText)

    positionDot(s, a, config)
    const quadrant = updateQuadrantBanner(s, a, config)

    // Update grid description
    grid.setAttribute('aria-label',
      `Risk matrix visualization showing ${quadrant.label}. Stakes: ${stakesText}. AI Autonomy: ${autonomyText}.`)

    // Announce quadrant change to screen readers
    if (announceChange && lastQuadrant !== quadrant.key) {
      announceToScreenReader(`Risk level changed to ${quadrant.label}. ${quadrant.description}`)
    }
    lastQuadrant = quadrant.key

    if (onChange) {
      onChange({ stakes: s, autonomy: a, quadrant })
    }
  }

  stakesSlider.addEventListener('input', () => update(true))
  autonomySlider.addEventListener('input', () => update(true))

  // Allow clicking on the grid to set position
  grid.addEventListener('click', (e) => {
    const rect = grid.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const s = Math.round(x * 4 + 1)
    const a = Math.round((1 - y) * 4 + 1)

    stakesSlider.value = Math.max(1, Math.min(5, s))
    autonomySlider.value = Math.max(1, Math.min(5, a))
    update(true)

    // Move focus to stakes slider for keyboard users
    stakesSlider.focus()
  })

  // Keyboard navigation on the grid
  grid.addEventListener('keydown', (e) => {
    let s = parseInt(stakesSlider.value, 10)
    let a = parseInt(autonomySlider.value, 10)
    let handled = false

    switch (e.key) {
      case 'ArrowRight':
        s = Math.min(5, s + 1)
        handled = true
        break
      case 'ArrowLeft':
        s = Math.max(1, s - 1)
        handled = true
        break
      case 'ArrowUp':
        a = Math.min(5, a + 1)
        handled = true
        break
      case 'ArrowDown':
        a = Math.max(1, a - 1)
        handled = true
        break
    }

    if (handled) {
      e.preventDefault()
      stakesSlider.value = s
      autonomySlider.value = a
      update(true)
    }
  })

  // Initial render (don't announce on load)
  update(false)
}

/**
 * Announce a message to screen readers
 * @param {string} message
 */
function announceToScreenReader(message) {
  const announcer = document.getElementById('sr-announcements')
  if (announcer) {
    announcer.textContent = message
    // Clear after a short delay to allow re-announcement of same message
    setTimeout(() => { announcer.textContent = '' }, 1000)
  }
}

/**
 * Position the dot and crosshairs on the grid
 * @param {number} stakes - 1-5
 * @param {number} autonomy - 1-5
 * @param {Object} config
 */
function positionDot(stakes, autonomy, config) {
  const dot = document.getElementById('matrix-dot')
  const crossH = document.getElementById('crosshair-h')
  const crossV = document.getElementById('crosshair-v')
  if (!dot) return

  // Convert 1-5 to 0-100%
  const xPct = ((stakes - 1) / 4) * 100
  const yPct = ((5 - autonomy) / 4) * 100

  dot.style.left = `${xPct}%`
  dot.style.top = `${yPct}%`

  const quadrant = getQuadrant(stakes, autonomy, config)
  dot.style.setProperty('--dot-color', `#${quadrant.color}`)

  if (crossH) {
    crossH.style.top = `${yPct}%`
    crossH.style.setProperty('--cross-color', `#${quadrant.color}`)
  }
  if (crossV) {
    crossV.style.left = `${xPct}%`
    crossV.style.setProperty('--cross-color', `#${quadrant.color}`)
  }

  // Highlight active quadrant label
  document.querySelectorAll('.matrix-quadrant-label').forEach((el) => {
    el.classList.toggle('active', el.dataset.quadrant === quadrant.key)
  })
}

/**
 * Update the quadrant banner below sliders
 * @param {number} stakes
 * @param {number} autonomy
 * @param {Object} config
 * @returns {Object} The current quadrant
 */
function updateQuadrantBanner(stakes, autonomy, config) {
  const banner = document.getElementById('quadrant-banner')
  const q = getQuadrant(stakes, autonomy, config)

  if (banner) {
    banner.innerHTML = `
      <span class="quadrant-dot" style="background: #${q.color}" aria-hidden="true"></span>
      <span class="quadrant-name">${q.label}</span>
      <span class="quadrant-desc">${q.description}</span>
    `
    banner.style.setProperty('--banner-color', `#${q.color}`)
  }

  return q
}

/**
 * Get current slider values from DOM
 * @returns {{ stakes: number, autonomy: number }}
 */
export function getMatrixValues() {
  const s = document.getElementById('slider-stakes')
  const a = document.getElementById('slider-autonomy')
  return {
    stakes: s ? parseInt(s.value, 10) : 3,
    autonomy: a ? parseInt(a.value, 10) : 3,
  }
}
