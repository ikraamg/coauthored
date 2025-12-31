#!/usr/bin/env node
/**
 * Coauthored CLI - encode, decode, assess statements
 *
 * Usage:
 *   node cli.js encode <json-file>
 *   node cli.js decode <statement>
 *   node cli.js assess <statement>
 *   node cli.js validate [config-file]
 */

import { readFileSync } from 'fs';
import { encode, decode, badgeUrl, badgeMarkdown } from './core.js';
import { validateConfig, assess, computeContext } from './config.js';
import { compile } from './rules.js';

function loadConfigSync(path = './coauthored.json') {
  const raw = readFileSync(path, 'utf8');
  const config = JSON.parse(raw);
  validateConfig(config);
  config._compiledRules = config.rules.map(rule => ({
    ...rule,
    evaluator: compile(rule.condition)
  }));
  return config;
}

function printHelp() {
  console.log(`
Coauthored CLI

Usage:
  node cli.js encode <json-file>     Encode JSON data to statement
  node cli.js decode <statement>     Decode statement to JSON
  node cli.js assess <statement>     Assess a statement
  node cli.js validate [config]      Validate config file (default: coauthored.json)
  node cli.js badge <statement>      Generate badge URL
  node cli.js markdown <statement>   Generate markdown badge

Examples:
  echo '{"scope":"pr","intent":"prod"}' > data.json && node cli.js encode data.json
  node cli.js decode 'v:1;o:co;scope:pr;intent:prod'
  node cli.js assess 'v:1;o:co;oversight:none;risk.deploy:pub'
`);
}

const [,, command, ...args] = process.argv;

try {
  const config = loadConfigSync();

  switch (command) {
    case 'encode': {
      const file = args[0];
      if (!file) {
        console.error('Usage: node cli.js encode <json-file>');
        process.exit(1);
      }
      const data = JSON.parse(readFileSync(file, 'utf8'));
      console.log(encode(data, config));
      break;
    }

    case 'decode': {
      const statement = args[0];
      if (!statement) {
        console.error('Usage: node cli.js decode <statement>');
        process.exit(1);
      }
      const data = decode(statement);
      console.log(JSON.stringify(data, null, 2));
      break;
    }

    case 'assess': {
      const statement = args[0];
      if (!statement) {
        console.error('Usage: node cli.js assess <statement>');
        process.exit(1);
      }
      const data = decode(statement);
      const result = assess(data, config);
      const ctx = computeContext(data, config);
      console.log(JSON.stringify({ ...result, context: ctx }, null, 2));
      break;
    }

    case 'validate': {
      const configPath = args[0] || './coauthored.json';
      const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
      validateConfig(cfg);
      console.log(`Config valid: ${configPath}`);
      console.log(`  Origin: ${cfg.meta.origin}`);
      console.log(`  Schema version: ${cfg.meta.schemaVersion}`);
      console.log(`  Fields: ${Object.keys(cfg.fields).length}`);
      console.log(`  Rules: ${cfg.rules.length}`);
      break;
    }

    case 'badge': {
      const statement = args[0];
      if (!statement) {
        console.error('Usage: node cli.js badge <statement>');
        process.exit(1);
      }
      const data = decode(statement);
      const result = assess(data, config);
      console.log(badgeUrl(result.label, result.color));
      break;
    }

    case 'markdown': {
      const statement = args[0];
      if (!statement) {
        console.error('Usage: node cli.js markdown <statement>');
        process.exit(1);
      }
      const data = decode(statement);
      const result = assess(data, config);
      console.log(badgeMarkdown(statement, result.label, result.color, config.meta?.url));
      break;
    }

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    default:
      printHelp();
      process.exit(1);
  }
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
