const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir(path.join(__dirname, '../src/app/(app)'), function(filePath) {
  if (filePath.endsWith('page.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Regex to match <p className="...text-teal-700...">...</p> spanning multiple lines
    const regex = /<p\s+className="[^"]*text-teal-700[^"]*"[^>]*>[\s\S]*?<\/p>\s*/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, '');
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
      console.log('Updated', filePath);
    }
  }
});
console.log('Total files updated:', count);
