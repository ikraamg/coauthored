/**
 * Coauthored Schema - coauthored.dev field definitions
 * 
 * This defines what fields OUR wizard shows.
 * Forks can create their own schema with different/additional fields.
 * 
 * Structure:
 * - key: the field key (can use dots for nesting: 'risk.deploy')
 * - type: 'enum' | 'flags' | 'text' | 'date'
 * - label: human-readable label
 * - description: help text
 * - values: for enum/flags, the possible values
 * - category: optional grouping for UI
 */

export const SCHEMA = {
  // Scope & Intent
  scope: {
    type: 'enum',
    label: 'Scope',
    description: 'What does this statement cover?',
    category: 'basics',
    values: [
      { value: 'project', label: 'Project', desc: 'Entire repository or project' },
      { value: 'pr', label: 'Pull Request', desc: 'Specific PR or changeset' },
      { value: 'file', label: 'File', desc: 'Single file' },
      { value: 'component', label: 'Component', desc: 'Module or component' },
    ],
  },
  
  intent: {
    type: 'enum',
    label: 'Intent',
    description: "What's the purpose of this code?",
    category: 'basics',
    values: [
      { value: 'explore', label: 'Exploration', desc: 'Testing ideas, learning the problem space' },
      { value: 'proto', label: 'Prototype', desc: 'Quick proof of concept, not for production' },
      { value: 'validate', label: 'Validation', desc: 'Verifying an approach before committing' },
      { value: 'prod', label: 'Production', desc: 'Intended for real use' },
      { value: 'learn', label: 'Learning', desc: 'Educational purposes' },
    ],
  },
  
  trajectory: {
    type: 'enum',
    label: 'Trajectory',
    description: 'Where is this code going?',
    category: 'basics',
    values: [
      { value: 'throw', label: 'Throwaway', desc: 'Will be discarded' },
      { value: 'iter', label: 'Iterate', desc: 'Will evolve toward production' },
      { value: 'maint', label: 'Maintain', desc: 'Long-term maintenance expected' },
      { value: 'unk', label: 'Unknown', desc: 'Not yet determined' },
    ],
  },
  
  // AI Involvement
  ai: {
    type: 'flags',
    label: 'AI Involvement',
    description: 'How was AI involved?',
    category: 'ai',
    values: [
      { value: 'doc', label: 'Documentation', desc: 'README, comments, explanations' },
      { value: 'code', label: 'Code Generation', desc: 'AI wrote code that was used' },
      { value: 'review', label: 'Code Review', desc: 'AI reviewed human-written code' },
      { value: 'arch', label: 'Architecture', desc: 'Design decisions influenced by AI' },
      { value: 'test', label: 'Testing', desc: 'Test generation or strategy' },
      { value: 'sec', label: 'Security Sensitive', desc: 'AI touched auth, crypto, or security' },
    ],
  },
  
  tools: {
    type: 'text',
    label: 'AI Tools',
    description: 'Which AI tools were used?',
    category: 'ai',
    placeholder: 'Claude, Copilot, GPT-4...',
  },
  
  // Human Oversight
  oversight: {
    type: 'enum',
    label: 'Human Oversight',
    description: 'How thoroughly did humans review the AI-assisted work?',
    category: 'oversight',
    values: [
      { value: 'line', label: 'Line by Line', desc: 'Every line reviewed and understood' },
      { value: 'func', label: 'Functional', desc: 'Tested behavior, implementation reviewed' },
      { value: 'spot', label: 'Spot Check', desc: 'Key areas reviewed, rest trusted' },
      { value: 'tests', label: 'Tests Only', desc: 'Relied on test suite passing' },
      { value: 'min', label: 'Minimal', desc: 'Brief review only' },
      { value: 'none', label: 'None', desc: 'No human review performed' },
    ],
  },
  
  // Risk Context
  'risk.deploy': {
    type: 'enum',
    label: 'Deployment',
    description: 'Where will this code run?',
    category: 'risk',
    values: [
      { value: 'local', label: 'Local Only', desc: 'Developer machine only' },
      { value: 'int', label: 'Internal', desc: 'Internal tools, team use' },
      { value: 'cust', label: 'Customer Facing', desc: 'End users interact with this' },
      { value: 'pub', label: 'Public Infrastructure', desc: 'Critical public systems' },
    ],
  },
  
  'risk.data': {
    type: 'enum',
    label: 'Data Sensitivity',
    description: 'What data is involved?',
    category: 'risk',
    values: [
      { value: 'none', label: 'None', desc: 'No sensitive data' },
      { value: 'int', label: 'Internal', desc: 'Internal business data' },
      { value: 'pii', label: 'PII', desc: 'Personal identifiable information' },
      { value: 'fin', label: 'Financial', desc: 'Payment, banking data' },
      { value: 'health', label: 'Health', desc: 'Medical, health records' },
    ],
  },
  
  'risk.safety': {
    type: 'enum',
    label: 'Safety Implications',
    description: 'What are the safety implications?',
    category: 'risk',
    values: [
      { value: 'none', label: 'None', desc: 'No safety implications' },
      { value: 'prop', label: 'Property', desc: 'Could affect property/assets' },
      { value: 'well', label: 'Wellbeing', desc: 'Could affect human wellbeing' },
      { value: 'life', label: 'Life Critical', desc: 'Human life could be at risk' },
    ],
  },
  
  // Validation
  valid: {
    type: 'flags',
    label: 'Validation',
    description: 'What verification has been done?',
    category: 'validation',
    values: [
      { value: 'unit', label: 'Unit Tests', desc: 'Unit test coverage' },
      { value: 'integ', label: 'Integration Tests', desc: 'Integration/E2E tests' },
      { value: 'sec', label: 'Security Review', desc: 'Security audit performed' },
      { value: 'expert', label: 'Domain Expert', desc: 'Reviewed by domain expert' },
      { value: 'prod', label: 'Production Proven', desc: 'Running in production' },
    ],
  },
  
  // Meta
  notes: {
    type: 'text',
    label: 'Notes',
    description: 'Any additional context?',
    category: 'meta',
    placeholder: 'Optional notes...',
    multiline: true,
  },
  
  created: {
    type: 'date',
    label: 'Created',
    description: 'When was this statement created?',
    category: 'meta',
    auto: true, // Auto-filled by wizard
  },
};

