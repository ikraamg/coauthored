/**
 * Theme Module
 * Dark/light mode with system preference detection
 */

const STORAGE_KEY = 'coauthored-theme'

/**
 * Initialize theme from saved preference or system default
 */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)

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
      if (!localStorage.getItem(STORAGE_KEY)) {
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
  localStorage.setItem(STORAGE_KEY, next)
}

/**
 * Get current theme
 * @returns {string} 'dark' or 'light'
 */
export function getTheme() {
  return document.documentElement.dataset.theme || 'dark'
}
