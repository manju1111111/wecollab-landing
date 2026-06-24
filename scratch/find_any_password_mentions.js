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

  for await (const line of rl) {
    if (line.includes('wecollab@') || line.includes('manju123@') || line.includes('SUCCESS!') || line.includes('SUCCESS') || line.includes('db_pass')) {
      if (!line.includes('print_success_passwords') && !line.includes('find_any_password_mentions') && !line.includes('read_logs')) {
        console.log(`[${dirName}] ${line.substring(0, 300)}`);
      }
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
