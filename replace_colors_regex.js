const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace all text-slate-700, 800, 900, 950 with text-neutral-text
  content = content.replace(/\b(hover:|focus:|focus-within:)?text-slate-[789]00\b/g, '$1text-neutral-text');
  content = content.replace(/\b(hover:|focus:|focus-within:)?text-gray-[789]00\b/g, '$1text-neutral-text');
  
  // Replace text-slate-400, 500, 600 with text-neutral-muted
  content = content.replace(/\b(hover:|focus:|focus-within:)?text-slate-[456]00\b/g, '$1text-neutral-muted');
  content = content.replace(/\b(hover:|focus:|focus-within:)?text-gray-[456]00\b/g, '$1text-neutral-muted');

  // Replace border-slate-* with border-neutral-border
  content = content.replace(/\b(hover:|focus:|focus-within:)?border-slate-[1234]00\b/g, '$1border-neutral-border');
  content = content.replace(/\b(hover:|focus:|focus-within:)?border-gray-[1234]00\b/g, '$1border-neutral-border');

  // Replace bg-slate-* (light) with bg-neutral-bg
  content = content.replace(/\b(hover:|focus:|focus-within:)?bg-slate-[50|100]\b/g, '$1bg-neutral-bg');
  
  // Replace teal colors
  content = content.replace(/\b(hover:|focus:|focus-within:)?(text|bg|border|ring)-teal-(400|500|600|700|800|900)\b/g, (match, p1, p2) => {
    p1 = p1 || '';
    if (p2 === 'text') return p1 + 'text-brand-default';
    if (p2 === 'bg') return p1 + 'bg-brand-default';
    if (p2 === 'border') return p1 + 'border-brand-default';
    if (p2 === 'ring') return p1 + 'ring-brand-default/50';
    return match;
  });
  
  content = content.replace(/\b(hover:|focus:|focus-within:)?(text|bg|border|ring)-teal-(50|100|200|300)\b/g, (match, p1, p2) => {
    p1 = p1 || '';
    if (p2 === 'text') return p1 + 'text-brand-default';
    if (p2 === 'bg') return p1 + 'bg-brand-pale';
    if (p2 === 'border') return p1 + 'border-brand-default/20';
    if (p2 === 'ring') return p1 + 'ring-brand-default/20';
    return match;
  });

  // Success colors
  content = content.replace(/\b(hover:|focus:|focus-within:)?(text)-emerald-[6789]00\b/g, '$1text-status-success-text');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(text)-green-[6789]00\b/g, '$1text-status-success-text');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(bg)-emerald-[50|100]\b/g, '$1bg-status-success-bg');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(bg)-green-[50|100]\b/g, '$1bg-status-success-bg');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(border)-emerald-[123]00\b/g, '$1border-status-success-bg');

  // Warning colors
  content = content.replace(/\b(hover:|focus:|focus-within:)?(text)-amber-[6789]00\b/g, '$1text-status-warning-text');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(text)-yellow-[6789]00\b/g, '$1text-status-warning-text');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(bg)-amber-[50|100]\b/g, '$1bg-status-warning-bg');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(bg)-yellow-[50|100]\b/g, '$1bg-status-warning-bg');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(border)-amber-[123]00\b/g, '$1border-status-warning-bg');

  // Danger colors
  content = content.replace(/\b(hover:|focus:|focus-within:)?(text)-rose-[6789]00\b/g, '$1text-status-danger-text');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(text)-red-[6789]00\b/g, '$1text-status-danger-text');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(bg)-rose-[50|100]\b/g, '$1bg-status-danger-bg');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(bg)-red-[50|100]\b/g, '$1bg-status-danger-bg');
  content = content.replace(/\b(hover:|focus:|focus-within:)?(border)-rose-[123]00\b/g, '$1border-status-danger-bg');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated regex:', file);
  }
});
console.log('Total files updated with regex:', changedFiles);
