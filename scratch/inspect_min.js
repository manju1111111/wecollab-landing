const fs = require('fs');
const path = require('path');

const minPath = path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.min.js');
if (fs.existsSync(minPath)) {
  const content = fs.readFileSync(minPath, 'utf8');
  const idx = content.indexOf('unsupported color function');
  if (idx !== -1) {
    console.log('FOUND IN MIN.JS:');
    console.log(content.substring(idx - 150, idx + 200));
  } else {
    console.log('NOT FOUND IN MIN.JS');
  }
} else {
  console.log('min.js does not exist at', minPath);
}
