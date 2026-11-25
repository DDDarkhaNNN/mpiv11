import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let missing = 0;
for (const page of ['index.html', 'practice.html', 'theory.html', 'resources.html']) {
  const html = readFileSync(page, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(?:https?:|mailto:|#)/.test(ref)) continue;
    const path = decodeURIComponent(ref.split(/[?#]/)[0]);
    if (!existsSync(join('.', path))) {
      console.error(`${page}: missing ${ref}`);
      missing++;
    }
  }
}
for (const task of [3, 5]) {
  const file = `downloads/code/MPIBegin${task}.cpp`;
  if (!existsSync(file)) { console.error(`missing ${file}`); missing++; }
}
for (const [module, tasks] of [
  [2, [10, 11, 16, 18, 21, 24, 26, 29]],
  [3, [48, 51, 54, 57, 59, 62, 64, 67, 69]],
  [4, [30, 34, 37, 40, 43, 45, 71, 75, 77, 79, 80]],
]) {
  for (const task of tasks) {
    const file = `downloads/code/module-${module}/MPIBegin${task}.cpp`;
    if (!existsSync(file)) { console.error(`missing ${file}`); missing++; }
  }
}
console.log(missing ? `${missing} missing links` : 'All local links and MPI source files exist.');
if (missing) process.exitCode = 1;
