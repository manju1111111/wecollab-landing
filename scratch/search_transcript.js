const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\37bbb181-0da4-4658-abfc-66dd46715de8\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (lineCount < 600) {
      const lower = line.toLowerCase();
      if ((lower.includes('password') || lower.includes('key') || lower.includes('conn') || lower.includes('pooler')) && 
          !lower.includes('show_env_keys') && !lower.includes('check_parent_env') && !lower.includes('search_transcript')) {
        console.log(`Line ${lineCount}: ${line.substring(0, 160)}...`);
      }
    }
  }
}

search();
