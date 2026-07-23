import fs from 'fs';

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

const replacements = {
  // Brand
  'text-teal-500': 'text-brand-default',
  'text-teal-600': 'text-brand-default',
  'text-teal-700': 'text-brand-default',
  'bg-teal-500': 'bg-brand-default',
  'bg-teal-600': 'bg-brand-default',
  'bg-teal-700': 'bg-brand-default',
  'border-teal-500': 'border-brand-default',
  'border-teal-600': 'border-brand-default',
  'border-teal-700': 'border-brand-default',
  'hover:bg-teal-600': 'hover:bg-brand-hover',
  'hover:bg-teal-700': 'hover:bg-brand-hover',
  'hover:bg-teal-800': 'hover:bg-brand-hover',
  'hover:text-teal-600': 'hover:text-brand-hover',
  'hover:text-teal-700': 'hover:text-brand-hover',
  'hover:text-teal-800': 'hover:text-brand-hover',
  'bg-teal-50': 'bg-brand-pale',
  'bg-teal-100': 'bg-brand-pale',
  'border-teal-100': 'border-brand-default/20',
  'border-teal-200': 'border-brand-default/20',
  'hover:bg-teal-100': 'hover:bg-brand-pale',
  
  // Success
  'text-emerald-600': 'text-status-success-text',
  'text-emerald-700': 'text-status-success-text',
  'text-green-600': 'text-status-success-text',
  'text-green-700': 'text-status-success-text',
  'bg-emerald-50': 'bg-status-success-bg',
  'bg-emerald-100': 'bg-status-success-bg',
  'bg-green-50': 'bg-status-success-bg',
  'border-emerald-100': 'border-status-success-bg',
  'border-emerald-200': 'border-status-success-bg',

  // Warning
  'text-amber-600': 'text-status-warning-text',
  'text-amber-700': 'text-status-warning-text',
  'text-yellow-600': 'text-status-warning-text',
  'text-yellow-700': 'text-status-warning-text',
  'bg-amber-50': 'bg-status-warning-bg',
  'bg-amber-100': 'bg-status-warning-bg',
  'bg-yellow-50': 'bg-status-warning-bg',
  'border-amber-100': 'border-status-warning-bg',
  'border-amber-200': 'border-status-warning-bg',

  // Danger
  'text-rose-600': 'text-status-danger-text',
  'text-rose-700': 'text-status-danger-text',
  'text-red-500': 'text-status-danger-text',
  'text-red-600': 'text-status-danger-text',
  'text-red-700': 'text-status-danger-text',
  'bg-rose-50': 'bg-status-danger-bg',
  'bg-rose-100': 'bg-status-danger-bg',
  'bg-red-50': 'bg-status-danger-bg',
  'border-rose-100': 'border-status-danger-bg',
  'border-rose-200': 'border-status-danger-bg',

  // Neutrals (Bg/Surface)
  'bg-slate-50': 'bg-neutral-bg',
  'bg-gray-50': 'bg-neutral-bg',
  'bg-white': 'bg-neutral-surface',
  
  // Neutrals (Border)
  'border-slate-100': 'border-neutral-border',
  'border-slate-200': 'border-neutral-border',
  'border-slate-300': 'border-neutral-border',
  'border-gray-200': 'border-neutral-border',

  // Neutrals (Text)
  'text-slate-800': 'text-neutral-text',
  'text-slate-900': 'text-neutral-text',
  'text-gray-800': 'text-neutral-text',
  'text-gray-900': 'text-neutral-text',
  'text-slate-400': 'text-neutral-muted',
  'text-slate-500': 'text-neutral-muted',
  'text-slate-600': 'text-neutral-muted',
  'text-gray-500': 'text-neutral-muted',
};

// Also replace specific hex codes
const hexReplacements = {
  'bg-[#064e59]': 'bg-brand-default', // Replace sidebar bg with brand
  'bg-[#f4f8f8]': 'bg-neutral-bg', // Appshell bg
};

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  Object.entries(replacements).forEach(([oldClass, newClass]) => {
    // Replace whole word matches (using boundary, handling tailwind variants)
    // We want to replace `text-teal-700` but not `text-teal-700/50` if we don't have it mapped,
    // actually, let's just use string replacement on boundary for exact classes
    const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
    content = content.replace(regex, newClass);
  });
  
  Object.entries(hexReplacements).forEach(([oldClass, newClass]) => {
    content = content.replace(new RegExp(oldClass.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), newClass);
  });

  // Buttons Rule: Primary buttons #2872F0 fill, white text, hover #0A3D8F
  // Example: bg-brand-default text-white hover:bg-brand-hover
  
  // Secondary buttons: white bg, #2872F0 border/text
  // Example: bg-neutral-surface border border-brand-default text-brand-default
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated:', file);
  }
});
console.log('Total files updated:', changedFiles);
