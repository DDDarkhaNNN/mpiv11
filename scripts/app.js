const TASKS = window.MpiLabData.tasks;

let currentModule = 1;
let currentTask = 3;

const taskList = document.querySelector('#taskList');
const taskSelect = document.querySelector('#taskSelect');
const taskTitle = document.querySelector('#taskTitle');
const taskCode = document.querySelector('#taskCode');
const taskDescription = document.querySelector('#taskDescription');
const taskModule = document.querySelector('#taskModule');
const processCount = document.querySelector('#processCount');
const processStrip = document.querySelector('#processStrip');
const dynamicFields = document.querySelector('#dynamicFields');
const form = document.querySelector('#calculatorForm');
const resultContent = document.querySelector('#resultContent');

const clampK = () => Math.max(2, Math.min(12, Math.trunc(Number(processCount.value)) || 2));
const nums = value => value.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
const fmt = value => { assert(Number.isFinite(value), 'Нәтиже сандық диапазоннан асты. Кіші мәндерді енгізіңіз.'); return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12))); };
const field = (label, id, value, type = 'number', attrs = '') => `<div class="input-group"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${value}" required ${attrs.replace(/step="0\.[^"]+"/g,'step="any"')}></div>`;
const area = (label, id, values) => `<div class="input-group"><label for="${id}">${label}</label><textarea id="${id}" name="${id}" spellcheck="false">${values.join(' ')}</textarea></div>`;
const card = (rank, body, note = '') => `<section class="field-card"><h4>P${rank} <span>rank ${rank}${rank === 0 ? ' · main' : ''}</span></h4>${body}${note}</section>`;

function renderTaskList() {
  const query = (document.querySelector('#taskSearch')?.value || '').trim().toLowerCase();
  const visibleTasks = TASKS[currentModule].filter(t => `mpibegin${t.id} ${t.short} ${t.description}`.toLowerCase().includes(query));
  taskSelect.innerHTML = visibleTasks.length ? visibleTasks.map(t => `<option value="${t.id}">MPIBegin${t.id} — ${t.short}</option>`).join('') : '<option value="">Тапсырма табылмады</option>';
  taskSelect.value = String(currentTask);
  if (!visibleTasks.some(t => t.id === currentTask) && visibleTasks.length) { taskSelect.insertAdjacentHTML('afterbegin','<option value="" selected>Тапсырманы таңдаңыз</option>'); }
  taskList.innerHTML = visibleTasks.map(t => `
    <button class="task-button ${t.id === currentTask ? 'active' : ''}" data-task="${t.id}">
      <span class="task-number">${t.id}</span><span><strong>MPIBegin${t.id}</strong><small>${t.short}</small></span>
    </button>`).join('');
  taskList.querySelectorAll('.task-button').forEach(button => button.addEventListener('click', () => selectTask(Number(button.dataset.task))));
  if (!visibleTasks.length) taskList.innerHTML = '<p class="no-tasks">Бұл модульден тапсырма табылмады.</p>';
}

function selectTask(id) {
  currentTask = id;
  const task = TASKS[currentModule].find(t => t.id === id);
  taskModule.textContent = `Модуль ${currentModule}`;
  taskTitle.textContent = task.short;
  if (taskCode) taskCode.textContent = `MPIBegin${id}`;
  taskDescription.textContent = task.description;
  renderTaskList();
  renderInputs();
  resultContent.innerHTML = '<p class="result-placeholder" data-kk="Нәтиже осы жерде көрсетіледі. Мәндерді енгізіп, «Есептеу» батырмасын басыңыз." data-ru="Результат появится здесь. Введите значения и нажмите «Рассчитать».">Нәтиже осы жерде көрсетіледі. Мәндерді енгізіп, «Есептеу» батырмасын басыңыз.</p>';
}

function renderProcessStrip(k) {
  processStrip.innerHTML = Array.from({ length: k }, (_, r) => `<div class="process-chip ${r === 0 ? 'main' : ''}"><b>P${r}</b><span>${r === 0 ? 'main' : `rank ${r}`}</span></div>`).join('');
}

function sampleVector(rank, count, mode = 'int') {
  return Array.from({ length: count }, (_, i) => mode === 'int' ? rank * 10 + i + 1 : Number((rank + 1 + i / 10).toFixed(1)));
}

