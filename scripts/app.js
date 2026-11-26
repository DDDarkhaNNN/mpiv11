const TASKS = window.MpiLabData.tasks;
const MODULE_ORDER = [1, 2, 3, 4, 5];
const FLAT_TASKS = MODULE_ORDER.flatMap(mod => TASKS[mod].map(t => ({ module: mod, id: t.id, short: t.short })));

let currentModule = 1;
let currentTask = 3;

const taskList = document.querySelector('#taskList');
const taskSelect = document.querySelector('#taskSelect');
const moduleTaskStrip = document.querySelector('#moduleTaskStrip');
const taskTitle = document.querySelector('#taskTitle');
const taskCode = document.querySelector('#taskCode');
const taskPosition = document.querySelector('#taskPosition');
const taskApiBadge = document.querySelector('#taskApiBadge');
const taskDescription = document.querySelector('#taskDescription');
const taskModule = document.querySelector('#taskModule');
const processCount = document.querySelector('#processCount');
const processStrip = document.querySelector('#processStrip');
const dynamicFields = document.querySelector('#dynamicFields');
const form = document.querySelector('#calculatorForm');
const resultContent = document.querySelector('#resultContent');
const prevTaskTop = document.querySelector('#prevTaskTop');
const nextTaskTop = document.querySelector('#nextTaskTop');
const prevTaskBottom = document.querySelector('#prevTaskBottom');
const nextTaskBottom = document.querySelector('#nextTaskBottom');

const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bi = (kk, ru, tag = 'span') => {
  const active = document.documentElement.lang === 'ru' ? ru : kk;
  return `<${tag} data-kk="${escapeHtml(kk)}" data-ru="${escapeHtml(ru)}">${escapeHtml(active)}</${tag}>`;
};

class BiError extends Error {
  constructor(kk, ru) {
    super(kk);
    this.kk = kk;
    this.ru = ru;
  }
}

function fail(kk, ru) {
  throw new BiError(kk, ru);
}

function check(condition, kk, ru) {
  if (!condition) fail(kk, ru);
}

const maxK = () => currentTask === 100 ? 13 : 12;
const clampK = () => {
  const max = maxK();
  if (processCount) processCount.max = String(max);
  return Math.max(2, Math.min(max, Math.trunc(Number(processCount.value)) || 2));
};
const tokensOf = raw => String(raw).trim().split(/[\s,;]+/).filter(Boolean);
const isInt32 = value => Number.isInteger(value) && value >= -2147483648 && value <= 2147483647;

function smallestDivisorAboveOne(k) {
  for (let d = 2; d <= k; d++) if (k % d === 0) return d;
  return k;
}

function parseStrictInt(token, whoKk, whoRu) {
  const s = String(token).trim();
  if (!/^[+-]?\d+$/.test(s)) {
    fail(
      `${whoKk} бүтін сан болуы керек (нүктесіз, мысалы: 2). Енгізілді: "${s}".`,
      `${whoRu} должно быть целым без точки (например, 2). Введено: "${s}".`
    );
  }
  const num = Number(s);
  if (!isInt32(num)) {
    fail(
      `${whoKk} 32-биттік бүтін сан диапазонынан шықты: "${s}".`,
      `${whoRu} выходит за пределы 32-битного целого типа: "${s}".`
    );
  }
  return num;
}

function parseStrictReal(token, whoKk, whoRu) {
  const s = String(token).trim();
  if (!/^[+-]?\d+\.\d+$/.test(s)) {
    fail(
      `${whoKk} нүктесі бар нақты сан болуы керек (мысалы: 2.0). Енгізілді: "${s}".`,
      `${whoRu} должно быть вещественным с точкой (например, 2.0). Введено: "${s}".`
    );
  }
  const num = Number(s);
  if (!Number.isFinite(num)) {
    fail(
      `${whoKk} сандық диапазоннан асты: "${s}".`,
      `${whoRu} выходит за допустимый числовой диапазон: "${s}".`
    );
  }
  return num;
}

function readSingle(id, mode, whoKk, whoRu) {
  const raw = document.getElementById(id)?.value ?? '';
  if (String(raw).trim() === '') {
    fail(
      `${whoKk}: мәнді енгізіңіз.`,
      `${whoRu}: введите значение.`
    );
  }
  return mode === 'int' ? parseStrictInt(raw, whoKk, whoRu) : parseStrictReal(raw, whoKk, whoRu);
}

function readVector(id, rank, minLen, maxLen, mode) {
  const raw = document.getElementById(id)?.value ?? '';
  const parts = tokensOf(raw);
  if (parts.length < minLen || parts.length > maxLen) {
    const expectedKk = minLen === maxLen ? `дәл ${minLen}` : `${minLen}–${maxLen}`;
    const expectedRu = minLen === maxLen ? `ровно ${minLen}` : `от ${minLen} до ${maxLen}`;
    fail(
      `P${rank}: ${expectedKk} сан күтілді, бірақ ${parts.length} енгізілді.`,
      `P${rank}: ожидалось ${expectedRu} чисел, получено ${parts.length}.`
    );
  }
  return parts.map((tok, i) =>
    mode === 'int'
      ? parseStrictInt(tok, `P${rank}, №${i + 1} сан`, `P${rank}: число №${i + 1}`)
      : parseStrictReal(tok, `P${rank}, №${i + 1} сан`, `P${rank}: число №${i + 1}`)
  );
}

const fmt = value => {
  check(
    Number.isFinite(value),
    'Нәтиже сандық диапазоннан асты. Кіші мәндерді енгізіңіз.',
    'Результат вышел за числовой диапазон. Введите меньшие значения.'
  );
  if (Object.is(value, -0) || value === 0) return '0';
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
};

const field = (labelHtml, id, hint, mode = 'int', extraAttrs = '') =>
  `<div class="input-group"><label for="${id}">${labelHtml}</label><input id="${id}" name="${id}" class="num-input" type="text" inputmode="${mode === 'int' ? 'numeric' : 'decimal'}" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(hint)}" value="" ${extraAttrs}></div>`;

const area = (labelHtml, id, values) =>
  `<div class="input-group wide"><label for="${id}">${labelHtml}</label><input id="${id}" name="${id}" class="set-input" type="text" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(values.join(' '))}" value=""></div>`;

const card = (rank, body) =>
  `<div class="rank-row" data-rank="${escapeHtml(rank)}"><span class="rank-tag">${typeof rank === 'number' ? `P${rank}` : escapeHtml(rank)}</span><div class="rank-fields">${body}</div></div>`;

function isTaskDone(id) {
  try {
    const saved = JSON.parse(localStorage.getItem('mpi-completed-v1') || '{}');
    return Boolean(saved && saved[id] === true);
  } catch {
    return false;
  }
}

function renderTaskList() {
  const query = (document.querySelector('#taskSearch')?.value || '').trim().toLowerCase();
  const visibleTasks = TASKS[currentModule].filter(t => `mpibegin${t.id} ${t.short} ${t.description}`.toLowerCase().includes(query));
  taskSelect.innerHTML = visibleTasks.length
    ? visibleTasks.map(t => `<option value="${t.id}">MPIBegin${t.id} — ${t.short}</option>`).join('')
    : '<option value="">Тапсырма табылмады</option>';
  taskSelect.value = String(currentTask);
  if (!visibleTasks.some(t => t.id === currentTask) && visibleTasks.length) {
    taskSelect.insertAdjacentHTML('afterbegin', '<option value="" selected>Тапсырманы таңдаңыз</option>');
  }
  taskList.innerHTML = visibleTasks.map(t => `
    <button class="task-button ${t.id === currentTask ? 'active' : ''}" data-task="${t.id}">
      <span class="task-number">${t.id}</span><span><strong>MPIBegin${t.id}</strong><small>${t.short}</small></span>
    </button>`).join('');
  taskList.querySelectorAll('.task-button').forEach(button => button.addEventListener('click', () => selectTask(Number(button.dataset.task))));
  if (!visibleTasks.length) taskList.innerHTML = '<p class="no-tasks">Бұл модульден тапсырма табылмады.</p>';

  if (moduleTaskStrip) {
    moduleTaskStrip.innerHTML = TASKS[currentModule].map(t => {
      const done = isTaskDone(t.id);
      const match = !query || `mpibegin${t.id} ${t.short} ${t.description}`.toLowerCase().includes(query);
      return `<button type="button" class="task-chip ${t.id === currentTask ? 'active' : ''} ${done ? 'done' : ''} ${!match ? 'dimmed' : ''}" data-task="${t.id}" title="${escapeHtml(`MPIBegin${t.id} — ${t.short}`)}">${done ? '<i class="chip-check" aria-hidden="true">✓</i>' : ''}<span>MPIBegin${t.id}</span></button>`;
    }).join('');
    moduleTaskStrip.querySelectorAll('.task-chip').forEach(chip =>
      chip.addEventListener('click', () => selectTask(Number(chip.dataset.task)))
    );
  }
}

function updateModuleTabsUI() {
  document.querySelectorAll('.module-tab').forEach(t => {
    const active = Number(t.dataset.module) === currentModule;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', String(active));
  });
}

function updateTaskNavButtons() {
  const idx = FLAT_TASKS.findIndex(item => item.id === currentTask);
  const prev = idx > 0 ? FLAT_TASKS[idx - 1] : null;
  const next = idx >= 0 && idx < FLAT_TASKS.length - 1 ? FLAT_TASKS[idx + 1] : null;
  const modTasks = TASKS[currentModule] || [];
  const modIdx = modTasks.findIndex(t => t.id === currentTask);

  if (taskPosition && idx >= 0) {
    const kkPos = `Модульде ${modIdx + 1}/${modTasks.length} · Барлығы ${idx + 1}/${FLAT_TASKS.length}`;
    const ruPos = `В модуле ${modIdx + 1}/${modTasks.length} · Всего ${idx + 1}/${FLAT_TASKS.length}`;
    taskPosition.dataset.kk = kkPos;
    taskPosition.dataset.ru = ruPos;
    taskPosition.textContent = document.documentElement.lang === 'ru' ? ruPos : kkPos;
  }

  if (prevTaskTop) {
    prevTaskTop.disabled = !prev;
    const kk = prev ? `← MPIBegin${prev.id}` : '← Басы';
    const ru = prev ? `← MPIBegin${prev.id}` : '← Начало';
    prevTaskTop.dataset.kk = kk;
    prevTaskTop.dataset.ru = ru;
    prevTaskTop.textContent = document.documentElement.lang === 'ru' ? ru : kk;
    prevTaskTop.title = prev ? `Модуль ${prev.module} · MPIBegin${prev.id}` : '';
  }

  if (nextTaskTop) {
    nextTaskTop.disabled = !next;
    const kk = next ? `Келесі: MPIBegin${next.id} →` : 'Соңғы есеп ✓';
    const ru = next ? `Следующая: MPIBegin${next.id} →` : 'Последняя задача ✓';
    nextTaskTop.dataset.kk = kk;
    nextTaskTop.dataset.ru = ru;
    nextTaskTop.textContent = document.documentElement.lang === 'ru' ? ru : kk;
    nextTaskTop.title = next ? `Модуль ${next.module} · MPIBegin${next.id}` : '';
  }

  if (prevTaskBottom) {
    prevTaskBottom.disabled = !prev;
    const kk = prev
      ? (prev.module !== currentModule ? `← Алдыңғы (Модуль ${prev.module} · MPIBegin${prev.id})` : `← Алдыңғы есеп (MPIBegin${prev.id})`)
      : '← Бірінші есеп';
    const ru = prev
      ? (prev.module !== currentModule ? `← Предыдущая (Модуль ${prev.module} · MPIBegin${prev.id})` : `← Предыдущая задача (MPIBegin${prev.id})`)
      : '← Первая задача';
    prevTaskBottom.dataset.kk = kk;
    prevTaskBottom.dataset.ru = ru;
    prevTaskBottom.textContent = document.documentElement.lang === 'ru' ? ru : kk;
  }

  if (nextTaskBottom) {
    nextTaskBottom.disabled = !next;
    const kk = next
      ? (next.module !== currentModule ? `Келесі модуль (${next.module}) · MPIBegin${next.id} →` : `Келесі есеп: MPIBegin${next.id} →`)
      : 'Барлық 36 есептің соңы ✓';
    const ru = next
      ? (next.module !== currentModule ? `Следующий модуль (${next.module}) · MPIBegin${next.id} →` : `Следующая задача: MPIBegin${next.id} →`)
      : 'Конец всех 36 задач ✓';
    nextTaskBottom.dataset.kk = kk;
    nextTaskBottom.dataset.ru = ru;
    nextTaskBottom.textContent = document.documentElement.lang === 'ru' ? ru : kk;
  }
}

