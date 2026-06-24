const ts = require('typescript');
const fs = require('fs');

const filename = 'components/admin/newsletter/admin-newsletter-client.tsx';
const content = fs.readFileSync(filename, 'utf8');

const sourceFile = ts.createSourceFile(
  filename,
  content,
  ts.ScriptTarget.Latest,
  true
);

const diagnostics = sourceFile.parseDiagnostics || [];
console.log(`Found ${diagnostics.length} diagnostics:`);
for (const diag of diagnostics) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start);
  console.log(`Error at line ${line + 1}, char ${character + 1}: ${diag.messageText}`);
}
