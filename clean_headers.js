const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('page.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src/app/(app)');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Remove the <p className="flex items-center ...">...</p> before <h1>
  content = content.replace(/<p className="flex items-center gap-2[^>]*>[\s\S]*?<\/p>\s*<h1/g, '<h1');
  
  // Also remove the <p className="mt-2 text-slate-500"...>...</p> after </h1>
  content = content.replace(/<\/h1>\s*<p className="mt-[1-2] text-slate-500[^>]*>[\s\S]*?<\/p>/g, '</h1>');
  
  // Some pages have <p className="mt-1 text-sm text-slate-500"... (like grn/new/page.tsx)
  content = content.replace(/<\/h1>\s*<p className="mt-1 text-sm text-slate-500[^>]*>[\s\S]*?<\/p>/g, '</h1>');

  // Change <h1 className="mt-1 text-3xl..." to <h1 className="text-3xl..."
  content = content.replace(/<h1 className="mt-1 /g, '<h1 className="');
  
  // Replace text-slate-900 with text-neutral-text
  content = content.replace(/<h1 className="([^"]*)text-slate-900([^"]*)"/g, '<h1 className="$1text-neutral-text$2"');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Cleaned header in:', file);
  }
});