function goAdjacentTask(delta) {
  const idx = FLAT_TASKS.findIndex(item => item.id === currentTask);
  const target = FLAT_TASKS[idx + delta];
  if (!target) return;
  if (target.module !== currentModule) {
    currentModule = target.module;
    const searchEl = document.querySelector('#taskSearch');
    if (searchEl) searchEl.value = '';
    updateModuleTabsUI();
  }
  selectTask(target.id);
}

window.MpiRefreshTaskChips = renderTaskList;
window.MpiNavigateTask = goAdjacentTask;

const MODULE_TITLES = {
  2: ['Хабар алмасу және тегтер', 'Сообщения и теги'],
  3: ['Редукция операциялары және құрама типтер', 'Операции редукции и составные типы'],
  4: ['Ұжымдық жіберу және жаңа коммуникаторлар', 'Коллективная пересылка и коммуникаторы'],
  5: ['Виртуалды топологиялар: декарттық торлар және графтар', 'Виртуальные топологии: декартовы решётки и графы']
};

const TASK_INT_ONLY = new Set([10, 16, 18, 30, 34, 45, 48, 57, 59, 71, 80, 83, 94, 100]);
const TASK_REAL_ONLY = new Set([5, 11, 24, 37, 40, 43, 51, 54, 75, 85, 92, 96]);

function syncTypeBadges(id) {
  const bInt = document.getElementById('badgeInt');
  const bReal = document.getElementById('badgeReal');
  if (!bInt || !bReal) return;
  bInt.hidden = TASK_REAL_ONLY.has(id);
  bReal.hidden = TASK_INT_ONLY.has(id);
}

function syncCopyButton() {
  const btn = document.getElementById('copyResult');
  if (!btn) return;
  const hasResult = Boolean(resultContent?.querySelector('.result-table'));
  btn.disabled = !hasResult;
  btn.classList.toggle('ready', hasResult);
}

function selectTask(id) {
  const ownerMod = MODULE_ORDER.find(mod => TASKS[mod].some(t => t.id === id));
  if (ownerMod && ownerMod !== currentModule) {
    currentModule = ownerMod;
    updateModuleTabsUI();
  }
  currentTask = id;
  if (processCount) processCount.max = String(maxK());
  const task = TASKS[currentModule].find(t => t.id === id);
  taskModule.textContent = `Модуль ${currentModule}`;
  taskTitle.textContent = `MPIBegin${id} — ${task.short}`;
  if (taskCode) taskCode.textContent = `MPIBegin${id}`;
  if (taskApiBadge) {
    const api = window.MpiLessons?.tasks?.[id]?.api || '';
    taskApiBadge.textContent = api;
    taskApiBadge.hidden = !api;
  }
  syncTypeBadges(id);
  taskDescription.textContent = task.description;
  const brief = document.querySelector('#moduleBrief');
  if (currentModule === 1) {
    brief.innerHTML = `<div><span class="brief-kicker" data-kk="МОДУЛЬ 1 · ЖЕРГІЛІКТІ ЕСЕПТЕУ" data-ru="МОДУЛЬ 1 · ЛОКАЛЬНЫЕ ВЫЧИСЛЕНИЯ">${document.documentElement.lang === 'ru' ? 'МОДУЛЬ 1 · ЛОКАЛЬНЫЕ ВЫЧИСЛЕНИЯ' : 'МОДУЛЬ 1 · ЖЕРГІЛІКТІ ЕСЕПТЕУ'}</span>${bi('Ранг пен дерек типін таңдауды үйреніңіз. C++ оқу нұсқалары MPI-сіз жұмыс істейді.', 'Изучите ранги и типы данных. Учебные версии C++ работают без MPI.', 'p')}</div>`;
  } else {
    const title = MODULE_TITLES[currentModule];
    brief.innerHTML = `<div><span class="brief-kicker">МОДУЛЬ ${currentModule} · MPI</span>${bi(title[0], title[1], 'h2')}${bi('Есептер браузерде модельденеді. «C++ коды» бөлімінде дайын MPI бағдарламалары берілген. Нақты сандар нүктемен (2.0), бүтін сандар нүктесіз (2) жазылады.', 'Задачи моделируются в браузере. В разделе «Код C++» приведены готовые программы MPI. Вещественные числа вводятся с точкой (2.0), целые — без точки (2).', 'p')}</div><div class="brief-links"><a href="downloads/module-${currentModule}-variant-11.zip" download data-kk="Модульді жүктеу" data-ru="Скачать модуль">${document.documentElement.lang === 'ru' ? 'Скачать модуль' : 'Модульді жүктеу'}</a><a href="resources.html" data-kk="Іске қосу шарттары" data-ru="Требования для запуска">${document.documentElement.lang === 'ru' ? 'Требования для запуска' : 'Іске қосу шарттары'}</a></div>`;
  }
  const exampleButton = document.querySelector('#resetExample');
  exampleButton.dataset.kk = currentModule === 1 ? 'Мысалмен толтыру' : 'Файлдағы мысалды жүктеу';
  exampleButton.dataset.ru = currentModule === 1 ? 'Заполнить примером' : 'Загрузить пример из файлов';
  exampleButton.textContent = document.documentElement.lang === 'ru' ? exampleButton.dataset.ru : exampleButton.dataset.kk;
  renderTaskList();
  updateTaskNavButtons();
  window.MpiLessonUI?.setCalculateView?.();
  if (window.MpiFileExamples?.[id]) processCount.value = window.MpiFileExamples[id].k;
  renderInputs();
  const exLabelKk = currentModule === 1 ? 'Мысалмен толтыру' : 'Файлдағы мысалды жүктеу';
  const exLabelRu = currentModule === 1 ? 'Заполнить примером' : 'Загрузить пример из файлов';
  resultContent.innerHTML = bi(
    `Мәндерді енгізіп, «Нәтижені есептеу» батырмасын басыңыз (немесе «${exLabelKk}» арқылы тексеріңіз).`,
    `Введите данные и нажмите «Рассчитать результат» (или нажмите «${exLabelRu}»).`,
    'p'
  ).replace('<p ', '<p class="result-placeholder" ');
  syncCopyButton();
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('module', String(currentModule));
    url.searchParams.set('task', String(currentTask));
    window.history.replaceState(null, '', url.pathname + '?' + url.searchParams.toString());
  } catch {}
  const shell = document.querySelector('.calculator-shell');
  shell?.classList.remove('task-enter');
  if (shell) { void shell.offsetWidth; shell.classList.add('task-enter'); }
}

function renderProcessStrip(k) {
  processStrip.innerHTML = Array.from({ length: k }, (_, r) => `<div class="process-chip ${r === 0 ? 'main' : ''}"><b>P${r}</b><span>${r === 0 ? 'main' : `rank ${r}`}</span></div>`).join('');
}

function sampleVector(rank, count, mode = 'int') {
  return Array.from({ length: count }, (_, i) => mode === 'int' ? String(rank * 10 + i + 1) : (rank + 1 + i / 10).toFixed(1));
}

function syncConditionalInputs(k) {
  if (currentTask === 77 || currentTask === 79) {
    for (let r = 0; r < k; r++) {
      const sel = document.getElementById(`n_${r}`);
      const inp = document.getElementById(`a_${r}`);
      if (!sel || !inp) continue;
      const active = sel.value === '1';
      inp.disabled = !active;
      if (!active) {
        inp.value = '';
        inp.placeholder = document.documentElement.lang === 'ru' ? 'При N=0 не вводится' : 'N=0 кезінде енгізілмейді';
      } else {
        inp.placeholder = '1.5';
      }
    }
  } else if (currentTask === 94) {
    const mEl = document.getElementById('m_0'), nEl = document.getElementById('n_0');
    const mRaw = mEl?.value || mEl?.placeholder || '';
    const nRaw = nEl?.value || nEl?.placeholder || '';
    const m = /^[+-]?\d+$/.test(mRaw.trim()) ? Number(mRaw.trim()) : 0;
    const n = /^[+-]?\d+$/.test(nRaw.trim()) ? Number(nRaw.trim()) : 0;
    const limit = m > 0 && n > 0 && m * n <= k ? m * n : k;
    for (let r = 1; r < k; r++) {
      const xi = document.getElementById(`x_${r}`);
      const yi = document.getElementById(`y_${r}`);
      if (!xi || !yi) continue;
      const active = r < limit;
      xi.disabled = !active;
      yi.disabled = !active;
      if (!active) {
        xi.value = '';
        yi.value = '';
        xi.placeholder = 'MPI_COMM_NULL';
        yi.placeholder = 'MPI_COMM_NULL';
      } else {
        xi.placeholder = '0';
        yi.placeholder = '0';
      }
    }
  }
}

