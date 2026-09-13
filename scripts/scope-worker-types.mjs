// Keep generated Worker declarations separate from Astro's browser DOM.
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'src/partner-worker.d.ts';
let source = readFileSync(file, 'utf8').replace(/[ \t]+$/gm, '');
if (!source.includes('export type { PartnerWorkerBindings };')) {
  source += '\nexport type { PartnerWorkerBindings };\n';
}
writeFileSync(file, source);