function renderInputs() {
  const k = clampK();
  processCount.value = k;
  renderProcessStrip(k);
  let html = '';

  if (currentTask === 3) {
    html = '<p class="form-note">Жұп рангтар үшін бүтін, тақ рангтар үшін нақты мән енгізіңіз.</p><div class="field-grid">' +
      Array.from({ length: k }, (_, r) => card(r, field(r % 2 === 0 ? 'Бүтін n' : 'Нақты x', `v_${r}`, r % 2 === 0 ? 10 + r : r + .5, 'number', r % 2 ? 'step="0.1"' : 'step="1"'))).join('') + '</div>';
  } else if (currentTask === 5) {
    html = '<div class="field-grid">' + Array.from({ length: k }, (_, r) => card(r, area('Сандар жиыны', `set_${r}`, sampleVector(r, Math.min(10,r + 3), 'real')))).join('') + '</div>';
  } else if (currentTask === 10) {
    html = '<div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, area('1–4 бүтін сан', `set_${r}`, sampleVector(r, (r % 4) + 1)))).join('') + '</div>';
  } else if (currentTask === 11) {
    html = '<p class="form-note">Негізгі процесс мәндерді P1, P2, … ретімен таратады.</p><div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(0, field(`P${r} үшін мән`, `v_${r}`, r + .5, 'number', 'step="0.1"'))).join('') + '</div>';
  } else if (currentTask === 16) {
    html = '<div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, field('N', `v_${r}`, r % 2 ? r : -r, 'number', 'step="1"'))).join('') + '</div>';
  } else if (currentTask === 18) {
    html = '<div class="field-grid">' + Array.from({ length: k }, (_, r) => card(r, field('Бастапқы бүтін сан', `v_${r}`, (r + 1) * 10, 'number', 'step="1"'))).join('') + '</div>';
  } else if (currentTask === 21) {
    html = '<p class="form-note">N мәндері 0…K−1 сандарының қайталанбайтын перестановкасы болуы керек.</p><div class="field-grid">' + Array.from({ length: k }, (_, r) => card(r, `<div class="field-row">${field('A', `a_${r}`, r + .5, 'number', 'step="0.1"')}${field('N', `n_${r}`, (r + 1) % k, 'number', `min="0" max="${k - 1}" step="1"`)}</div>`)).join('') + '</div>';
  } else if (currentTask === 24) {
    html = (k % 2 ? '<p class="form-note">Бұл есепке жұп процесс саны қажет. Процестер санын өзгертіңіз.</p>' : '') + '<div class="field-grid">' + Array.from({ length: k }, (_, r) => card(r, area('1–4 нақты сан', `set_${r}`, sampleVector(r, (r % 4) + 1, 'real')))).join('') + '</div>';
  } else if (currentTask === 26) {
    html = '<p class="form-note">N мәндері 1…K−1 сандарының қайталанбайтын перестановкасы болуы керек.</p><div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, `<div class="field-row">${field('A', `a_${r}`, r * 1.25, 'number', 'step="0.01"')}${field('N', `n_${r}`, k - r, 'number', `min="1" max="${k - 1}" step="1"`)}</div>`)).join('') + '</div>';
  } else if (currentTask === 29) {
    html = '<div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, `<div class="field-row"><div class="input-group"><label for="t_${r}">T — дерек типі</label><select id="t_${r}" name="t_${r}"><option value="0" ${r % 2 === 0 ? 'selected' : ''}>0 — бүтін</option><option value="1" ${r % 2 ? 'selected' : ''}>1 — нақты</option></select></div></div>${area('Сандар', `set_${r}`, sampleVector(r, 2 + r % 2, r % 2 ? 'real' : 'int'))}`)).join('') + '</div>';
  } else if ([48, 51, 57].includes(currentTask)) {
    const count = k + 5;
    html = `<p class="form-note">Әр процесте дәл ${count} мән болуы керек.</p><div class="field-grid">` + Array.from({ length: k }, (_, r) => card(r, area(`${count} ${currentTask === 48 || currentTask === 57 ? 'бүтін' : 'нақты'} сан`, `set_${r}`, sampleVector(r, count, currentTask === 51 ? 'real' : 'int')))).join('') + '</div>';
  } else if (currentTask === 54) {
    const count = 2 * k;
    html = `<p class="form-note">Әр процесте дәл ${count} сан болуы керек.</p><div class="field-grid">` + Array.from({ length: k }, (_, r) => card(r, area(`${count} нақты сан`, `set_${r}`, sampleVector(r, count, 'real')))).join('') + '</div>';
  } else if (currentTask === 59) {
    html = '<div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(0, area(`P${r} үшін 3 бүтін сан`, `set_${r}`, [r, r + 1, r + 2]))).join('') + '</div>';
  } else if ([62, 67].includes(currentTask)) {
    html = '<div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(0, `<div class="field-row">${field(`P${r}: int`, `x_${r}`, r, 'number', 'step="1"')}${field('double', `y_${r}`, r + .5, 'number', 'step="0.1"')}${field('int', `z_${r}`, r + 1, 'number', 'step="1"')}</div>`)).join('') + '</div>';
  } else if (currentTask === 64) {
    html = '<div class="field-grid">' + Array.from({ length: k }, (_, r) => card(r, `<div class="field-row">${field('int', `x_${r}`, r, 'number', 'step="1"')}${field('double', `y_${r}`, r + .5, 'number', 'step="0.1"')}${field('int', `z_${r}`, r + 1, 'number', 'step="1"')}</div>`)).join('') + '</div>';
  } else if (currentTask === 69) {
    html = '<div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, `<div class="field-row">${field('int', `x_${r}`, r, 'number', 'step="1"')}${field('int', `y_${r}`, r + 1, 'number', 'step="1"')}${field('double', `z_${r}`, r + .5, 'number', 'step="0.1"')}</div>`)).join('') + '</div>';
  }
  dynamicFields.innerHTML = '<h3 class="section-label"><span>01</span><b data-kk="Бастапқы деректер" data-ru="Исходные данные">Бастапқы деректер</b></h3>' + html;
  resultContent.innerHTML = '<p class="result-placeholder" data-kk="Мәндерді енгізіп, есептеуді бастаңыз." data-ru="Введите значения и запустите вычисление.">Мәндерді енгізіп, есептеуді бастаңыз.</p>';
  window.MpiLessonUI?.reset();
}

