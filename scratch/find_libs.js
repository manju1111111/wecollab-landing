const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('html2canvas') || content.includes('jspdf') || content.includes('jsPDF')) {
        console.log(`FOUND in file: ${fullPath}`);
        // print lines
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('html2canvas') || line.includes('jspdf') || line.includes('jsPDF')) {
            console.log(`  L${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('.');
