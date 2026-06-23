const fs = require('fs');
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  console.log("Keys in .env.local:");
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts[0] && !parts[0].startsWith('#')) {
      console.log(parts[0].trim());
    }
  });
} else {
  console.log(".env.local not found");
}