function renderInputs() {
  const k = clampK();
  processCount.value = k;
  renderProcessStrip(k);
  let html = '';

  if (currentTask === 3) {
    html = `<p class="form-note">${bi('Жұп рангтар үшін бүтін (мысалы, 4), тақ рангтар үшін нүктесі бар нақты мән (мысалы, 1.5) енгізіңіз.', 'Для чётных рангов введите целое число (например, 4), для нечётных — вещественное с точкой (например, 1.5).')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, field(r % 2 === 0 ? bi('Бүтін n', 'Целое n') : bi('Нақты x (нүктемен)', 'Вещественное x (с точкой)'), `v_${r}`, r % 2 === 0 ? String(10 + r) : (r + 0.5).toFixed(1), r % 2 ? 'real' : 'int'))).join('') + '</div>';
  } else if (currentTask === 5) {
    html = `<p class="form-note">${bi('Әр процесте 1–10 нақты сан (нүктемен, мысалы: 2.0 3.5) енгізіңіз.', 'В каждом процессе введите от 1 до 10 вещественных чисел с точкой (например: 2.0 3.5).')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, area(bi('Нақты сандар жиыны', 'Набор вещественных чисел'), `set_${r}`, sampleVector(r, Math.min(10, r + 3), 'real')))).join('') + '</div>';
  } else if (currentTask === 10) {
    html = '<div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, area(bi('1–4 бүтін сан', '1–4 целых числа'), `set_${r}`, sampleVector(r, (r % 4) + 1, 'int')))).join('') + '</div>';
  } else if (currentTask === 11) {
    html = `<p class="form-note">${bi('Негізгі процесс нақты мәндерді (нүктемен, мысалы 2.0) P1, P2, … ретімен таратады.', 'Главный процесс распределяет вещественные значения (с точкой, например 2.0) в порядке P1, P2, …')}</p><div class="field-grid">` +
      Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(`P0→P${r}`, field(bi('Нақты мән (нүктемен)', 'Вещественное (с точкой)'), `v_${r}`, (r + 0.5).toFixed(1), 'real'))).join('') + '</div>';
  } else if (currentTask === 16) {
    html = `<p class="form-note">${bi('P0-де қанша оң бүтін сан күтілетінін көрсетіңіз. Ол нақты оң N санына тең болуы керек.', 'Укажите в P0 ожидаемое количество положительных целых чисел. Оно должно совпадать с фактическим.')}</p><div class="field-grid">` +
      card(0, field(bi('Күтілетін оң сандар саны', 'Ожидаемое количество положительных чисел'), 'expected_0', String(Math.ceil((k - 1) / 2)), 'int')) +
      Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, field(bi('Бүтін N', 'Целое N'), `v_${r}`, String(r % 2 ? r : -r), 'int'))).join('') + '</div>';
  } else if (currentTask === 18) {
    html = '<div class="field-grid">' + Array.from({ length: k }, (_, r) => card(r, field(bi('Бастапқы бүтін сан', 'Исходное целое число'), `v_${r}`, String((r + 1) * 10), 'int'))).join('') + '</div>';
  } else if (currentTask === 21) {
    html = `<p class="form-note">${bi('A — нүктесі бар нақты сан (2.0), N — 0…K−1 сандарының қайталанбайтын алмастыруы.', 'A — вещественное число с точкой (2.0), N — перестановка чисел 0…K−1.')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, `<div class="field-row">${field(bi('Нақты A', 'Вещественное A'), `a_${r}`, (r + 0.5).toFixed(1), 'real')}${field(bi('Бүтін N (ранг)', 'Целое N (ранг)'), `n_${r}`, String((r + 1) % k), 'int')}</div>`)).join('') + '</div>';
  } else if (currentTask === 24) {
    html = (k % 2 ? `<p class="form-note">${bi('Бұл есепке жұп процесс саны қажет. Процестер санын өзгертіңіз.', 'Для этой задачи требуется чётное количество процессов. Измените K.')}</p>` : '') +
      '<div class="field-grid">' + Array.from({ length: k }, (_, r) => card(r, area(bi('1–4 нақты сан (нүктемен)', '1–4 вещественных числа (с точкой)'), `set_${r}`, sampleVector(r, (r % 4) + 1, 'real')))).join('') + '</div>';
  } else if (currentTask === 26) {
    html = `<p class="form-note">${bi('A — нүктесі бар нақты сан, N — 1…K−1 сандарының қайталанбайтын алмастыруы.', 'A — вещественное число с точкой, N — перестановка чисел 1…K−1.')}</p><div class="field-grid">` +
      Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, `<div class="field-row">${field(bi('Нақты A', 'Вещественное A'), `a_${r}`, (r * 1.25).toFixed(2).replace(/0$/, ''), 'real')}${field(bi('Бүтін N (нөмір)', 'Целое N (номер)'), `n_${r}`, String(k - r), 'int')}</div>`)).join('') + '</div>';
  } else if (currentTask === 29) {
    html = `<p class="form-note">${bi('T=0 кезінде бүтін сандар (2), T=1 кезінде нүктесі бар нақты сандар (2.0) енгізіледі (0–10 сан).', 'При T=0 вводятся целые числа (2), при T=1 — вещественные с точкой (2.0), от 0 до 10 чисел.')}</p><div class="field-grid">` +
      Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, `<div class="field-row"><div class="input-group"><label for="t_${r}">${bi('T — дерек типі', 'T — тип данных')}</label><select id="t_${r}" name="t_${r}"><option value="0" ${r % 2 === 0 ? 'selected' : ''} data-kk="0 — бүтін" data-ru="0 — целые">${document.documentElement.lang === 'ru' ? '0 — целые' : '0 — бүтін'}</option><option value="1" ${r % 2 ? 'selected' : ''} data-kk="1 — нақты" data-ru="1 — вещественные">${document.documentElement.lang === 'ru' ? '1 — вещественные' : '1 — нақты'}</option></select></div></div>${area(bi('Сандар (0–10)', 'Числа (0–10)'), `set_${r}`, sampleVector(r, 2 + r % 2, r % 2 ? 'real' : 'int'))}`)).join('') + '</div>';
  } else if (currentTask === 30) {
    html = `<p class="form-note">${bi('P0-де бір бүтін сан енгізіңіз — MPI_Bcast оны P1…P(K−1) процестеріне таратады.', 'Введите одно целое число в P0 — MPI_Bcast разошлёт его процессам P1…P(K−1).')}</p><div class="field-grid">` +
      card(0, field(bi('Бүтін сан', 'Целое число'), 'v_0', '7', 'int')) + '</div>';
  } else if (currentTask === 34) {
    html = `<p class="form-note">${bi('Әр R процесінде дәл R+2 бүтін сан енгізіңіз.', 'В каждом процессе ранга R введите ровно R+2 целых числа.')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, area(bi(`${r + 2} бүтін сан`, `${r + 2} целых чисел`), `set_${r}`, sampleVector(r, r + 2, 'int')))).join('') + '</div>';
  } else if (currentTask === 37) {
    html = `<p class="form-note">${bi(`P0-де дәл ${k} нақты сан (нүктемен) енгізіңіз: 1-шісі P${k - 1}-ге, …, соңғысы P0-ге барады.`, `Введите в P0 ровно ${k} вещественных чисел с точкой: 1-е пойдёт в P${k - 1}, …, последнее — в P0.`)}</p><div class="field-grid">` +
      card(0, area(bi(`${k} нақты сан`, `${k} вещественных чисел`), 'set_0', Array.from({ length: k }, (_, i) => ((i + 1) * 10).toFixed(1)))) + '</div>';
  } else if (currentTask === 40) {
    html = `<p class="form-note">${bi('Әр процесте бір нақты сан (нүктемен, мысалы 1.0) енгізіңіз.', 'В каждом процессе введите одно вещественное число с точкой (например, 1.0).')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, field(bi('Нақты сан', 'Вещественное число'), `v_${r}`, (r + 1).toFixed(1), 'real'))).join('') + '</div>';
  } else if (currentTask === 43) {
    html = `<p class="form-note">${bi(`Әр процесте дәл ${k} нақты сан (нүктемен) енгізіңіз — әр рангқа бір-бірден.`, `В каждом процессе введите ровно ${k} вещественных чисел с точкой — по одному для каждого ранга.`)}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, area(bi(`${k} нақты сан`, `${k} вещественных чисел`), `set_${r}`, Array.from({ length: k }, (_, i) => (r * k + i + 1).toFixed(1))))).join('') + '</div>';
  } else if (currentTask === 45) {
    const count = (k * (k + 1)) / 2;
    html = `<p class="form-note">${bi(`Әр процесте дәл ${count} бүтін сан енгізіңіз (блок ұзындықтары: 1, 2, …, ${k}).`, `В каждом процессе введите ровно ${count} целых чисел (блоки длиной 1, 2, …, ${k}).`)}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, area(bi(`${count} бүтін сан`, `${count} целых чисел`), `set_${r}`, Array.from({ length: count }, (_, i) => String((i + 1) * (r === 0 ? 1 : r === 1 ? 10 : (r + 1) * 10)))))).join('') + '</div>';
  } else if ([48, 51, 57].includes(currentTask)) {
    const count = k + 5;
    const isReal = currentTask === 51;
    html = `<p class="form-note">${bi(`Әр процесте дәл ${count} ${isReal ? 'нақты (нүктемен)' : 'бүтін'} сан болуы керек.`, `В каждом процессе должно быть ровно ${count} ${isReal ? 'вещественных (с точкой)' : 'целых'} чисел.`)}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, area(bi(`${count} ${isReal ? 'нақты сан' : 'бүтін сан'}`, `${count} ${isReal ? 'вещественных чисел' : 'целых чисел'}`), `set_${r}`, sampleVector(r, count, isReal ? 'real' : 'int')))).join('') + '</div>';
  } else if (currentTask === 54) {
    const count = 2 * k;
    html = `<p class="form-note">${bi(`Әр процесте дәл ${count} нақты сан (нүктемен) болуы керек.`, `В каждом процессе должно быть ровно ${count} вещественных чисел (с точкой).`)}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, area(bi(`${count} нақты сан`, `${count} вещественных чисел`), `set_${r}`, sampleVector(r, count, 'real')))).join('') + '</div>';
  } else if (currentTask === 59) {
    html = '<div class="field-grid">' + Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(`P0→P${r}`, area(bi('3 бүтін сан', '3 целых числа'), `set_${r}`, [String(r), String(r + 1), String(r + 2)]))).join('') + '</div>';
  } else if ([62, 67].includes(currentTask)) {
    html = `<p class="form-note">${bi('Әр үштікте 1-ші және 3-ші сан бүтін (2), ал 2-ші сан нүктесі бар нақты (2.0) болуы керек.', 'В каждой тройке 1-е и 3-е числа — целые (2), 2-е — вещественное с точкой (2.0).')}</p><div class="field-grid">` +
      Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(`P0→P${r}`, `<div class="field-row">${field('int', `x_${r}`, String(r), 'int')}${field('double', `y_${r}`, (r + 0.5).toFixed(1), 'real')}${field('int', `z_${r}`, String(r + 1), 'int')}</div>`)).join('') + '</div>';
  } else if (currentTask === 64) {
    html = `<p class="form-note">${bi('Әр процесте 1-ші және 3-ші сан бүтін (2), 2-ші сан нүктесі бар нақты (2.0) болуы керек.', 'В каждом процессе 1-е и 3-е числа — целые (2), 2-е — вещественное с точкой (2.0).')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, `<div class="field-row">${field('int', `x_${r}`, String(r), 'int')}${field('double', `y_${r}`, (r + 0.5).toFixed(1), 'real')}${field('int', `z_${r}`, String(r + 1), 'int')}</div>`)).join('') + '</div>';
  } else if (currentTask === 69) {
    html = `<p class="form-note">${bi('Әр бағынышты процесте алғашқы 2 сан бүтін (2), 3-ші сан нүктесі бар нақты (2.0) болуы керек.', 'В каждом подчинённом процессе первые 2 числа — целые (2), 3-е — вещественное с точкой (2.0).')}</p><div class="field-grid">` +
      Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, `<div class="field-row">${field('int', `x_${r}`, String(r), 'int')}${field('int', `y_${r}`, String(r + 1), 'int')}${field('double', `z_${r}`, (r + 0.5).toFixed(1), 'real')}</div>`)).join('') + '</div>';
  } else if (currentTask === 71) {
    const evenCount = Math.floor((k + 1) / 2);
    const evenLabels = Array.from({ length: evenCount }, (_, i) => `P${2 * i}`).join(', ');
    html = `<p class="form-note">${bi(`P0-де жұп рангтарға (${evenLabels}) арналған дәл ${evenCount} бүтін сан енгізіңіз.`, `Введите в P0 ровно ${evenCount} целых чисел для чётных рангов (${evenLabels}).`)}</p><div class="field-grid">` +
      card(0, area(bi(`${evenCount} бүтін сан`, `${evenCount} целых чисел`), 'set_0', Array.from({ length: evenCount }, (_, i) => String(7 + i)))) + '</div>';
  } else if (currentTask === 75) {
    html = `<p class="form-note">${bi('Әр процесте бір нақты сан (нүктемен) енгізіңіз: P0 жұп рангтар максимумын, P1 тақ рангтар минимумын шығарады.', 'В каждом процессе введите вещественное число с точкой: P0 выведет максимум чётных рангов, P1 — минимум нечётных.')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, field(bi('Нақты сан', 'Вещественное число'), `v_${r}`, (r + 1.5).toFixed(1), 'real'))).join('') + '</div>';
  } else if (currentTask === 77 || currentTask === 79) {
    html = `<p class="form-note">${bi('Кемінде бір процесте N=1 болуы керек. N=1 процестері үшін нүктесі бар нақты A (мысалы, 1.5) енгізіңіз.', 'Хотя бы в одном процессе должно быть N=1. Для процессов с N=1 введите вещественное A с точкой (например, 1.5).')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => {
        const defaultOne = r % 2 === 1;
        return card(r, `<div class="field-row"><div class="input-group"><label for="n_${r}">N (0 / 1)</label><select id="n_${r}" name="n_${r}" data-toggle-a="${r}"><option value="0" ${!defaultOne ? 'selected' : ''} data-kk="0 — топқа кірмейді" data-ru="0 — вне группы">${document.documentElement.lang === 'ru' ? '0 — вне группы' : '0 — топқа кірмейді'}</option><option value="1" ${defaultOne ? 'selected' : ''} data-kk="1 — топта (A бар)" data-ru="1 — в группе (есть A)">${document.documentElement.lang === 'ru' ? '1 — в группе (есть A)' : '1 — топта (A бар)'}</option></select></div>${field(bi('Нақты A', 'Вещественное A'), `a_${r}`, defaultOne ? (r + 0.5).toFixed(1) : '', 'real')}</div>`);
      }).join('') + '</div>';
  } else if (currentTask === 80) {
    html = `<p class="form-note">${bi('N=1 және N=2 мәндерінің әрқайсысы кемінде бір процесте болуы керек; A — бүтін сан (нүктесіз).', 'Должны быть процессы и с N=1, и с N=2; A — целое число без точки.')}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => {
        const grp = (r % 2) + 1;
        return card(r, `<div class="field-row"><div class="input-group"><label for="n_${r}">N (1 / 2)</label><select id="n_${r}" name="n_${r}"><option value="1" ${grp === 1 ? 'selected' : ''} data-kk="1 — 1-топ" data-ru="1 — группа 1">${document.documentElement.lang === 'ru' ? '1 — группа 1' : '1 — 1-топ'}</option><option value="2" ${grp === 2 ? 'selected' : ''} data-kk="2 — 2-топ" data-ru="2 — группа 2">${document.documentElement.lang === 'ru' ? '2 — группа 2' : '2 — 2-топ'}</option></select></div>${field(bi('Бүтін A', 'Целое A'), `a_${r}`, String((r + 1) * 10), 'int')}</div>`);
      }).join('') + '</div>';
  } else if (currentTask === 83) {
    const defN = smallestDivisorAboveOne(k);
    html = `<p class="form-note">${bi(`P0-де N > 1 бүтін санын енгізіңіз, мұндағы K=${k} саны N-ге қалдықсыз бөлінуі керек.`, `Введите в P0 целое N > 1, делящее K=${k} без остатка.`)}</p><div class="field-grid">` +
      card(0, field(bi(`Бүтін N (K=${k} бөлгіші)`, `Целое N (делитель K=${k})`), 'n_0', String(defN), 'int')) + '</div>';
  } else if (currentTask === 85) {
    const half = Math.floor(k / 2);
    const bad = k < 4 || k % 2 !== 0;
    html = (bad
      ? `<p class="form-note">${bi('MPIBegin85 үшін K жұп және K ≥ 4 болуы керек (4, 6, 8, 10, 12).', 'Для MPIBegin85 число процессов K должно быть чётным и не меньше 4 (4, 6, 8, 10, 12).')}</p>`
      : `<p class="form-note">${bi(`2 × ${half} торы екі жолға бөлінеді: P0 (0-жол) және P${half} (1-жол) нақты A (нүктемен) енгізеді.`, `Решётка 2 × ${half} делится на две строки: P0 (строка 0) и P${half} (строка 1) вводят вещественное A с точкой.`)}</p>`) +
      '<div class="field-grid">' +
      card(0, field(bi('0-жол үшін нақты A', 'Вещественное A для строки 0'), 'v_0', '1.5', 'real')) +
      card(half, field(bi('1-жол үшін нақты A', 'Вещественное A для строки 1'), `v_${half}`, '-2.0', 'real')) + '</div>';
  } else if (currentTask === 92) {
    const bad = k !== 8 && k !== 12;
    html = `<p class="form-note">${bad
      ? bi('MPIBegin92 үшін процестер саны K = 8 немесе 12 болуы керек. K мәнін өзгертіңіз.', 'Для MPIBegin92 количество процессов K должно быть равно 8 или 12. Измените K.')
      : bi(`2 × 2 × ${k / 4} үшөлшемді торы ${k / 4} матрицаға (2×2) бөлінеді. Әр процесте бір нақты сан (нүктемен) енгізіңіз.`, `Трёхмерная решётка 2 × 2 × ${k / 4} делится на ${k / 4} матриц 2×2. Введите по одному вещественному числу с точкой.`)}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, field(bi('Нақты сан', 'Вещественное число'), `v_${r}`, (r + 1).toFixed(1), 'real'))).join('') + '</div>';
  } else if (currentTask === 94) {
    const defM = Math.min(2, k), defN = Math.max(1, Math.min(2, Math.floor(k / defM)));
    html = `<p class="form-note">${bi('P0-де оң бүтін M, N (M·N ≤ K) және P0…P(M·N−1) процестерінде бүтін X, Y координаттарын енгізіңіз (2-өлшем периодты).', 'Введите в P0 положительные целые M, N (M·N ≤ K), а в процессах P0…P(M·N−1) — целые координаты X, Y (2-е измерение периодическое).')}</p><div class="field-grid">` +
      card(0, `<div class="field-row">${field(bi('Бүтін M (жолдар)', 'Целое M (строк)'), 'm_0', String(defM), 'int', 'data-grid-dim="1"')}${field(bi('Бүтін N (бағандар)', 'Целое N (столбцов)'), 'n_0', String(defN), 'int', 'data-grid-dim="1"')}${field('X', 'x_0', '0', 'int')}${field('Y', 'y_0', '-1', 'int')}</div>`) +
      Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => card(r, `<div class="field-row">${field('X', `x_${r}`, String(r % defM), 'int')}${field('Y', `y_${r}`, String(r), 'int')}</div>`)).join('') + '</div>';
  } else if (currentTask === 96) {
    const bad = k < 4 || k % 2 !== 0;
    html = `<p class="form-note">${bad
      ? bi('MPIBegin96 үшін K жұп және K ≥ 4 болуы керек (4, 6, 8, 10, 12).', 'Для MPIBegin96 число процессов K должно быть чётным и не меньше 4 (4, 6, 8, 10, 12).')
      : bi(`2 × ${k / 2} матрицасының әр жолында нақты A мәндері (нүктемен) +1 қадамға циклдік жылжиды.`, `В каждой строке матрицы 2 × ${k / 2} вещественные числа A (с точкой) циклически сдвигаются на +1.`)}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, field(bi('Нақты A', 'Вещественное A'), `v_${r}`, (r + 1).toFixed(1), 'real'))).join('') + '</div>';
  } else if (currentTask === 100) {
    const bad = ![7, 10, 13].includes(k);
    html = `<p class="form-note">${bad
      ? bi('MPIBegin100 үшін K = 7, 10 немесе 13 болуы керек (K = 3N + 1, 1 < N < 5). K мәнін өзгертіңіз.', 'Для MPIBegin100 число процессов K должно быть равно 7, 10 или 13 (K = 3N + 1, 1 < N < 5). Измените K.')
      : bi(`Центрі P0 болатын ${(k - 1) / 3} үшбұрышты сәулелі граф. Әр процесте бүтін A санын енгізіңіз.`, `Граф из ${(k - 1) / 3} треугольных лучей с центром P0. В каждом процессе введите целое A.`)}</p><div class="field-grid">` +
      Array.from({ length: k }, (_, r) => card(r, field(bi('Бүтін A', 'Целое A'), `v_${r}`, String(r * 10), 'int'))).join('') + '</div>';
  }

  dynamicFields.innerHTML = html;
  dynamicFields.querySelectorAll('select').forEach(select => {
    select.insertAdjacentHTML('afterbegin', `<option value="" selected disabled data-kk="Таңдаңыз" data-ru="Выберите">${document.documentElement.lang === 'ru' ? 'Выберите' : 'Таңдаңыз'}</option>`);
    select.value = '';
  });
  dynamicFields.querySelectorAll('select[data-toggle-a], input[data-grid-dim]').forEach(el => el.addEventListener('input', () => syncConditionalInputs(k)));
  dynamicFields.querySelectorAll('select[data-toggle-a]').forEach(el => el.addEventListener('change', () => syncConditionalInputs(k)));
  syncConditionalInputs(k);
  resultContent.innerHTML = bi('Мәндерді енгізіп, есептеуді бастаңыз.', 'Введите значения и запустите вычисление.', 'p').replace('<p ', '<p class="result-placeholder" ');
  syncCopyButton();
  window.MpiLessonUI?.reset();
}

function table(headers, rows) {
  return `<table class="result-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((v, i) => `<td class="${i === row.length - 1 ? 'result-value' : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function readMixedTriple(rank, realPos, prefixLabelKk = `P${rank}`, prefixLabelRu = `P${rank}`) {
  const fields = ['x', 'y', 'z'];
  return fields.map((name, idx) => {
    const mode = idx === realPos ? 'real' : 'int';
    const whoKk = `${prefixLabelKk}, №${idx + 1} сан`;
    const whoRu = `${prefixLabelRu}, число №${idx + 1}`;
    return readSingle(`${name}_${rank}`, mode, whoKk, whoRu);
  });
}

function fillFileExample() {
  const example = window.MpiFileExamples?.[currentTask];
  if (!example || currentModule === 1) return;
  for (const [id, val] of Object.entries(example.values)) {
    const input = document.getElementById(id);
    if (input) input.value = val;
  }
  syncConditionalInputs(clampK());
}

function loadFileExample() {
  const example = window.MpiFileExamples?.[currentTask];
  if (!example || currentModule === 1) {
    renderInputs();
    dynamicFields.querySelectorAll('input,textarea,select').forEach(el => {
      if (!el.disabled && !el.value && el.placeholder) el.value = el.placeholder;
    });
    return;
  }
  processCount.value = example.k;
  renderInputs();
  fillFileExample();
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randReal(min = -9, max = 12) {
  const quarters = ['.0', '.5', '.25', '.75'];
  const base = randInt(min, max);
  const frac = quarters[randInt(0, quarters.length - 1)];
  if (base === 0 && Math.random() < 0.35) return '-0.5';
  return `${base}${frac}`;
}

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = String(val);
}

function generateRandomInputs() {
  let k = clampK();
  if (currentTask === 24 && k % 2 !== 0) k = k < 12 ? k + 1 : 12;
  else if ((currentTask === 85 || currentTask === 96) && (k < 4 || k % 2 !== 0)) k = k < 4 ? 4 : (k % 2 ? k + 1 : k);
  else if (currentTask === 92 && k !== 8 && k !== 12) k = 8;
  else if (currentTask === 100 && ![7, 10, 13].includes(k)) k = 7;
  else if (currentTask === 83 && k < 2) k = 6;
  processCount.value = k;
  renderInputs();

  const id = currentTask;
  if (id === 3) {
    for (let r = 0; r < k; r++) setVal(`v_${r}`, r % 2 === 0 ? randInt(-15, 25) : randReal(-8, 12));
  } else if (id === 5) {
    for (let r = 0; r < k; r++) setVal(`set_${r}`, Array.from({ length: randInt(2, 5) }, () => randReal(-6, 10)).join(' '));
  } else if (id === 10) {
    for (let r = 1; r < k; r++) setVal(`set_${r}`, Array.from({ length: randInt(1, 4) }, () => randInt(-9, 20)).join(' '));
  } else if (id === 11) {
    for (let r = 1; r < k; r++) setVal(`v_${r}`, randReal(-9, 15));
  } else if (id === 16) {
    const workers = Array.from({ length: k - 1 }, (_, i) => i + 1);
    const posCount = randInt(1, k - 1);
    const posRanks = new Set(shuffled(workers).slice(0, posCount));
    setVal('expected_0', posCount);
    for (const r of workers) setVal(`v_${r}`, posRanks.has(r) ? randInt(1, 25) : randInt(-15, 0));
  } else if (id === 18) {
    for (let r = 0; r < k; r++) setVal(`v_${r}`, randInt(-20, 40));
  } else if (id === 21) {
    const perm = shuffled(Array.from({ length: k }, (_, r) => r));
    for (let r = 0; r < k; r++) {
      setVal(`a_${r}`, randReal(-9, 15));
      setVal(`n_${r}`, perm[r]);
    }
  } else if (id === 24) {
    for (let r = 0; r < k; r++) setVal(`set_${r}`, Array.from({ length: randInt(1, 4) }, () => randReal(-8, 12)).join(' '));
  } else if (id === 26) {
    const perm = shuffled(Array.from({ length: k - 1 }, (_, i) => i + 1));
    for (let r = 1; r < k; r++) {
      setVal(`a_${r}`, randReal(-9, 15));
      setVal(`n_${r}`, perm[r - 1]);
    }
  } else if (id === 29) {
    for (let r = 1; r < k; r++) {
      const t = randInt(0, 1);
      const len = randInt(1, 4);
      setVal(`t_${r}`, t);
      setVal(`set_${r}`, Array.from({ length: len }, () => t === 0 ? randInt(-12, 20) : randReal(-8, 12)).join(' '));
    }
  } else if (id === 30) {
    setVal('v_0', randInt(-30, 50));
  } else if (id === 34) {
    for (let r = 0; r < k; r++) setVal(`set_${r}`, Array.from({ length: r + 2 }, () => randInt(-9, 25)).join(' '));
  } else if (id === 37) {
    setVal('set_0', Array.from({ length: k }, () => randReal(-10, 20)).join(' '));
  } else if (id === 40 || id === 75 || id === 92 || id === 96) {
    for (let r = 0; r < k; r++) setVal(`v_${r}`, randReal(-9, 15));
  } else if (id === 43) {
    for (let r = 0; r < k; r++) setVal(`set_${r}`, Array.from({ length: k }, () => randReal(-8, 15)).join(' '));
  } else if (id === 45) {
    const total = (k * (k + 1)) / 2;
    for (let r = 0; r < k; r++) setVal(`set_${r}`, Array.from({ length: total }, () => randInt(-9, 30)).join(' '));
  } else if (id === 48 || id === 57) {
    const count = k + 5;
    for (let r = 0; r < k; r++) setVal(`set_${r}`, Array.from({ length: count }, () => randInt(-10, 20)).join(' '));
  } else if (id === 51) {
    const count = k + 5;
    const smallReals = ['-2.0', '-1.5', '-1.0', '-0.5', '0.5', '1.0', '1.5', '2.0', '2.5'];
    for (let r = 0; r < k; r++) setVal(`set_${r}`, Array.from({ length: count }, () => smallReals[randInt(0, smallReals.length - 1)]).join(' '));
  } else if (id === 54) {
    const count = 2 * k;
    for (let r = 0; r < k; r++) setVal(`set_${r}`, Array.from({ length: count }, () => randReal(-8, 12)).join(' '));
  } else if (id === 59) {
    for (let r = 1; r < k; r++) setVal(`set_${r}`, [randInt(-12, 15), randInt(-12, 15), randInt(-12, 15)].join(' '));
  } else if (id === 62 || id === 67) {
    for (let r = 1; r < k; r++) {
      setVal(`x_${r}`, randInt(-12, 15));
      setVal(`y_${r}`, randReal(-8, 12));
      setVal(`z_${r}`, randInt(-12, 15));
    }
  } else if (id === 64) {
    for (let r = 0; r < k; r++) {
      setVal(`x_${r}`, randInt(-12, 15));
      setVal(`y_${r}`, randReal(-8, 12));
      setVal(`z_${r}`, randInt(-12, 15));
    }
  } else if (id === 69) {
    for (let r = 1; r < k; r++) {
      setVal(`x_${r}`, randInt(-12, 15));
      setVal(`y_${r}`, randInt(-12, 15));
      setVal(`z_${r}`, randReal(-8, 12));
    }
  } else if (id === 71) {
    const evenCount = Math.floor((k + 1) / 2);
    setVal('set_0', Array.from({ length: evenCount }, () => randInt(-15, 35)).join(' '));
  } else if (id === 77 || id === 79) {
    const flags = Array.from({ length: k }, () => randInt(0, 1));
    if (!flags.includes(1)) flags[randInt(0, k - 1)] = 1;
    for (let r = 0; r < k; r++) setVal(`n_${r}`, flags[r]);
    syncConditionalInputs(k);
    for (let r = 0; r < k; r++) if (flags[r] === 1) setVal(`a_${r}`, randReal(-9, 15));
  } else if (id === 80) {
    const groups = Array.from({ length: k }, () => randInt(1, 2));
    if (!groups.includes(1)) groups[0] = 1;
    if (!groups.includes(2)) groups[k - 1] = 2;
    for (let r = 0; r < k; r++) {
      setVal(`n_${r}`, groups[r]);
      setVal(`a_${r}`, randInt(-20, 50));
    }
  } else if (id === 83) {
    const divs = [];
    for (let d = 2; d <= k; d++) if (k % d === 0) divs.push(d);
    setVal('n_0', divs[randInt(0, divs.length - 1)]);
  } else if (id === 85) {
    setVal('v_0', randReal(-9, 15));
    setVal(`v_${k / 2}`, randReal(-9, 15));
  } else if (id === 94) {
    const pairs = [];
    for (let m = 1; m <= k; m++) for (let n = 1; m * n <= k; n++) if (m * n >= 2) pairs.push([m, n]);
    const [m, n] = pairs[randInt(0, pairs.length - 1)];
    setVal('m_0', m);
    setVal('n_0', n);
    syncConditionalInputs(k);
    for (let r = 0; r < m * n; r++) {
      const validX = Math.random() < 0.78;
      setVal(`x_${r}`, validX ? randInt(0, m - 1) : (Math.random() < 0.5 ? -1 : m));
      setVal(`y_${r}`, randInt(-n - 1, 2 * n));
    }
  } else if (id === 100) {
    for (let r = 0; r < k; r++) setVal(`v_${r}`, randInt(-20, 60));
  }

  syncConditionalInputs(k);
  runCalculationNow();
}

function runCalculationNow() {
  dynamicFields.querySelectorAll('.rank-row.input-error').forEach(row => row.classList.remove('input-error'));
  try {
    resultContent.innerHTML = calculate();
    syncCopyButton();
    window.MpiLessonUI?.success();
    return true;
  } catch (error) {
    const body = error instanceof BiError
      ? bi(error.kk, error.ru)
      : escapeHtml(error.message);
    resultContent.innerHTML = `<div class="result-error">${bi('Тексеру қажет:', 'Ошибка ввода:', 'strong')} ${body}</div>`;
    syncCopyButton();
    const rank = String(error.kk || error.message).match(/P(\d+)/)?.[1];
    const row = rank == null ? null : dynamicFields.querySelector(`.rank-row[data-rank="${rank}"]`);
    row?.classList.add('input-error');
    (row?.querySelector('input:not(:disabled),select:not(:disabled)') || dynamicFields.querySelector('input:not(:disabled):placeholder-shown,select:invalid'))?.focus();
    window.MpiLessonUI?.failure();
    return false;
  }
}

function exportPdfReport() {
  if (!resultContent.querySelector('.result-table')) {
    const hasAnyInput = Array.from(dynamicFields.querySelectorAll('input,select')).some(el => !el.disabled && String(el.value).trim() !== '');
    if (!hasAnyInput) loadFileExample();
    if (!runCalculationNow()) return;
  }
  const container = document.getElementById('printReportContainer');
  if (!container) return;
  const ru = document.documentElement.lang === 'ru';
  const k = clampK();
  const task = TASKS[currentModule].find(t => t.id === currentTask);
  const lesson = window.MpiLessons?.tasks?.[currentTask];
  const dateStr = new Date().toLocaleDateString(ru ? 'ru-RU' : 'kk-KZ');

  const inputRows = Array.from(dynamicFields.querySelectorAll('.rank-row')).map(row => {
    const tag = row.querySelector('.rank-tag')?.textContent?.trim() || '';
    const items = Array.from(row.querySelectorAll('.input-group')).map(grp => {
      const lbl = grp.querySelector('label')?.textContent?.trim() || '';
      const ctrl = grp.querySelector('input,select,textarea');
      if (!ctrl) return '';
      if (ctrl.disabled) return `${escapeHtml(lbl)}: <em>${escapeHtml(ctrl.placeholder || '—')}</em>`;
      const val = ctrl.tagName === 'SELECT'
        ? (ctrl.options[ctrl.selectedIndex]?.textContent?.trim() || ctrl.value)
        : ctrl.value;
      return `${escapeHtml(lbl)}: <code>${escapeHtml(val)}</code>`;
    }).filter(Boolean).join(' &nbsp;·&nbsp; ');
    return `<tr><td class="rep-rank">${escapeHtml(tag)}</td><td>${items}</td></tr>`;
  }).join('');

  const codeText = escapeHtml(window.MpiSourceCode?.[currentTask] || '');
  const givenText = lesson ? escapeHtml(lesson.given[ru ? 1 : 0]) : '';
  const findText = lesson ? escapeHtml(lesson.find[ru ? 1 : 0]) : '';
  const apiText = lesson ? escapeHtml(lesson.api) : '';

  container.innerHTML = `
    <div class="print-report">
      <header class="rep-header">
        <div>
          <div class="rep-kicker">MPI Lab · ${ru ? 'Вариант 11' : '11-нұсқа'} · Модуль ${currentModule}</div>
          <h1>MPIBegin${currentTask} — ${escapeHtml(task?.short || '')}</h1>
        </div>
        <div class="rep-meta">
          <div><b>${ru ? 'Процессов (K):' : 'Процестер (K):'}</b> ${k}</div>
          <div><b>MPI API:</b> ${apiText}</div>
          <div><b>${ru ? 'Дата:' : 'Күні:'}</b> ${escapeHtml(dateStr)}</div>
        </div>
      </header>
      <section class="rep-section">
        <h2>1. ${ru ? 'Условие задачи' : 'Есептің шарты'}</h2>
        <p><b>${ru ? 'Дано:' : 'Берілгені:'}</b> ${givenText}</p>
        <p><b>${ru ? 'Требуется:' : 'Орындау керек:'}</b> ${findText}</p>
      </section>
      <section class="rep-section">
        <h2>2. ${ru ? 'Входные данные' : 'Кіріс деректері'} (K = ${k})</h2>
        <table class="rep-table"><thead><tr><th>${ru ? 'Процесс' : 'Процесс'}</th><th>${ru ? 'Значения' : 'Енгізілген мәндер'}</th></tr></thead><tbody>${inputRows}</tbody></table>
      </section>
      <section class="rep-section">
        <h2>3. ${ru ? 'Результат вычисления' : 'Есептеу нәтижесі'}</h2>
        <div class="rep-result">${resultContent.innerHTML}</div>
      </section>
      <section class="rep-section rep-code-section">
        <h2>4. ${ru ? 'Исходный код C++ (MPI)' : 'Бастапқы C++ коды (MPI)'} — MPIBegin${currentTask}.cpp</h2>
        <pre class="rep-code"><code>${codeText}</code></pre>
      </section>
    </div>`;

  window.print();
}

function calculate() {
  const k = clampK();

  if (currentTask === 3) {
    const rows = Array.from({ length: k }, (_, r) => {
      const v = readSingle(`v_${r}`, r % 2 ? 'real' : 'int', `P${r}`, `P${r}`);
      return [`P${r}`, r % 2 ? bi('нақты', 'вещественное') : bi('бүтін', 'целое'), escapeHtml(fmt(v * 2))];
    });
    return table([bi('Процесс', 'Процесс'), bi('Тип', 'Тип'), bi('Екі еселенген мән', 'Удвоенное значение')], rows);
  }
  if (currentTask === 5) {
    const sets = Array.from({ length: k }, (_, r) => readVector(`set_${r}`, r, 1, 10, 'real'));
    const rows = sets.map((s, r) => [
      `P${r}`,
      r % 2 ? bi('Орташа', 'Среднее') : bi('Қосынды', 'Сумма'),
      escapeHtml(fmt(r % 2 ? s.reduce((a, b) => a + b, 0) / s.length : s.reduce((a, b) => a + b, 0)))
    ]);
    return table([bi('Процесс', 'Процесс'), bi('Операция', 'Операция'), bi('Нәтиже', 'Результат')], rows);
  }
  if (currentTask === 10) {
    const all = [];
    const rows = Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => {
      const s = readVector(`set_${r}`, r, 1, 4, 'int');
      all.push(...s);
      return [`P${r} → P0`, String(s.length), escapeHtml(s.join(' '))];
    });
    rows.push(['P0', String(all.length), escapeHtml(all.join(' '))]);
    return table([bi('Процесс', 'Процесс'), 'N', bi('Негізгі процесс алған мәндер', 'Значения в главном процессе')], rows);
  }
  if (currentTask === 11) {
    const rows = Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => {
      const v = readSingle(`v_${r}`, 'real', `P0 (P${r} үшін, №${r} сан)`, `P0 (для P${r}, число №${r})`);
      return [`P${r}`, escapeHtml(fmt(v))];
    });
    return table([bi('Қабылдаушы', 'Получатель'), bi('Алынған сан', 'Полученное число')], rows);
  }
  if (currentTask === 16) {
    const expected = readSingle('expected_0', 'int', 'P0 (күтілетін сан)', 'P0 (ожидаемое количество)');
    check(
      expected >= 1 && expected < k,
      'P0: күтілетін сан 1…K−1 аралығында болуы керек.',
      'P0: ожидаемое количество должно быть в диапазоне 1…K−1.'
    );
    const vals = Array.from({ length: k - 1 }, (_, i) => readSingle(`v_${i + 1}`, 'int', `P${i + 1}, №1 сан`, `P${i + 1}: число №1`));
    const positives = vals.filter(v => v > 0);
    check(
      positives.length === expected,
      'P0 күткен сан нақты оң мәндер санымен сәйкес емес.',
      'Ожидаемое в P0 количество не совпадает с числом положительных значений.'
    );
    return table(
      [bi('Қабылдаушы', 'Получатель'), bi('Оң мәндер саны', 'Положительных чисел'), bi('Негізгі процестегі қосынды', 'Сумма в главном процессе')],
      [['P0', String(positives.length), escapeHtml(fmt(positives.reduce((a, b) => a + b, 0)))]]
    );
  }
  if (currentTask === 18) {
    const sent = Array.from({ length: k }, (_, r) => readSingle(`v_${r}`, 'int', `P${r}, №1 сан`, `P${r}: число №1`));
    const rows = sent.map((_, r) => [`P${r}`, `P${(r - 1 + k) % k}`, escapeHtml(fmt(sent[(r - 1 + k) % k]))]);
    return table([bi('Қабылдаушы', 'Получатель'), bi('Жіберуші', 'Отправитель'), bi('Алынған сан', 'Полученное число')], rows);
  }
  if (currentTask === 21) {
    const a = Array.from({ length: k }, (_, r) => readSingle(`a_${r}`, 'real', `P${r}, №1 сан (A)`, `P${r}: число №1 (A)`));
    const n = Array.from({ length: k }, (_, r) => readSingle(`n_${r}`, 'int', `P${r}, №2 сан (N)`, `P${r}: число №2 (N)`));
    check(
      [...n].sort((x, y) => x - y).every((v, i) => v === i),
      'N мәндері 0…K−1 сандарының қайталанбайтын алмастыруы болуы керек.',
      'Значения N должны образовывать перестановку чисел 0…K−1.'
    );
    const rec = Array(k), src = Array(k);
    n.forEach((dest, r) => { rec[dest] = a[r]; src[dest] = r; });
    const rows = rec.map((v, r) => [`P${r}`, `P${src[r]}`, escapeHtml(`${fmt(v)} (P${src[r]})`)]);
    return table([bi('Қабылдаушы', 'Получатель'), bi('Жіберуші', 'Отправитель'), bi('Нәтиже (A және ранг)', 'Ответ (A и отправитель)')], rows);
  }
  if (currentTask === 24) {
    check(
      k % 2 === 0,
      'MPIBegin24 үшін процесс саны жұп болуы керек.',
      'Для MPIBegin24 количество процессов должно быть чётным.'
    );
    const sets = Array.from({ length: k }, (_, r) => readVector(`set_${r}`, r, 1, 4, 'real'));
    const rows = sets.map((_, r) => {
      const partner = r % 2 === 0 ? r + 1 : r - 1;
      return [`P${r}`, `P${partner}`, escapeHtml(sets[partner].map(fmt).join(' '))];
    });
    return table([bi('Қабылдаушы', 'Получатель'), bi('Жұбы', 'Партнёр'), bi('Алынған жиын', 'Полученный набор')], rows);
  }
  if (currentTask === 26) {
    const ranks = Array.from({ length: k - 1 }, (_, i) => i + 1);
    const a = {}, nList = [];
    for (const r of ranks) {
      a[r] = readSingle(`a_${r}`, 'real', `P${r}, №1 сан (A)`, `P${r}: число №1 (A)`);
      const nr = readSingle(`n_${r}`, 'int', `P${r}, №2 сан (N)`, `P${r}: число №2 (N)`);
      nList.push(nr);
    }
    check(
      [...nList].sort((x, y) => x - y).every((v, i) => v === i + 1),
      'N мәндері 1…K−1 сандарының қайталанбайтын алмастыруы болуы керек.',
      'Значения N должны образовывать перестановку чисел 1…K−1.'
    );
    const ordered = Array(k);
    ranks.forEach((r, idx) => { ordered[nList[idx]] = a[r]; });
    const summary = ranks.map(i => fmt(ordered[i])).join(' ');
    const rows = ranks.map(i => [`N = ${i}`, escapeHtml(fmt(ordered[i]))]);
    rows.push(['P0', escapeHtml(summary)]);
    return table([bi('Реті / Процесс', 'Порядок / Процесс'), bi('Шығарылған мәндер', 'Выведенные значения')], rows);
  }
  if (currentTask === 29) {
    const all = [];
    const rows = Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => {
      const t = readSingle(`t_${r}`, 'int', `P${r} (T)`, `P${r} (T)`);
      check(t === 0 || t === 1, 'T = 0 немесе 1 болуы керек.', 'T должно быть 0 или 1.');
      const s = readVector(`set_${r}`, r, 0, 10, t === 0 ? 'int' : 'real');
      const formatted = s.map(fmt);
      all.push(...formatted);
      return [`P${r} → P0`, t === 0 ? 'int (T=0)' : 'double (T=1)', escapeHtml(formatted.length ? formatted.join(' ') : '∅')];
    });
    rows.push(['P0', 'MPI_Probe', escapeHtml(all.length ? all.join(' ') : '(пусто)')]);
    return table([bi('Процесс', 'Процесс'), bi('Тип', 'Тип'), bi('Негізгі процесс алған мәндер', 'Значения в главном процессе')], rows);
  }
  if (currentTask === 30) {
    const v0 = readSingle('v_0', 'int', 'P0, №1 сан', 'P0: число №1');
    const rows = Array.from({ length: k - 1 }, (_, i) => [`P${i + 1}`, escapeHtml(String(v0))]);
    return table([bi('Қабылдаушы', 'Получатель'), bi('Алынған сан (MPI_Bcast)', 'Полученное число (MPI_Bcast)')], rows);
  }
  if (currentTask === 34) {
    const sets = Array.from({ length: k }, (_, r) => readVector(`set_${r}`, r, r + 2, r + 2, 'int'));
    const all = sets.flat();
    const rows = sets.map((s, r) => [`P${r} → P0`, String(s.length), escapeHtml(s.join(' '))]);
    rows.push(['P0', String(all.length), escapeHtml(all.join(' '))]);
    return table([bi('Процесс', 'Процесс'), bi('Ұзындығы', 'Длина'), bi('Жиналған сандар (MPI_Gatherv)', 'Собранные числа (MPI_Gatherv)')], rows);
  }
  if (currentTask === 37) {
    const s0 = readVector('set_0', 0, k, k, 'real');
    const rows = Array.from({ length: k }, (_, r) => [`P${r}`, `P0[${k - 1 - r}]`, escapeHtml(fmt(s0[k - 1 - r]))]);
    return table([bi('Қабылдаушы', 'Получатель'), bi('Дереккөз орны', 'Позиция в P0'), bi('Алынған сан (MPI_Scatterv)', 'Полученное число (MPI_Scatterv)')], rows);
  }
  if (currentTask === 40) {
    const vals = Array.from({ length: k }, (_, r) => readSingle(`v_${r}`, 'real', `P${r}, №1 сан`, `P${r}: число №1`));
    const joined = escapeHtml(vals.map(fmt).join(' '));
    const rows = Array.from({ length: k }, (_, r) => [`P${r}`, joined]);
    return table([bi('Процесс', 'Процесс'), bi('Барлық процестен жиналған сандар', 'Числа от всех процессов')], rows);
  }
  if (currentTask === 43) {
    const sets = Array.from({ length: k }, (_, r) => readVector(`set_${r}`, r, k, k, 'real'));
    const rows = Array.from({ length: k }, (_, dest) => [`P${dest}`, escapeHtml(sets.map(s => fmt(s[dest])).join(' '))]);
    return table([bi('Процесс', 'Процесс'), bi('Қабылданған сандар (MPI_Alltoall)', 'Полученные числа (MPI_Alltoall)')], rows);
  }
  if (currentTask === 45) {
    const total = (k * (k + 1)) / 2;
    const sets = Array.from({ length: k }, (_, r) => readVector(`set_${r}`, r, total, total, 'int'));
    const rows = Array.from({ length: k }, (_, dest) => {
      const start = (dest * (dest + 1)) / 2;
      const len = dest + 1;
      const received = sets.flatMap(s => s.slice(start, start + len));
      return [`P${dest}`, String(len), escapeHtml(received.join(' '))];
    });
    return table([bi('Процесс', 'Процесс'), bi('Әрқайсысынан R+1', 'По R+1 от каждого'), bi('Қабылданған сандар (MPI_Alltoallv)', 'Полученные числа (MPI_Alltoallv)')], rows);
  }
  if ([48, 51, 57].includes(currentTask)) {
    const count = k + 5;
    const mode = currentTask === 51 ? 'real' : 'int';
    const sets = Array.from({ length: k }, (_, r) => readVector(`set_${r}`, r, count, count, mode));
    if (currentTask === 48) {
      const out = sets[0].map((_, i) => sets.reduce((a, s) => a + s[i], 0));
      return table([bi('Қабылдаушы', 'Получатель'), bi('Позициялық қосындылар', 'Покомпонентные суммы')], [['P0', escapeHtml(out.map(fmt).join(' '))]]);
    }
    if (currentTask === 51) {
      const out = sets[0].map((_, i) => sets.reduce((a, s) => a * s[i], 1));
      const joined = escapeHtml(out.map(fmt).join(' '));
      return table([bi('Процесс', 'Процесс'), bi('Барлық позициялық көбейтінді', 'Покомпонентные произведения')], Array.from({ length: k }, (_, r) => [`P${r}`, joined]));
    }
    let prefix = Array(count).fill(-Infinity);
    const rows = sets.map((s, r) => {
      prefix = prefix.map((v, i) => Math.max(v, s[i]));
      return [`P${r}`, escapeHtml(prefix.map(fmt).join(' '))];
    });
    return table([bi('Процесс', 'Процесс'), bi('0…R префикстік максимумдар', 'Префиксные максимумы 0…R')], rows);
  }
  if (currentTask === 54) {
    const sets = Array.from({ length: k }, (_, r) => readVector(`set_${r}`, r, 2 * k, 2 * k, 'real'));
    const max = sets[0].map((_, i) => Math.max(...sets.map(s => s[i])));
    const rows = Array.from({ length: k }, (_, r) => [`P${r}`, escapeHtml(`${fmt(max[2 * r])} ${fmt(max[2 * r + 1])}`)]);
    return table([bi('Процесс', 'Процесс'), bi('Алынған екі максимум', 'Два полученных максимума')], rows);
  }
  if (currentTask === 59) {
    const rows = Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => {
      const s = readVector(`set_${r}`, 0, 3, 3, 'int');
      return [`P${r}`, escapeHtml(s.join(' '))];
    });
    return table([bi('Қабылдаушы', 'Получатель'), bi('Үштік', 'Тройка')], rows);
  }
  if ([62, 67].includes(currentTask)) {
    const rows = Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => {
      const [x, y, z] = readMixedTriple(r, 1, `P0 (үштік ${r})`, `P0 (тройка ${r})`);
      return [`P${r}`, escapeHtml(`${x} ${fmt(y)} ${z}`)];
    });
    return table([bi('Қабылдаушы', 'Получатель'), currentTask === 67 ? bi('Оралған және ашылған үштік', 'Упакованная и распакованная тройка') : bi('Алынған үштік', 'Полученная тройка')], rows);
  }
  if (currentTask === 64) {
    const triples = Array.from({ length: k }, (_, r) => {
      const [x, y, z] = readMixedTriple(r, 1, `P${r} (үштік 1)`, `P${r} (тройка 1)`);
      return `${x} ${fmt(y)} ${z}`;
    });
    const joined = escapeHtml(triples.join(' '));
    return table([bi('Процесс', 'Процесс'), bi('Ранг ретімен жиналған үштіктер', 'Тройки по порядку рангов')], Array.from({ length: k }, (_, r) => [`P${r}`, joined]));
  }
  if (currentTask === 69) {
    const all = [];
    const rows = Array.from({ length: k - 1 }, (_, i) => i + 1).map(r => {
      const [x, y, z] = readMixedTriple(r, 2, `P${r} (үштік 1)`, `P${r} (тройка 1)`);
      const t = `${x} ${y} ${fmt(z)}`;
      all.push(t);
      return [`P${r} → P0`, escapeHtml(t)];
    });
    rows.push(['P0', escapeHtml(all.join(' '))]);
    return table([bi('Процесс', 'Процесс'), bi('Негізгі процесс алған үштіктер', 'Тройки в главном процессе')], rows);
  }
  if (currentTask === 71) {
    const evenCount = Math.floor((k + 1) / 2);
    const s0 = readVector('set_0', 0, evenCount, evenCount, 'int');
    const rows = s0.map((v, i) => [`P${2 * i}`, `evenComm rank ${i}`, escapeHtml(String(v))]);
    return table([bi('Қабылдаушы', 'Получатель'), bi('Жаңа коммуникаторда', 'В новом коммуникаторе'), bi('Алынған сан', 'Полученное число')], rows);
  }
  if (currentTask === 75) {
    const vals = Array.from({ length: k }, (_, r) => readSingle(`v_${r}`, 'real', `P${r}, №1 сан`, `P${r}: число №1`));
    const evens = vals.filter((_, r) => r % 2 === 0);
    const odds = vals.filter((_, r) => r % 2 === 1);
    const rows = [
      ['P0', bi('Жұп рангтар максимумы (MPI_MAX)', 'Максимум чётных рангов (MPI_MAX)'), escapeHtml(fmt(Math.max(...evens)))],
      ['P1', bi('Тақ рангтар минимумы (MPI_MIN)', 'Минимум нечётных рангов (MPI_MIN)'), escapeHtml(fmt(Math.min(...odds)))]
    ];
    return table([bi('Қабылдаушы', 'Получатель'), bi('Топ операциясы', 'Операция подгруппы'), bi('Нәтиже', 'Результат')], rows);
  }
  if (currentTask === 77 || currentTask === 79) {
    const active = [];
    for (let r = 0; r < k; r++) {
      const nr = readSingle(`n_${r}`, 'int', `P${r} (N)`, `P${r} (N)`);
      check(nr === 0 || nr === 1, `P${r}: N мәні 0 немесе 1 болуы керек.`, `P${r}: N должно быть 0 или 1.`);
      if (nr === 1) {
        const ar = readSingle(`a_${r}`, 'real', `P${r}, A саны`, `P${r}: число A`);
        active.push({ rank: r, a: ar });
      }
    }
    check(
      active.length >= 1,
      'Кемінде бір процесте N=1 болуы керек.',
      'Нужен хотя бы один процесс с N=1.'
    );
    const collected = escapeHtml(active.map(item => fmt(item.a)).join(' '));
    const rows = currentTask === 77
      ? [[`P${active[0].rank}`, active.map(x => `P${x.rank}`).join(', '), collected]]
      : active.map(item => [`P${item.rank}`, active.map(x => `P${x.rank}`).join(', '), collected]);
    return table([bi('Қабылдаушы', 'Получатель'), bi('N=1 тобы', 'Группа N=1'), bi('Жиналған A мәндері', 'Собранные числа A')], rows);
  }
  if (currentTask === 80) {
    const entries = Array.from({ length: k }, (_, r) => {
      const nr = readSingle(`n_${r}`, 'int', `P${r}, №1 сан (N)`, `P${r}: число №1 (N)`);
      check(nr === 1 || nr === 2, `P${r}: N мәні 1 немесе 2 болуы керек.`, `P${r}: N должно быть 1 или 2.`);
      const ar = readSingle(`a_${r}`, 'int', `P${r}, №2 сан (A)`, `P${r}: число №2 (A)`);
      return { rank: r, n: nr, a: ar };
    });
    const g1 = entries.filter(e => e.n === 1);
    const g2 = entries.filter(e => e.n === 2);
    check(
      g1.length >= 1 && g2.length >= 1,
      'N=1 және N=2 процестерінің екеуі де кемінде бір рет кездесуі керек.',
      'Нужны процессы и с N=1, и с N=2.'
    );
    const s1 = escapeHtml(g1.map(e => String(e.a)).join(' '));
    const s2 = escapeHtml(g2.map(e => String(e.a)).join(' '));
    const rows = entries.map(e => [`P${e.rank}`, `N = ${e.n}`, e.n === 1 ? s1 : s2]);
    return table([bi('Процесс', 'Процесс'), bi('Тобы', 'Группа'), bi('Топ ішіндегі A мәндері', 'Числа A внутри группы')], rows);
  }
  if (currentTask === 83) {
    const nVal = readSingle('n_0', 'int', 'P0, №1 сан (N)', 'P0: число №1 (N)');
    check(
      nVal > 1 && k % nVal === 0,
      `N саны 1-ден үлкен болуы және K=${k} санын қалдықсыз бөлуі керек.`,
      `N должно быть больше 1 и делить K=${k} без остатка.`
    );
    const cols = k / nVal;
    const rows = Array.from({ length: k }, (_, r) => {
      const c0 = Math.floor(r / cols), c1 = r % cols;
      return [`P${r}`, `${nVal} × ${cols}`, escapeHtml(`${c0} ${c1}`)];
    });
    return table([bi('Процесс', 'Процесс'), bi('Тор өлшемі', 'Размер решётки'), bi('Координаттары (MPI_Cart_coords)', 'Координаты (MPI_Cart_coords)')], rows);
  }
  if (currentTask === 85) {
    check(
      k >= 4 && k % 2 === 0,
      'MPIBegin85 үшін процестер саны жұп және K ≥ 4 болуы керек.',
      'Для MPIBegin85 число процессов не соответствует условию (нужно чётное K ≥ 4).'
    );
    const half = k / 2;
    const a0 = readSingle('v_0', 'real', 'P0, №1 сан (A)', 'P0: число №1 (A)');
    const a1 = readSingle(`v_${half}`, 'real', `P${half}, №1 сан (A)`, `P${half}: число №1 (A)`);
    const rows = Array.from({ length: k }, (_, r) => {
      const rowIdx = r < half ? 0 : 1;
      return [`P${r}`, bi(`${rowIdx}-жол`, `Строка ${rowIdx}`), escapeHtml(fmt(rowIdx === 0 ? a0 : a1))];
    });
    return table([bi('Процесс', 'Процесс'), bi('Ішкі тор', 'Подрешётка'), bi('Алынған A мәні', 'Полученное число A')], rows);
  }
  if (currentTask === 92) {
    check(
      k === 8 || k === 12,
      'MPIBegin92 үшін процестер саны K = 8 немесе 12 болуы керек.',
      'Для MPIBegin92 число процессов не соответствует условию (K = 8 или 12).'
    );
    const vals = Array.from({ length: k }, (_, r) => readSingle(`v_${r}`, 'real', `P${r}, №1 сан`, `P${r}: число №1`));
    const zDim = k / 4;
    const sums = Array.from({ length: zDim }, (_, z) =>
      vals.reduce((acc, v, r) => (r % zDim === z ? acc + v : acc), 0)
    );
    const rows = Array.from({ length: k }, (_, r) => {
      const z = r % zDim;
      return [`P${r}`, `z = ${z} (2×2)`, escapeHtml(fmt(sums[z]))];
    });
    return table([bi('Процесс', 'Процесс'), bi('Матрица қимасы', 'Матрица сечения'), bi('Матрица қосындысы', 'Сумма матрицы')], rows);
  }
  if (currentTask === 94) {
    const m = readSingle('m_0', 'int', 'P0, №1 сан (M)', 'P0: число №1 (M)');
    const n = readSingle('n_0', 'int', 'P0, №2 сан (N)', 'P0: число №2 (N)');
    check(
      m > 0 && n > 0 && m * n <= k,
      'M > 0, N > 0 және M·N ≤ K болуы керек.',
      'M и N должны быть положительными, а M·N не больше K.'
    );
    const total = m * n;
    const rows = Array.from({ length: total }, (_, r) => {
      const x = readSingle(`x_${r}`, 'int', `P${r}, №1 сан (X)`, `P${r}: число №1 (X)`);
      const y = readSingle(`y_${r}`, 'int', `P${r}, №2 сан (Y)`, `P${r}: число №2 (Y)`);
      const target = (x >= 0 && x < m) ? x * n + ((y % n + n) % n) : -1;
      return [`P${r}`, `(${x}, ${y})`, escapeHtml(String(target))];
    });
    return table([bi('Процесс', 'Процесс'), bi('Енгізілген (X, Y)', 'Введённые (X, Y)'), bi('Табылған ранг (MPI_Cart_rank)', 'Найденный ранг (MPI_Cart_rank)')], rows);
  }
  if (currentTask === 96) {
    check(
      k >= 4 && k % 2 === 0,
      'MPIBegin96 үшін процестер саны жұп және K ≥ 4 болуы керек.',
      'Для MPIBegin96 число процессов не соответствует условию (нужно чётное K ≥ 4).'
    );
    const vals = Array.from({ length: k }, (_, r) => readSingle(`v_${r}`, 'real', `P${r}, №1 сан (A)`, `P${r}: число №1 (A)`));
    const cols = k / 2;
    const rows = Array.from({ length: k }, (_, r) => {
      const row = Math.floor(r / cols), col = r % cols;
      const src = row * cols + ((col - 1 + cols) % cols);
      return [`P${r}`, `P${src} (${row}-${document.documentElement.lang === 'ru' ? 'строка' : 'жол'})`, escapeHtml(fmt(vals[src]))];
    });
    return table([bi('Қабылдаушы', 'Получатель'), bi('Дереккөз (MPI_Cart_shift)', 'Источник (MPI_Cart_shift)'), bi('Алынған A мәні', 'Полученное число A')], rows);
  }
  if (currentTask === 100) {
    check(
      [7, 10, 13].includes(k),
      'MPIBegin100 үшін процестер саны K = 7, 10 немесе 13 болуы керек.',
      'Для MPIBegin100 число процессов не соответствует условию (K = 7, 10 или 13).'
    );
    const vals = Array.from({ length: k }, (_, r) => readSingle(`v_${r}`, 'int', `P${r}, №1 сан (A)`, `P${r}: число №1 (A)`));
    const adj = Array.from({ length: k }, () => []);
    const edge = (a, b) => { adj[a].push(b); adj[b].push(a); };
    for (let first = 1; first < k; first += 3) {
      edge(first, first + 1);
      edge(first, first + 2);
      edge(first + 1, first + 2);
      edge(0, first + 2);
    }
    adj.forEach(a => a.sort((x, y) => x - y));
    const rows = Array.from({ length: k }, (_, r) => {
      const nbs = adj[r];
      return [`P${r}`, nbs.map(nb => `P${nb}`).join(', '), escapeHtml(nbs.map(nb => String(vals[nb])).join(' '))];
    });
    return table([bi('Процесс', 'Процесс'), bi('Көршілері (граф)', 'Соседи (граф)'), bi('Көршілердің A мәндері', 'Числа A от соседей')], rows);
  }
  return '';
}

