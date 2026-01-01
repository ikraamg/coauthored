/**
 * Stepper Module
 * Multi-step wizard navigation with animations
 */

import { getLabels } from '../config.js'

/**
 * Stepper class for managing step navigation
 */
export class Stepper {
  /**
   * Create a stepper instance
   * @param {string[]} steps - Array of step keys
   * @param {Object} config - Full app config
   * @param {Function} onStepChange - Callback when step changes
   */
  constructor(steps, config, onStepChange = null) {
    this.steps = steps
    this.config = config
    this.categories = config.categories
    this.labels = getLabels(config)
    this.currentStep = 0
    this.onStepChange = onStepChange
  }

  /**
   * Navigate to a specific step
   * @param {number} index - Step index to navigate to
   */
  goToStep(index) {
    if (index < 0 || index >= this.steps.length) return
    if (index === this.currentStep) return

    const direction = index > this.currentStep ? 'forward' : 'back'
    const currentStepEl = document.querySelector(
      `.step[data-step="${this.steps[this.currentStep]}"]`
    )
    const nextStepEl = document.querySelector(
      `.step[data-step="${this.steps[index]}"]`
    )

    if (!currentStepEl || !nextStepEl) return

    // Animate current step out
    const exitClass =
      direction === 'forward' ? 'step--exiting' : 'step--exiting-back'
    currentStepEl.classList.add(exitClass)

    setTimeout(() => {
      currentStepEl.classList.remove('step--exiting', 'step--exiting-back')
      currentStepEl.setAttribute('aria-hidden', 'true')

      // Animate next step in
      const enterClass =
        direction === 'forward' ? 'step--entering' : 'step--entering-back'
      nextStepEl.setAttribute('aria-hidden', 'false')
      nextStepEl.classList.add(enterClass)

      setTimeout(() => {
        nextStepEl.classList.remove('step--entering', 'step--entering-back')
      }, 350)

      // Focus first field in new step
      const firstInput = nextStepEl.querySelector('input, select, textarea')
      if (firstInput) firstInput.focus()
    }, 350)

    // Update stepper indicators
    this.updateIndicators(index)

    const prevStep = this.currentStep
    this.currentStep = index

    // Update navigation buttons
    this.updateNavButtons()

    // Callback
    if (this.onStepChange) {
      this.onStepChange(index, prevStep, direction)
    }
  }

  /**
   * Go to next step
   */
  next() {
    this.goToStep(this.currentStep + 1)
  }

  /**
   * Go to previous step
   */
  prev() {
    this.goToStep(this.currentStep - 1)
  }

  /**
   * Check if on last step
   * @returns {boolean}
   */
  isLastStep() {
    return this.currentStep === this.steps.length - 1
  }

  /**
   * Check if on first step
   * @returns {boolean}
   */
  isFirstStep() {
    return this.currentStep === 0
  }

  /**
   * Update stepper indicator states
   * @param {number} activeIndex - Currently active step index
   */
  updateIndicators(activeIndex) {
    document.querySelectorAll('.stepper-step').forEach((step, i) => {
      step.classList.remove('stepper-step--active', 'stepper-step--completed')
      if (i < activeIndex) step.classList.add('stepper-step--completed')
      if (i === activeIndex) step.classList.add('stepper-step--active')
    })
  }

  /**
   * Update navigation button states
   */
  updateNavButtons() {
    const prevBtn = document.getElementById('btn-prev')
    const nextBtn = document.getElementById('btn-next')

    if (prevBtn) {
      prevBtn.disabled = this.isFirstStep()
    }

    if (nextBtn) {
      if (this.isLastStep()) {
        nextBtn.innerHTML = `
          ${this.labels.submit}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        `
        nextBtn.setAttribute('data-action', 'view')
      } else {
        nextBtn.innerHTML = `
          ${this.labels.next}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        `
        nextBtn.removeAttribute('data-action')
      }
    }
  }

  /**
   * Render the stepper track HTML
   * @returns {string} HTML string for stepper
   */
  renderTrack() {
    return `
      <nav class="stepper" aria-label="Form progress">
        <ol class="stepper-track">
          ${this.steps
            .map(
              (step, i) => `
            <li class="stepper-step ${
              i === 0 ? 'stepper-step--active' : ''
            }" data-step="${step}" data-index="${i}">
              <span class="stepper-indicator">${i + 1}</span>
              <span class="stepper-label">${
                this.categories[step]?.label || step
              }</span>
            </li>
          `
            )
            .join('')}
        </ol>
      </nav>
    `
  }

  /**
   * Bind click listeners to stepper steps
   */
  bindStepClicks() {
    document.querySelectorAll('.stepper-step').forEach((step) => {
      step.addEventListener('click', () => {
        const index = parseInt(step.dataset.index, 10)
        this.goToStep(index)
      })
    })
  }

  /**
   * Bind navigation button listeners
   * @param {Function} onSubmit - Callback for final step submission
   */
  bindNavButtons(onSubmit) {
    const prevBtn = document.getElementById('btn-prev')
    const nextBtn = document.getElementById('btn-next')

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev())
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.isLastStep()) {
          if (onSubmit) onSubmit()
        } else {
          this.next()
        }
      })
    }
  }
}

/**
 * Create step navigation HTML
 * @param {Object} config - App configuration
 * @returns {string} HTML string for navigation buttons
 */
export function renderStepNav(config) {
  const labels = getLabels(config)
  return `
    <nav class="step-nav" aria-label="Step navigation">
      <button type="button" class="btn btn-secondary" id="btn-prev" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        ${labels.previous}
      </button>
      <button type="button" class="btn btn-primary" id="btn-next">
        ${labels.next}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </nav>
  `
}
