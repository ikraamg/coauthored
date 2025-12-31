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
import { validateConfig, getBadge } from './config.js'

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
  echo '{"scope":"pr","intent":["explore","prod"]}' > data.json && node cli.js encode data.json
  node cli.js decode 'v:1;o:co;scope:pr;intent:explore,prod'
  node cli.js markdown 'v:1;o:co;scope:pr;ai:code;tool:claude'
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
      console.log(`  Fields: ${Object.keys(cfg.fields).length}`)
      console.log(`  Categories: ${Object.keys(cfg.categories).length}`)
      break
    }

    case 'badge': {
      const statement = args[0]
      if (!statement) {
        console.error('Usage: node cli.js badge <statement>')
        process.exit(1)
      }
      const badge = getBadge(config)
      console.log(badgeUrl(badge.text, badge.color))
      break
    }

    case 'markdown': {
      const statement = args[0]
      if (!statement) {
        console.error('Usage: node cli.js markdown <statement>')
        process.exit(1)
      }
      const badge = getBadge(config)
      console.log(
        badgeMarkdown(statement, badge.text, badge.color, config.meta?.url)
      )
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
