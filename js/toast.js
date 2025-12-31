/**
 * Toast Notification Module
 * Simple toast notifications for copy feedback and status messages
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Toast type: 'success' or 'error'
 * @param {number} duration - How long to show the toast (ms)
 */
export function showToast(message, type = 'success', duration = 2500) {
  const container = document.getElementById('toast-container')
  if (!container) return

  const toast = document.createElement('div')
  toast.className = `toast toast--${type}`
  toast.textContent = message
  toast.setAttribute('role', 'status')
  container.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('toast--exiting')
    toast.addEventListener('transitionend', () => toast.remove(), {
      once: true,
    })
    // Fallback removal if transition doesn't fire
    setTimeout(() => toast.remove(), 200)
  }, duration)
}

/**
 * Copy text to clipboard and show toast feedback
 * @param {string} elementId - ID of the input element to copy from
 */
export async function copyField(elementId) {
  const el = document.getElementById(elementId)
  if (!el) return

  try {
    await navigator.clipboard.writeText(el.value)
    showToast('Copied to clipboard!')
  } catch (err) {
    showToast('Failed to copy', 'error')
  }
}
