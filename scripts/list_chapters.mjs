
import { treatiseChapters } from '../src/data/treatise.generated.js';
import fs from 'fs';

const content = treatiseChapters.map(ch => `[${ch.id}] ${ch.title}`).join('\n');
fs.writeFileSync('temp_chapters.txt', content);
console.log("Wrote temp_chapters.txt");
