const fs = require('fs');
const code = fs.readFileSync('components/admin/newsletter/admin-newsletter-client.tsx', 'utf8');

let stack = [];
for (let i = 0; i < code.length; i++) {
  const char = code[i];
  const line = code.substring(0, i).split('\n').length;
  if (char === '{') {
    stack.push(line);
  } else if (char === '}') {
    if (stack.length === 0) {
      console.log(`Unmatched closing brace at line ${line}`);
    } else {
      stack.pop();
    }
  }
}
console.log('Unclosed braces opened at lines:', stack);
