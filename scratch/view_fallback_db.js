const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/fallback-db.json');
if (!fs.existsSync(dbPath)) {
  console.log("No fallback-db.json exists.");
  process.exit(0);
}

const content = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(content);

console.log("Keys in fallback-db.json:", Object.keys(db));
for (const key of Object.keys(db)) {
  if (Array.isArray(db[key])) {
    console.log(`- ${key}: ${db[key].length} records`);
    if (db[key].length > 0) {
      console.log("  Sample:", db[key][0]);
    }
  } else {
    console.log(`- ${key}:`, db[key]);
  }
}