function value(id) { const raw=document.querySelector(`#${id}`).value;const result=Number(raw);assert(String(raw).trim()!==''&&Number.isFinite(result),'Барлық өріске дұрыс сан енгізіңіз.');return result; }
function setValues(k, prefix = 'set') { return Array.from({ length: k }, (_, r) => nums(document.querySelector(`#${prefix}_${r}`).value)); }
function table(headers, rows) { return `<table class="result-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((v, i) => `<td class="${i === row.length - 1 ? 'result-value' : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }
function assert(condition, message) { if (!condition) throw new Error(message); }
function sameLength(sets, expected) { assert(sets.every(s => s.length === expected && s.every(Number.isFinite)), `Әр процесте дәл ${expected} дұрыс сан болуы керек.`); }

function calculate() {
  const k = clampK();
  let rows = [];
  if([3,16,18].includes(currentTask)) for(let r=currentTask===16?1:0;r<k;r++) {const v=value(`v_${r}`);if(currentTask!==3||r%2===0)assert(Number.isSafeInteger(v),`P${r}: бүтін сан енгізіңіз.`);}
  if([62,64,67,69].includes(currentTask)) for(let r=currentTask===64?0:1;r<k;r++) {assert(Number.isSafeInteger(value(`x_${r}`))&&Number.isSafeInteger(value(`${currentTask===69?'y':'z'}_${r}`)),`P${r}: бүтін өрістерге бүтін сан енгізіңіз.`);}

  if (currentTask === 3) {
    rows = Array.from({ length: k }, (_, r) => [`P${r}`, r % 2 ? 'нақты' : 'бүтін', fmt(value(`v_${r}`) * 2)]);
    return table(['Процесс', 'Тип', 'Екі еселенген мән'], rows);
  }
  if (currentTask === 5) {
    const sets = setValues(k); assert(sets.every(s => s.length>=1 && s.length<=10 && s.every(Number.isFinite)), 'Әр процесс үшін 1–10 дұрыс сан енгізіңіз.');
    rows = sets.map((s, r) => [`P${r}`, r % 2 ? 'Орташа' : 'Қосынды', fmt(r % 2 ? s.reduce((a,b)=>a+b,0)/s.length : s.reduce((a,b)=>a+b,0))]);
    return table(['Процесс', 'Операция', 'Нәтиже'], rows);
  }
  if (currentTask === 10) {
    rows = Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => { const s = nums(document.querySelector(`#set_${r}`).value); assert(s.length >= 1 && s.length <= 4 && s.every(Number.isInteger), `P${r}: 1–4 бүтін сан енгізіңіз.`); return [`P${r}`, s.length, s.join(' ')]; });
    return table(['Жіберуші', 'N', 'Негізгі процесс алған мәндер'], rows);
  }
  if (currentTask === 11) {
    rows = Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => [`P${r}`, fmt(value(`v_${r}`))]);
    return table(['Қабылдаушы', 'Алынған сан'], rows);
  }
  if (currentTask === 16) {
    const positives = Array.from({ length: k - 1 }, (_, i) => value(`v_${i + 1}`)).filter(v => v > 0);
    assert(positives.length>0,'Кемінде бір оң N енгізіңіз.');
    return table(['Оң мәндер саны', 'Негізгі процестегі қосынды'], [[positives.length, fmt(positives.reduce((a,b)=>a+b,0))]]);
  }
  if (currentTask === 18) {
    const sent = Array.from({ length: k }, (_, r) => value(`v_${r}`));
    rows = sent.map((_, r) => [`P${r}`, `P${(r - 1 + k) % k}`, fmt(sent[(r - 1 + k) % k])]);
    return table(['Қабылдаушы', 'Жіберуші', 'Алынған сан'], rows);
  }
  if (currentTask === 21) {
    const a = Array.from({ length: k }, (_, r) => value(`a_${r}`)); const n = Array.from({ length: k }, (_, r) => value(`n_${r}`));
    assert([...n].sort((x,y)=>x-y).every((v,i)=>v===i), 'N мәндері 0…K−1 сандарының қайталанбайтын перестановкасы болуы керек.');
    const rec = Array(k), src = Array(k); n.forEach((dest,r)=>{ rec[dest]=a[r]; src[dest]=r; });
    rows = rec.map((v,r)=>[`P${r}`, `P${src[r]}`, fmt(v)]); return table(['Қабылдаушы', 'Жіберуші', 'A'], rows);
  }
  if (currentTask === 24) {
    assert(k % 2 === 0, 'MPIBegin24 үшін процесс саны жұп болуы керек.'); const sets = setValues(k); assert(sets.every(s=>s.length>=1&&s.length<=4&&s.every(Number.isFinite)), 'Әр процесте 1–4 дұрыс сан болуы керек.');
    rows = sets.map((_,r)=>{ const partner=r%2===0?r+1:r-1; return [`P${r}`, `P${partner}`, sets[partner].map(fmt).join(' ')]; }); return table(['Қабылдаушы','Жұбы','Алынған жиын'],rows);
  }
  if (currentTask === 26) {
    const ranks=Array.from({length:k-1},(_,i)=>i+1); const n=ranks.map(r=>value(`n_${r}`)); assert([...n].sort((a,b)=>a-b).every((v,i)=>v===i+1),'N мәндері 1…K−1 перестановкасы болуы керек.');
    const ordered=Array(k); ranks.forEach(r=>ordered[value(`n_${r}`)]=value(`a_${r}`)); return table(['N','A'],ranks.map(i=>[i,fmt(ordered[i])]));
  }
  if (currentTask === 29) {
    rows=Array.from({length:k-1},(_,i)=>i+1).map(r=>{const t=value(`t_${r}`);const s=nums(document.querySelector(`#set_${r}`).value);assert(s.length>=1&&s.length<=10&&s.every(Number.isFinite),`P${r}: 1–10 дұрыс сан енгізіңіз.`);assert(t===0||t===1,'T = 0 немесе 1.');assert(t===1||s.every(Number.isSafeInteger),`P${r}: T=0 кезінде бүтін сандар керек.`);return [`P${r}`,t===0?'int':'double',s.map(fmt).join(' ')];}); return table(['Жіберуші','Тип','Негізгі процесс алған мәндер'],rows);
  }
  if ([48,51,57].includes(currentTask)) {
    const sets=setValues(k);sameLength(sets,k+5);
    if(currentTask!==51)assert(sets.every(s=>s.every(Number.isSafeInteger)),'Бұл есепте бүтін сандар қажет.');
    if(currentTask===48){const out=sets[0].map((_,i)=>sets.reduce((a,s)=>a+s[i],0));return table(['Нәтиже орны','Қосынды'],out.map((v,i)=>[i,fmt(v)]));}
    if(currentTask===51){const out=sets[0].map((_,i)=>sets.reduce((a,s)=>a*s[i],1));return table(['Процесс','Барлық позициялық көбейтінді'],Array.from({length:k},(_,r)=>[`P${r}`,out.map(fmt).join(' ')]));}
    let prefix=Array(k+5).fill(-Infinity); rows=sets.map((s,r)=>{prefix=prefix.map((v,i)=>Math.max(v,s[i]));return [`P${r}`,prefix.join(' ')];});return table(['Процесс','0…R префикстік максимумдар'],rows);
  }
  if(currentTask===54){const sets=setValues(k);sameLength(sets,2*k);const max=sets[0].map((_,i)=>Math.max(...sets.map(s=>s[i])));return table(['Процесс','Алынған екі максимум'],Array.from({length:k},(_,r)=>[`P${r}`,`${fmt(max[2*r])} ${fmt(max[2*r+1])}`]));}
  if(currentTask===59){rows=Array.from({length:k-1},(_,i)=>i+1).map(r=>{const s=nums(document.querySelector(`#set_${r}`).value);assert(s.length===3&&s.every(Number.isInteger),`P${r} үшін 3 бүтін сан керек.`);return [`P${r}`,s.join(' ')];});return table(['Қабылдаушы','Үштік'],rows);}
  if([62,67].includes(currentTask)){rows=Array.from({length:k-1},(_,i)=>i+1).map(r=>[`P${r}`,`${value(`x_${r}`)} ${fmt(value(`y_${r}`))} ${value(`z_${r}`)}`]);return table(['Қабылдаушы',currentTask===67?'Оралған және ашылған үштік':'Алынған үштік'],rows);}
  if(currentTask===64){const all=Array.from({length:k},(_,r)=>`${value(`x_${r}`)} ${fmt(value(`y_${r}`))} ${value(`z_${r}`)}`).join('  |  ');return table(['Процесс','Ранг ретімен жиналған үштіктер'],Array.from({length:k},(_,r)=>[`P${r}`,all]));}
  if(currentTask===69){rows=Array.from({length:k-1},(_,i)=>i+1).map(r=>[`P${r}`,`${value(`x_${r}`)} ${value(`y_${r}`)} ${fmt(value(`z_${r}`))}`]);return table(['Жіберуші','Негізгі процесс алған үштік'],rows);}
  return '';
}