document.querySelectorAll('.module-tab').forEach(tab => tab.addEventListener('click', () => {
  currentModule = Number(tab.dataset.module);
  document.querySelector('#taskSearch').value = '';
  updateModuleTabsUI();
  selectTask(TASKS[currentModule][0].id);
}));

prevTaskTop?.addEventListener('click', () => goAdjacentTask(-1));
nextTaskTop?.addEventListener('click', () => goAdjacentTask(1));
prevTaskBottom?.addEventListener('click', () => goAdjacentTask(-1));
nextTaskBottom?.addEventListener('click', () => goAdjacentTask(1));

document.addEventListener('keydown', event => {
  if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    if (event.key === 'ArrowRight') { event.preventDefault(); goAdjacentTask(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); goAdjacentTask(-1); }
  }
});

processCount.addEventListener('change', renderInputs);
document.querySelector('#decreaseProcesses').addEventListener('click', () => { processCount.value = clampK() - 1; renderInputs(); });
document.querySelector('#increaseProcesses').addEventListener('click', () => { processCount.value = clampK() + 1; renderInputs(); });
document.querySelector('#resetExample').addEventListener('click', loadFileExample);
document.querySelector('#randomFill')?.addEventListener('click', generateRandomInputs);
document.querySelector('#clearFields')?.addEventListener('click', renderInputs);
document.querySelector('#exportReport')?.addEventListener('click', exportPdfReport);

