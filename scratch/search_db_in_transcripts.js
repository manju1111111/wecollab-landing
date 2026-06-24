const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain';

async function searchFile(filePath, dirName) {
  if (!fs.existsSync(filePath)) return;
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    const lower = line.toLowerCase();
    if (line.includes('SUCCESS!') || line.includes('Connected to') || line.includes('dbHost') || lower.includes('database password') || lower.includes('db_password')) {
      console.log(`[${dirName}] Line ${lineCount}: ${line.substring(0, 300)}`);
    }
  }
}

async function run() {
  const dirs = fs.readdirSync(brainDir);
  for (const dir of dirs) {
    const stat = fs.statSync(path.join(brainDir, dir));
    if (stat.isDirectory()) {
      const transcriptPath = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript.jsonl');
      await searchFile(transcriptPath, dir);
    }
  }
  console.log('Search finished.');
}

run();
