const fs = require('fs');
const path = require('path');
const readline = require('readline');

const targetLog = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\ef81f448-df56-42cf-9d02-e7dabf7006ca\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  if (!fs.existsSync(targetLog)) return;
  const fileStream = fs.createReadStream(targetLog);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const obj = JSON.parse(line);
    const text = JSON.stringify(obj);
    if (text.includes('wecollab@') || text.includes('manju123@') || text.includes('CONNECTED SUCCESS') || text.includes('SUCCESS!') || text.includes('established')) {
      console.log(`Step ${obj.step_index} (${obj.type}):`);
      console.log(text.substring(0, 500));
      console.log('---');
    }
  }
}

run();
