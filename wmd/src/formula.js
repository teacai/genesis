/**
 * WMD Formula Evaluator — Parses and evaluates arithmetic expressions
 * that reference field values.
 *
 * Supports: +, -, *, /, %, ^, parentheses, unary minus, number literals,
 * field references, and functions (round, floor, ceil, abs, min, max, pow).
 */

export function evaluateFormula(expression, values) {
  const tokens = tokenize(expression);
  let pos = 0;

  function peek() { return tokens[pos] || null; }
  function consume() { return tokens[pos++]; }

  function expr() { return additive(); }

  function additive() {
    let left = multiplicative();
    while (peek() && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = multiplicative();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function multiplicative() {
    let left = power();
    while (peek() && (peek().value === '*' || peek().value === '/' || peek().value === '%')) {
      const op = consume().value;
      const right = power();
      if (op === '*') left *= right;
      else if (op === '/') left = right !== 0 ? left / right : 0;
      else left = right !== 0 ? left % right : 0;
    }
    return left;
  }

  // Right-associative: 2 ^ 3 ^ 2 = 2 ^ (3 ^ 2) = 512
  function power() {
    let base = unary();
    if (peek() && peek().value === '^') {
      consume();
      base = Math.pow(base, power());
    }
    return base;
  }

  function unary() {
    if (peek() && peek().value === '-' && peek().type === 'op') {
      consume();
      return -unary();
    }
    return primary();
  }

  function primary() {
    const tok = peek();
    if (!tok) return 0;

    if (tok.type === 'number') {
      consume();
      return tok.num;
    }

    if (tok.type === 'ident') {
      consume();
      // Function call: ident '(' args ')'
      if (peek() && peek().value === '(') {
        consume(); // (
        const args = [];
        if (peek() && peek().value !== ')') {
          args.push(expr());
          while (peek() && peek().value === ',') {
            consume(); // ,
            args.push(expr());
          }
        }
        if (peek() && peek().value === ')') consume(); // )
        return callFn(tok.value, args);
      }
      // Field reference
      const val = values[tok.value];
      return val === undefined || val === '' ? 0 : Number(val) || 0;
    }

    if (tok.value === '(') {
      consume();
      const result = expr();
      if (peek() && peek().value === ')') consume();
      return result;
    }

    consume(); // skip unknown
    return 0;
  }

  function callFn(name, args) {
    switch (name) {
      case 'round': {
        const n = args[1] || 0;
        const f = Math.pow(10, n);
        return Math.round(args[0] * f) / f;
      }
      case 'floor': return Math.floor(args[0] || 0);
      case 'ceil':  return Math.ceil(args[0] || 0);
      case 'abs':   return Math.abs(args[0] || 0);
      case 'min':   return args.length ? Math.min(...args) : 0;
      case 'max':   return args.length ? Math.max(...args) : 0;
      case 'pow':   return Math.pow(args[0] || 0, args[1] || 0);
      default:      return 0;
    }
  }

  try {
    const result = expr();
    return isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

function tokenize(expression) {
  const tokens = [];
  let i = 0;

  while (i < expression.length) {
    if (/\s/.test(expression[i])) { i++; continue; }

    // Number literal
    if (/[\d.]/.test(expression[i])) {
      let num = '';
      while (i < expression.length && /[\d.]/.test(expression[i])) {
        num += expression[i++];
      }
      tokens.push({ type: 'number', num: parseFloat(num) || 0, value: num });
      continue;
    }

    // Identifier (field name or function)
    if (/[a-zA-Z_]/.test(expression[i])) {
      let id = '';
      while (i < expression.length && /\w/.test(expression[i])) {
        id += expression[i++];
      }
      tokens.push({ type: 'ident', value: id });
      continue;
    }

    // Operators, parens, comma
    if ('+-*/%^(),'.includes(expression[i])) {
      tokens.push({ type: 'op', value: expression[i] });
      i++;
      continue;
    }

    i++; // skip unknown
  }

  return tokens;
}
