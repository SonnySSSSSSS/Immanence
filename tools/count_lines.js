const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const exts = ['.js','.jsx','.ts','.tsx','.css','.html','.md','.json'];
function walk(dir){
  let out = [];
  const entries = fs.readdirSync(dir);
  for(const name of entries){
    const p = path.join(dir, name);
    let stat;
    try{ stat = fs.statSync(p); } catch{ continue; }
    if(stat.isDirectory()) out = out.concat(walk(p));
    else if(exts.includes(path.extname(p))) out.push(p);
  }
  return out;
}
const files = walk(root);
let total = 0;
const counts = {};
files.forEach(f => {
  let content;
  try{ content = fs.readFileSync(f, 'utf8'); } catch{ return; }
  const lines = content.split(/\r?\n/).length;
  total += lines;
  const e = path.extname(f);
  counts[e] = (counts[e] || 0) + lines;
});
console.log('TOTAL_LINES:' + total);
Object.keys(counts).sort().forEach(k => console.log(k + ':' + counts[k]));
console.log('FILES_COUNT:' + files.length);