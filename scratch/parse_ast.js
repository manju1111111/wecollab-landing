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

function printStructure(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  
  if (ts.isFunctionDeclaration(node)) {
    console.log(`${indent}FunctionDeclaration: ${node.name ? node.name.text : 'anonymous'} (lines ${line + 1}-${endLine + 1})`);
  } else if (ts.isVariableStatement(node)) {
    for (const decl of node.declarationList.declarations) {
      if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
        console.log(`${indent}VariableDecl (Function): ${decl.name.text} (lines ${line + 1}-${endLine + 1})`);
      }
    }
  }
  
  ts.forEachChild(node, child => printStructure(child, depth + 1));
}

printStructure(sourceFile);
