const fs = require('fs');
const path = require('path');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\a3ecc12f-bfcf-4d4f-b824-ffc8c589a81d\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  if (!fs.existsSync(transcriptPath)) {
    console.log("No transcript file found at " + transcriptPath);
    return;
  }
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching current transcript for successful database connection references...");
  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('SUCCESS!') || line.includes('Connected') || line.includes('correct password') || line.includes('manju')) {
      // Print truncated line to avoid too much noise
      console.log(`Line ${lineCount}: ${line.substring(0, 300)}...`);
    }
  }
  console.log("Search complete.");
}

run();
