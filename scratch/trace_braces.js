const fs = require('fs');
const code = fs.readFileSync('components/admin/newsletter/admin-newsletter-client.tsx', 'utf8');

let depth = 0;
let lines = code.split('\n');
let activeFunctionLine = 0;

for (let i = 0; i < lines.length; i++) {
  const lineContent = lines[i];
  let open = 0;
  let close = 0;
  for (let j = 0; j < lineContent.length; j++) {
    if (lineContent[j] === '{') {
      depth++;
      open++;
    } else if (lineContent[j] === '}') {
      depth--;
      close++;
    }
  }
  if (depth === 0 && (open > 0 || close > 0)) {
    console.log(`Line ${i + 1} reaches depth 0. Content: ${lineContent}`);
  }
}
