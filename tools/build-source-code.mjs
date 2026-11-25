import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const old = { window: {} };
runInNewContext(readFileSync('scripts/source-code.js', 'utf8'), old);

const source = { 3: old.window.MpiSourceCode[3], 5: old.window.MpiSourceCode[5] };
for (const [module, tasks] of [
  [2, [10, 11, 16, 18, 21, 24, 26, 29]],
  [3, [48, 51, 54, 57, 59, 62, 64, 67, 69]],
  [4, [30, 34, 37, 40, 43, 45, 71, 75, 77, 79, 80]],
  [5, [83, 85, 92, 94, 96, 100]],
]) {
  for (const task of tasks) {
    source[task] = readFileSync(`downloads/code/module-${module}/MPIBegin${task}.cpp`, 'utf8');
  }
}

writeFileSync(
  'scripts/source-code.js',
  `/* Exact C++ sources from the supplied module folders. */\nwindow.MpiSourceCode = ${JSON.stringify(source, null, 2)};\n`,
);
