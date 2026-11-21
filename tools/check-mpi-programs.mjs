/* Windows smoke test for the supplied binaries against their documented examples. */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const context = { window: {} };
runInNewContext(readFileSync('scripts/file-examples.js', 'utf8'), context);
const examples = context.window.MpiFileExamples;
const tasks = {
  10: { module: 2, expected: { 0: '4 5 4 5 3 6' } },
  11: { module: 2, expected: { 1: '1.5', 2: '-2', 3: '4.25' } },
  16: { module: 2, expected: { 0: '12' } },
  18: { module: 2, expected: { 0: '40', 1: '10', 2: '20', 3: '30' } },
  21: { module: 2, expected: { 0: '2.5 (отправитель: 1)', 1: '3.5 (отправитель: 2)', 2: '1.5 (отправитель: 0)' } },
  24: { module: 2, expected: { 0: '8 -2.5 4', 1: '1.5' } },
  26: { module: 2, expected: { 0: '-1 8.25 4.5' } },
  29: { module: 2, expected: { 0: '8 -3 2.5' } },
  48: { module: 3, expected: { 0: '11 22 33 44 55 66 77' } },
  51: { module: 3, expected: { 0: '4.5 1.5 0 -1.875 0 10.5 0 -2.25', 1: '4.5 1.5 0 -1.875 0 10.5 0 -2.25', 2: '4.5 1.5 0 -1.875 0 10.5 0 -2.25' } },
  54: { module: 3, expected: { 0: '3 3', 1: '3 2', 2: '3.5 2' } },
  57: { module: 3, expected: { 0: '0 5 1 1 -7 -6 -7 7', 1: '5 5 1 3 -5 6 3 7', 2: '5 5 1 7 -5 6 3 7' } },
  59: { module: 3, expected: { 1: '-3 1 -5', 2: '7 -5 -5' } },
  62: { module: 3, expected: { 1: '-1 0.5 7', 2: '7 1 -5' } },
  64: { module: 3, expected: { 0: '6 2 -3 -5 -2.5 -2 7 0 6', 1: '6 2 -3 -5 -2.5 -2 7 0 6', 2: '6 2 -3 -5 -2.5 -2 7 0 6' } },
  67: { module: 3, expected: { 1: '-6 1.5 1', 2: '-2 3.5 3' } },
  69: { module: 3, expected: { 0: '6 -1 -0.5 5 5 2.5' } },
};

function inputRows(id, example) {
  const { k, values: v } = example;
  const rows = [];
  const joinTriple = r => `${v[`x_${r}`]} ${v[`y_${r}`]} ${v[`z_${r}`]}`;
  if (id === 11) rows.push(Array.from({ length: k - 1 }, (_, i) => v[`v_${i + 1}`]).join(' '));
  else if (id === 16) rows.push(v.expected_0, ...Array.from({ length: k - 1 }, (_, i) => v[`v_${i + 1}`]));
  else if ([59, 62, 67].includes(id)) rows.push(Array.from({ length: k - 1 }, (_, i) => id === 59 ? v[`set_${i + 1}`] : joinTriple(i + 1)).join(' '));
  else for (let r = [10, 26, 29, 69].includes(id) ? 1 : 0; r < k; r++) {
    if ([10, 24, 48, 51, 54, 57].includes(id)) rows.push(v[`set_${r}`]);
    else if (id === 29) rows.push(`${v[`t_${r}`]} ${v[`set_${r}`]}`);
    else if (id === 26) rows.push(`${v[`a_${r}`]} ${v[`n_${r}`]}`);
    else if (id === 21) rows.push(`${v[`a_${r}`]} ${v[`n_${r}`]}`);
    else if ([64, 69].includes(id)) rows.push(joinTriple(r));
    else if (id === 18) rows.push(v[`v_${r}`]);
  }
  return [String(k), ...rows, '-1', ''].join('\n');
}

let failed = 0;
for (const [idString, test] of Object.entries(tasks)) {
  const id = Number(idString);
  const program = `downloads/code/module-${test.module}/MPIBegin${id}.exe`;
  const run = spawnSync(program, { input: inputRows(id, examples[id]), encoding: 'utf8', timeout: 10000, windowsHide: true });
  const output = (run.stdout || '').replace(/-0(?=\s|$)/g, '0');
  const actual = Object.fromEntries([...output.matchAll(/Ответ ранга (\d+): ([^\r\n]*)/g)].map(m => [m[1], m[2].trim()]));
  const okay = !run.error && run.status === 0 && JSON.stringify(actual) === JSON.stringify(test.expected);
  console.log(`${okay ? 'OK' : 'FAIL'} MPIBegin${id}`, okay ? '' : JSON.stringify({ actual, expected: test.expected, error: String(run.error || ''), status: run.status, stderr: run.stderr }));
  if (!okay) failed++;
}
if (failed) process.exitCode = 1;
