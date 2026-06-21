const fs = require('fs');
const content = fs.readFileSync('app/analytics/page.tsx', 'utf8');
const startIdx = content.indexOf('return (');
const endIdx = content.lastIndexOf(');');
const subContent = content.substring(startIdx, endIdx);

let inTag = false;
let tagText = '';
let inQuotes = null;
let braceLevel = 0;
let tagsStack = [];

for (let i = 0; i < subContent.length; i++) {
  const c = subContent[i];
  if (!inTag) {
    if (c === '<' && subContent[i+1] !== ' ' && subContent[i+1] !== '=') {
      inTag = true;
      tagText = c;
      braceLevel = 0;
      inQuotes = null;
    }
  } else {
    tagText += c;
    if (inQuotes) {
      if (c === inQuotes) inQuotes = null;
    } else if (c === '"' || c === "'") {
      inQuotes = c;
    } else if (c === '{') {
      braceLevel++;
    } else if (c === '}') {
      braceLevel--;
    } else if (c === '>' && braceLevel === 0) {
      inTag = false;
      processTag(tagText, startIdx + i - tagText.length + 1);
    }
  }
}

function processTag(text, filePos) {
  const isSelfClosing = text.endsWith('/>') || text.endsWith('/ >');
  const match = text.match(/^<(\/)?([a-zA-Z0-9.:_-]+)/);
  if (!match) return;
  const isClosing = !!match[1];
  const tagName = match[2];
  
  if (['br', 'hr', 'img', 'input', 'p.icon', 'm.icon'].includes(tagName.toLowerCase())) return;
  if (isSelfClosing) return;
  
  if (tagName === 'header' || tagName === 'svg') {
    console.log(`${isClosing ? 'Pop' : 'Push'} of ${tagName} at pos ${filePos}`);
  }
  
  if (isClosing) {
    tagsStack.pop();
  } else {
    tagsStack.push(tagName);
  }
}
console.log('Final stack:', tagsStack);
