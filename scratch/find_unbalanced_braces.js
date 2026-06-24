const fs = require('fs');

const code = fs.readFileSync('components/admin/newsletter/admin-newsletter-client.tsx', 'utf8');

let braces = 0;
let brackets = 0;
let parens = 0;
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Ignore single-line comments
  if (line.trim().startsWith('//')) continue;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;
    else if (char === '(') parens++;
    else if (char === ')') parens--;
  }
  
  if (braces < 0) {
    console.log(`Line ${i + 1}: Extra closing brace. Count: ${braces}`);
    braces = 0; // reset
  }
  if (brackets < 0) {
    console.log(`Line ${i + 1}: Extra closing bracket. Count: ${brackets}`);
    brackets = 0;
  }
  if (parens < 0) {
    console.log(`Line ${i + 1}: Extra closing parenthesis. Count: ${parens}`);
    parens = 0;
  }
}

console.log(`End count: Braces: ${braces}, Brackets: ${brackets}, Parens: ${parens}`);
