const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        getFiles(fullPath, files);
      }
    } else if (file === 'layout.tsx') {
      files.push(fullPath);
    }
  }
  return files;
}

const layouts = getFiles('c:\\Users\\USER\\wecollab-landing');
console.log("All layout.tsx files found:");
layouts.forEach(l => console.log(l));
