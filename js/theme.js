/**
 * Theme Module
 * Dark/light mode with system preference detection
 */

import { getStorageKey } from '../config.js'

/** @type {Object|null} */
let currentConfig = null

/**
 * Get the storage key for theme
 * @returns {string}
 */
function getThemeKey() {
  return getStorageKey(currentConfig, 'theme')
}

/**
 * Initialize theme from saved preference or system default
 * @param {Object} config - App configuration
 */
export function initTheme(config) {
  currentConfig = config
  const saved = localStorage.getItem(getThemeKey())

  if (saved) {
    document.documentElement.dataset.theme = saved
  } else {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
  }

  // Bind toggle button
  const toggle = document.getElementById('theme-toggle')
  if (toggle) {
    toggle.addEventListener('click', toggleTheme)
  }

  // Listen for system preference changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (!localStorage.getItem(getThemeKey())) {
        document.documentElement.dataset.theme = e.matches ? 'dark' : 'light'
      }
    })
}

/**
 * Toggle between dark and light theme
 */
export function toggleTheme() {
  const current = document.documentElement.dataset.theme
  const next = current === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  localStorage.setItem(getThemeKey(), next)
}
