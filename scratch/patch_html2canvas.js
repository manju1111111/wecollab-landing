const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../node_modules/html2canvas/dist');

const files = [
  {
    name: 'html2canvas.js',
    target: 'if (typeof colorFunction === \'undefined\') {\n                    throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");\n                }',
    replacement: 'if (typeof colorFunction === \'undefined\') {\n                    console.warn("Attempting to parse an unsupported color function \\"" + value.name + "\\", falling back to transparent");\n                    return 0;\n                }'
  },
  {
    name: 'html2canvas.esm.js',
    target: 'if (typeof colorFunction === \'undefined\') {\n                throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");\n            }',
    replacement: 'if (typeof colorFunction === \'undefined\') {\n                console.warn("Attempting to parse an unsupported color function \\"" + value.name + "\\", falling back to transparent");\n                return 0;\n            }'
  },
  {
    name: 'html2canvas.min.js',
    target: 'if(void 0===t)throw new Error(\'Attempting to parse an unsupported color function "\'+e.name+\'"\');',
    replacement: 'if(void 0===t){console.warn(\'Attempting to parse an unsupported color function "\'+e.name+\'", falling back to transparent\');return 0;}'
  }
];

files.forEach(f => {
  const filePath = path.join(distDir, f.name);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(f.target)) {
      content = content.replace(f.target, f.replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[PATCH SUCCESS] Patched ${f.name}`);
    } else if (content.includes(f.replacement)) {
      console.log(`[PATCH SKIP] Already patched ${f.name}`);
    } else {
      console.error(`[PATCH ERROR] Target pattern not found in ${f.name}`);
    }
  } else {
    console.error(`[PATCH ERROR] File not found: ${filePath}`);
  }
});
