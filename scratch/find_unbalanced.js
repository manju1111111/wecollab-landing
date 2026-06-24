const fs = require('fs');
const code = fs.readFileSync('components/admin/newsletter/admin-newsletter-client.tsx', 'utf8');

let stack = [];
let i = 0;
const n = code.length;

function getLine(pos) {
  return code.substring(0, pos).split('\n').length;
}

while (i < n) {
  const char = code[i];
  
  // Skip single line comment
  if (char === '/' && code[i+1] === '/') {
    while (i < n && code[i] !== '\n') i++;
    continue;
  }
  
  // Skip multi line comment
  if (char === '/' && code[i+1] === '*') {
    i += 2;
    while (i < n && !(code[i] === '*' && code[i+1] === '/')) i++;
    i += 2;
    continue;
  }
  
  // Skip double quote string
  if (char === '"') {
    i++;
    while (i < n && code[i] !== '"') {
      if (code[i] === '\\') i += 2;
      else i++;
    }
    i++;
    continue;
  }
  
  // Skip single quote string
  if (char === "'") {
    i++;
    while (i < n && code[i] !== "'") {
      if (code[i] === '\\') i += 2;
      else i++;
    }
    i++;
    continue;
  }
  
  // Skip template literal
  if (char === '`') {
    i++;
    while (i < n && code[i] !== '`') {
      if (code[i] === '\\') i += 2;
      else if (code[i] === '$' && code[i+1] === '{') {
        stack.push({ type: 'template_expr', line: getLine(i) });
        i += 2;
      }
      else i++;
    }
    i++;
    continue;
  }
  
  if (char === '{') {
    stack.push({ type: 'brace', line: getLine(i) });
  } else if (char === '}') {
    if (stack.length === 0) {
      console.log(`STRAY CLOSING BRACE at line ${getLine(i)}`);
    } else {
      const top = stack.pop();
    }
  }
  
  i++;
}

console.log('Unclosed items in stack:', stack);
