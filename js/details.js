/**
 * Details Module
 * Expandable panel for optional detail fields (scope, tools, review, watch, notes)
 * Fully accessible with ARIA support
 */

/**
 * Render the expandable details panel
 * @param {Object} config - App configuration
 * @param {Object} values - Current detail values
 * @returns {string} HTML string
 */
export function renderDetails(config, values = {}) {
  const labels = config.ui.labels
  const fields = Object.entries(config.details)
    .filter(([, field]) => !field.auto)
    .map(([key, field]) => renderDetailField(key, field, values[key]))
    .join('')

  return `
    <details class="details-panel" id="details-panel">
      <summary class="details-toggle" aria-expanded="false">
        <svg class="details-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        ${labels.details}
      </summary>
      <div class="details-content" role="region" aria-label="Optional details">
        ${fields}
      </div>
    </details>
  `
}

/**
 * Render a single detail field
 * @param {string} key - Field key
 * @param {Object} field - Field config
 * @param {*} value - Current value
 * @returns {string} HTML
 */
function renderDetailField(key, field, value) {
  const fieldId = `detail-${key}`
  const descId = field.description ? `${fieldId}-desc` : null
  const desc = field.description
    ? `<p class="field-description" id="${descId}">${field.description}</p>`
    : ''

  let input = ''

  if (field.type === 'enum') {
    const options = field.values
      .map((v) => {
        const selected = v.value === value ? ' selected' : ''
        return `<option value="${v.value}"${selected}>${v.label} — ${v.desc}</option>`
      })
      .join('')
    const ariaDesc = descId ? ` aria-describedby="${descId}"` : ''
    input = `
      <select id="${fieldId}" data-detail="${key}"${ariaDesc}>
        <option value="">Select...</option>
        ${options}
      </select>
    `
  } else if (field.type === 'flags') {
    const groupId = `${fieldId}-group`
    const flagValues = Array.isArray(value) ? value : value ? [value] : []
    const cards = field.values
      .map((v, i) => {
        const checked = flagValues.includes(v.value) ? ' checked' : ''
        const checkboxId = `${fieldId}-${v.value}`
        return `
          <label class="checkbox-card" for="${checkboxId}">
            <input type="checkbox" id="${checkboxId}" value="${v.value}" data-detail="${key}"${checked}
                   aria-describedby="${checkboxId}-desc">
            <div class="checkbox-content">
              <div class="checkbox-title">${v.label}</div>
              <div class="checkbox-desc" id="${checkboxId}-desc">${v.desc}</div>
            </div>
          </label>
        `
      })
      .join('')
    const ariaDesc = descId ? ` aria-describedby="${descId}"` : ''
    input = `<div class="checkbox-grid" role="group" aria-labelledby="${fieldId}-label"${ariaDesc}>${cards}</div>`
  } else if (field.type === 'text') {
    const ariaDesc = descId ? ` aria-describedby="${descId}"` : ''
    if (field.multiline) {
      input = `<textarea id="${fieldId}" data-detail="${key}" placeholder="${field.placeholder || ''}"${ariaDesc}>${value || ''}</textarea>`
    } else {
      input = `<input type="text" id="${fieldId}" data-detail="${key}" placeholder="${field.placeholder || ''}" value="${value || ''}"${ariaDesc}>`
    }
  }

  return `
    <div class="field-group">
      <label class="field-label" for="${fieldId}" id="${fieldId}-label">${field.label}</label>
      ${desc}
      ${input}
    </div>
  `
}

/**
 * Collect current detail values from the DOM
 * @param {Object} config - App configuration
 * @returns {Object} Detail key-value pairs (only non-empty)
 */
export function getDetailValues(config) {
  const result = {}

  for (const [key, field] of Object.entries(config.details)) {
    if (field.auto) {
      if (field.type === 'date') {
        result[key] = new Date().toISOString().split('T')[0]
      }
      continue
    }

    if (field.type === 'flags') {
      const checked = document.querySelectorAll(
        `input[data-detail="${key}"]:checked`
      )
      if (checked.length > 0) {
        result[key] = Array.from(checked).map((el) => el.value)
      }
    } else {
      const el = document.getElementById(`detail-${key}`)
      if (el?.value) result[key] = el.value
    }
  }

  return result
}