document.querySelectorAll('.module-tab').forEach(tab => tab.addEventListener('click', () => {
  currentModule = Number(tab.dataset.module);
  document.querySelector('#taskSearch').value = '';
  document.querySelectorAll('.module-tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected',String(t === tab)); });
  selectTask(TASKS[currentModule][0].id);
}));

processCount.addEventListener('change', renderInputs);
document.querySelector('#decreaseProcesses').addEventListener('click', () => { processCount.value = clampK() - 1; renderInputs(); });
document.querySelector('#increaseProcesses').addEventListener('click', () => { processCount.value = clampK() + 1; renderInputs(); });
document.querySelector('#resetExample').addEventListener('click', renderInputs);
form.addEventListener('submit', event => {
  event.preventDefault();
  try { resultContent.innerHTML = calculate(); window.MpiLessonUI?.success(); }
  catch (error) { resultContent.innerHTML = `<div class="result-error"><strong>Тексеру қажет:</strong> ${error.message}</div>`; window.MpiLessonUI?.failure(); }
});
document.querySelector('#copyResult').addEventListener('click', async event => {
  const button = event.currentTarget;
  const text = resultContent.innerText.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Көшірілді';
  } catch {
    const selection = window.getSelection(); const range = document.createRange();
    range.selectNodeContents(resultContent); selection.removeAllRanges(); selection.addRange(range);
    button.textContent = 'Ctrl+C';
  }
  setTimeout(() => button.textContent = 'Көшіру', 1600);
});
document.querySelector('#taskSearch').addEventListener('input', renderTaskList);
taskSelect.addEventListener('change', () => { if (taskSelect.value) selectTask(Number(taskSelect.value)); });

selectTask(3);
