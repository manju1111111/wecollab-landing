const fs = require('fs');
const readline = require('readline');

const targetLog = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\a3ecc12f-bfcf-4d4f-b824-ffc8c589a81d\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  if (!fs.existsSync(targetLog)) return;
  const fileStream = fs.createReadStream(targetLog);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.step_index === 190) {
      console.log("Step 190 Content in full:");
      console.log(obj.content);
    }
  }
}

run();