form.addEventListener('input', () => {
  dynamicFields.querySelectorAll('.rank-row.input-error').forEach(row => row.classList.remove('input-error'));
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  if (button?.disabled) return;
  const original = button ? button.innerHTML : '';
  if (button) {
    button.disabled = true;
    button.innerHTML = bi('Есептелуде…', 'Вычисляем…');
  }
  resultContent.setAttribute('aria-busy', 'true');
  await new Promise(resolve => setTimeout(resolve, 180));
  try {
    runCalculationNow();
  } finally {
    resultContent.removeAttribute('aria-busy');
    if (button) {
      button.innerHTML = original;
      button.disabled = false;
    }
  }
});

document.querySelector('#copyResult').addEventListener('click', async event => {
  const button = event.currentTarget;
  const text = resultContent.innerText.trim();
  if (!text) return;
  const ru = document.documentElement.lang === 'ru';
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = ru ? 'Скопировано' : 'Көшірілді';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(resultContent);
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = 'Ctrl+C';
  }
  setTimeout(() => {
    button.textContent = document.documentElement.lang === 'ru' ? 'Копировать' : 'Көшіру';
  }, 1600);
});

document.querySelector('#taskSearch').addEventListener('input', event => {
  const raw = event.target.value.trim();
  const numMatch = raw.match(/^(?:mpibegin)?\s*(\d{1,3})$/i);
  if (numMatch) {
    const num = Number(numMatch[1]);
    const hit = FLAT_TASKS.find(t => t.id === num);
    if (hit && hit.id !== currentTask) {
      selectTask(hit.id);
      return;
    }
  }
  renderTaskList();
});
taskSelect.addEventListener('change', () => { if (taskSelect.value) selectTask(Number(taskSelect.value)); });

const route = new URLSearchParams(location.search);
const routeModule = Number(route.get('module'));
const routeTask = Number(route.get('task'));
if ([1, 2, 3, 4, 5].includes(routeModule)) {
  currentModule = routeModule;
  updateModuleTabsUI();
}
const globalRouteHit = FLAT_TASKS.find(t => t.id === routeTask);
selectTask(globalRouteHit ? globalRouteHit.id : TASKS[currentModule][0].id);
