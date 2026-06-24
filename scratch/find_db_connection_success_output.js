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
    const obj = JSON.parse(line);
    if (obj.type === 'RUN_COMMAND' && obj.content && obj.content.includes('SUCCESS')) {
      console.log(`[${dirName}] Command output had SUCCESS:`);
      console.log(obj.content);
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
