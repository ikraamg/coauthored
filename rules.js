/**
 * Safe Rule Engine - evaluates boolean expressions without eval()
 *
 * Supports:
 * - Comparisons: >=, <=, >, <, ==, !=
 * - Logical: AND, OR, NOT
 * - Parentheses for grouping
 * - Identifiers reference computed values
 *
 * Example: "risk >= 4 AND oversight <= 2"
 */

const TOKEN = {
  NUMBER: 'NUMBER',
  IDENTIFIER: 'IDENTIFIER',
  BOOLEAN: 'BOOLEAN',
  COMPARATOR: 'COMPARATOR',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  EOF: 'EOF'
};

/**
 * Tokenize an expression string
 * @param {string} expr - Expression like "risk >= 4 AND oversight <= 2"
 * @returns {Array} Tokens
 */
function tokenize(expr) {
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }

    // Two-char comparators first
    if (expr.slice(i, i+2) === '>=') { tokens.push({ type: TOKEN.COMPARATOR, value: '>=' }); i += 2; continue; }
    if (expr.slice(i, i+2) === '<=') { tokens.push({ type: TOKEN.COMPARATOR, value: '<=' }); i += 2; continue; }
    if (expr.slice(i, i+2) === '==') { tokens.push({ type: TOKEN.COMPARATOR, value: '==' }); i += 2; continue; }
    if (expr.slice(i, i+2) === '!=') { tokens.push({ type: TOKEN.COMPARATOR, value: '!=' }); i += 2; continue; }
    if (expr.slice(i, i+2) === '&&') { tokens.push({ type: TOKEN.AND }); i += 2; continue; }
    if (expr.slice(i, i+2) === '||') { tokens.push({ type: TOKEN.OR }); i += 2; continue; }

    // Single-char
    if (expr[i] === '>') { tokens.push({ type: TOKEN.COMPARATOR, value: '>' }); i++; continue; }
    if (expr[i] === '<') { tokens.push({ type: TOKEN.COMPARATOR, value: '<' }); i++; continue; }
    if (expr[i] === '(') { tokens.push({ type: TOKEN.LPAREN }); i++; continue; }
    if (expr[i] === ')') { tokens.push({ type: TOKEN.RPAREN }); i++; continue; }
    if (expr[i] === '!') { tokens.push({ type: TOKEN.NOT }); i++; continue; }

    // Numbers
    if (/\d/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) { num += expr[i++]; }
      tokens.push({ type: TOKEN.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Keywords and identifiers
    if (/[a-zA-Z_]/.test(expr[i])) {
      let id = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) { id += expr[i++]; }

      const upper = id.toUpperCase();
      if (upper === 'AND') { tokens.push({ type: TOKEN.AND }); continue; }
      if (upper === 'OR') { tokens.push({ type: TOKEN.OR }); continue; }
      if (upper === 'NOT') { tokens.push({ type: TOKEN.NOT }); continue; }
      if (id === 'true') { tokens.push({ type: TOKEN.BOOLEAN, value: true }); continue; }
      if (id === 'false') { tokens.push({ type: TOKEN.BOOLEAN, value: false }); continue; }

      tokens.push({ type: TOKEN.IDENTIFIER, value: id });
      continue;
    }

    throw new Error(`Unexpected character: ${expr[i]} at position ${i}`);
  }

  tokens.push({ type: TOKEN.EOF });
  return tokens;
}

/**
 * Parse tokens into AST
 */
function parse(tokens) {
  let pos = 0;

  const current = () => tokens[pos];
  const consume = (type) => {
    if (current().type !== type) {
      throw new Error(`Expected ${type}, got ${current().type}`);
    }
    return tokens[pos++];
  };

  // expr := term ((AND | OR) term)*
  function parseExpr() {
    let left = parseTerm();

    while (current().type === TOKEN.AND || current().type === TOKEN.OR) {
      const op = tokens[pos++].type;
      const right = parseTerm();
      left = { type: op, left, right };
    }

    return left;
  }

  // term := NOT? factor
  function parseTerm() {
    if (current().type === TOKEN.NOT) {
      consume(TOKEN.NOT);
      return { type: 'NOT', operand: parseFactor() };
    }
    return parseFactor();
  }

  // factor := comparison | boolean | identifier | '(' expr ')'
  function parseFactor() {
    if (current().type === TOKEN.LPAREN) {
      consume(TOKEN.LPAREN);
      const expr = parseExpr();
      consume(TOKEN.RPAREN);
      return expr;
    }

    if (current().type === TOKEN.BOOLEAN) {
      return { type: 'LITERAL', value: consume(TOKEN.BOOLEAN).value };
    }

    if (current().type === TOKEN.IDENTIFIER) {
      const id = consume(TOKEN.IDENTIFIER).value;

      if (current().type === TOKEN.COMPARATOR) {
        const op = consume(TOKEN.COMPARATOR).value;
        let right;
        if (current().type === TOKEN.NUMBER) {
          right = consume(TOKEN.NUMBER).value;
        } else if (current().type === TOKEN.IDENTIFIER) {
          right = { type: 'VAR', name: consume(TOKEN.IDENTIFIER).value };
        } else {
          throw new Error(`Expected number or identifier after comparator`);
        }
        return { type: 'COMPARE', left: id, op, right };
      }

      return { type: 'VAR', name: id };
    }

    throw new Error(`Unexpected token: ${current().type}`);
  }

  return parseExpr();
}

/**
 * Evaluate AST against context
 * @param {Object} ast - Parsed AST
 * @param {Object} ctx - Variable context { risk: 4, oversight: 2, hasTests: true }
 * @returns {boolean}
 */
function evaluate(ast, ctx) {
  switch (ast.type) {
    case 'LITERAL':
      return ast.value;

    case 'VAR':
      return ctx[ast.name] ?? false;

    case 'COMPARE': {
      const left = ctx[ast.left] ?? 0;
      const right = typeof ast.right === 'object' ? ctx[ast.right.name] ?? 0 : ast.right;

      switch (ast.op) {
        case '>=': return left >= right;
        case '<=': return left <= right;
        case '>':  return left > right;
        case '<':  return left < right;
        case '==': return left === right;
        case '!=': return left !== right;
      }
      break;
    }

    case 'AND':
      return evaluate(ast.left, ctx) && evaluate(ast.right, ctx);

    case 'OR':
      return evaluate(ast.left, ctx) || evaluate(ast.right, ctx);

    case 'NOT':
      return !evaluate(ast.operand, ctx);
  }

  return false;
}

/**
 * Compile an expression string to a reusable evaluator
 * @param {string} expr - Expression string
 * @returns {Function} Evaluator function that takes context
 */
export function compile(expr) {
  const tokens = tokenize(expr);
  const ast = parse(tokens);
  return (ctx) => evaluate(ast, ctx);
}

/**
 * Evaluate expression directly
 * @param {string} expr - Expression string
 * @param {Object} ctx - Variable context
 * @returns {boolean}
 */
export function evalExpr(expr, ctx) {
  return compile(expr)(ctx);
}
