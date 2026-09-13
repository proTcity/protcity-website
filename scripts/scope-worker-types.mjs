// Wrangler emits global runtime declarations that collide with Astro's browser DOM.
// Keep generated types in a module, exporting only the binding contract we consume.
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'src/partner-worker.d.ts';
const source = readFileSync(file, 'utf8');
if (!source.includes('export type { PartnerWorkerBindings };')) {
  writeFileSync(file, source + '\nexport type { PartnerWorkerBindings };\n');
}