/**
 * Category metadata for UI grouping
 */
export const CATEGORIES = {
  basics: {
    label: 'Basics',
    description: 'What is this code for?',
    order: 1,
  },
  ai: {
    label: 'AI Involvement',
    description: 'How was AI involved?',
    order: 2,
  },
  oversight: {
    label: 'Human Oversight',
    description: 'How was it reviewed?',
    order: 3,
  },
  risk: {
    label: 'Risk Context',
    description: "What's at stake?",
    order: 4,
  },
  validation: {
    label: 'Validation',
    description: 'What testing was done?',
    order: 5,
  },
  meta: {
    label: 'Details',
    description: 'Additional information',
    order: 6,
  },
};

/**
 * Get fields grouped by category
 */
export function getFieldsByCategory() {
  const grouped = {};
  
  for (const [key, field] of Object.entries(SCHEMA)) {
    const cat = field.category || 'other';
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push({ key, ...field });
  }
  
  // Sort by category order
  const sorted = {};
  const catOrder = Object.entries(CATEGORIES)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key]) => key);
  
  for (const cat of catOrder) {
    if (grouped[cat]) {
      sorted[cat] = grouped[cat];
    }
  }
  
  // Add any uncategorized
  for (const [cat, fields] of Object.entries(grouped)) {
    if (!sorted[cat]) {
      sorted[cat] = fields;
    }
  }
  
  return sorted;
}
