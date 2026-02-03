#!/usr/bin/env node
/**
 * Coauthored CLI - encode, decode, validate statements
 *
 * Usage:
 *   node cli.js encode <json-file>
 *   node cli.js decode <statement>
 *   node cli.js validate [config-file]
 *   node cli.js badge <statement>
 *   node cli.js markdown <statement>
 */

import { readFileSync } from 'fs'
import { encode, decode, badgeUrl, badgeMarkdown } from './core.js'
import { validateConfig, getQuadrant, getBadgeServiceUrl } from './config.js'

function loadConfigSync(path = './coauthored.json') {
  const raw = readFileSync(path, 'utf8')
  const config = JSON.parse(raw)
  validateConfig(config)
  return config
}

function printHelp() {
  console.log(`
Coauthored CLI

Usage:
  node cli.js encode <json-file>     Encode JSON data to statement
  node cli.js decode <statement>     Decode statement to JSON
  node cli.js validate [config]      Validate config file (default: coauthored.json)
  node cli.js badge <statement>      Generate badge URL
  node cli.js markdown <statement>   Generate markdown badge

Examples:
  echo '{"stakes":4,"autonomy":3,"scope":"pr"}' > data.json && node cli.js encode data.json
  node cli.js decode 'v:2;o:coauthored.dev;stakes:4;autonomy:3'
  node cli.js markdown 'v:2;o:coauthored.dev;stakes:4;autonomy:3;scope:pr'
`)
}

const [, , command, ...args] = process.argv

try {
  const config = loadConfigSync()

  switch (command) {
    case 'encode': {
      const file = args[0]
      if (!file) {
        console.error('Usage: node cli.js encode <json-file>')
        process.exit(1)
      }
      const data = JSON.parse(readFileSync(file, 'utf8'))
      console.log(encode(data, config))
      break
    }

    case 'decode': {
      const statement = args[0]
      if (!statement) {
        console.error('Usage: node cli.js decode <statement>')
        process.exit(1)
      }
      const data = decode(statement)
      if (data && data._v === 2 && data.stakes && data.autonomy) {
        const q = getQuadrant(data.stakes, data.autonomy, config)
        if (q) data._quadrant = q.label
      }
      console.log(JSON.stringify(data, null, 2))
      break
    }

    case 'validate': {
      const configPath = args[0] || './coauthored.json'
      const cfg = JSON.parse(readFileSync(configPath, 'utf8'))
      validateConfig(cfg)
      console.log(`Config valid: ${configPath}`)
      console.log(`  Origin: ${cfg.meta.origin}`)
      console.log(`  Schema version: ${cfg.meta.schemaVersion}`)
      console.log(`  Axes: ${Object.keys(cfg.axes).join(', ')}`)
      console.log(`  Quadrants: ${Object.keys(cfg.quadrants).length}`)
      console.log(`  Details: ${Object.keys(cfg.details).length}`)
      break
    }

    case 'badge': {
      const statement = args[0]
      if (!statement) {
        console.error('Usage: node cli.js badge <statement>')
        process.exit(1)
      }
      const data = decode(statement)
      let text = 'AI Coauthored'
      let color = '58a6ff'
      if (data && data._v === 2) {
        const q = getQuadrant(data.stakes || 3, data.autonomy || 3, config)
        if (q) { text = q.label; color = q.color }
      }
      console.log(badgeUrl(text, color, getBadgeServiceUrl(config)))
      break
    }

    case 'markdown': {
      const statement = args[0]
      if (!statement) {
        console.error('Usage: node cli.js markdown <statement>')
        process.exit(1)
      }
      const data = decode(statement)
      let text = 'AI Coauthored'
      let color = '58a6ff'
      if (data && data._v === 2) {
        const q = getQuadrant(data.stakes || 3, data.autonomy || 3, config)
        if (q) { text = q.label; color = q.color }
      }
      const baseUrl = config.meta?.origin
        ? `https://${config.meta.origin}`
        : 'https://coauthored.dev'
      console.log(badgeMarkdown(statement, text, color, baseUrl, getBadgeServiceUrl(config)))
      break
    }

    case 'help':
    case '--help':
    case '-h':
      printHelp()
      break

    default:
      printHelp()
      process.exit(1)
  }
} catch (e) {
  console.error('Error:', e.message)
  process.exit(1)
}
