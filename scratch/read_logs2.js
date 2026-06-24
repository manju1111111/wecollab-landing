const fs = require('fs');
const path = require('path');
const readline = require('readline');

const targetLog = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\ef81f448-df56-42cf-9d02-e7dabf7006ca\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  if (!fs.existsSync(targetLog)) {
    console.log("Log not found:", targetLog);
    return;
  }
  const fileStream = fs.createReadStream(targetLog);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.type === 'RUN_COMMAND' && obj.content && (obj.content.includes('SUCCESS!') || obj.content.includes('Connected'))) {
      console.log("Command Output:", obj.content);
    }
  }
}

run();
