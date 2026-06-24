const fs = require('fs');
const path = require('path');

const projectDir = 'c:\\Users\\USER\\wecollab-landing';

function walk(dir, results = []) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.next') return;
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walk(filePath, results);
    } else {
      if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.json') || filePath.endsWith('.sql')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk(projectDir);
console.log(`Checking ${files.length} files...`);

for (const file of files) {
  // Exclude our own script
  if (file.includes('find_db_password_in_other_files')) continue;
  
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('aws-1') || content.includes('pooler.supabase.com') || (content.includes('password') && content.includes('postgres') && content.includes('@'))) {
    console.log(`Potential match in: ${file}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('password') || line.includes('Host') || line.includes('wecollab') || line.includes('manju')) {
        console.log(`  Line ${idx+1}: ${line.trim().substring(0, 150)}`);
      }
    });
  }
}
console.log("Check finished.");
