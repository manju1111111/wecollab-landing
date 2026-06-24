const fs = require('fs');
const content = fs.readFileSync('components/plans/plan-workspace.tsx', 'utf8');

const lines = content.split('\n');
console.log("Checking deliverable imports or calls:");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('updateCreator') || lines[i].includes('Deliverable') || lines[i].includes('handleUpdate')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
