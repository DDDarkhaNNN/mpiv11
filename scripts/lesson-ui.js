(() => {
  const $ = selector => document.querySelector(selector);
  const escape = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bi = (kk,ru,tag='span') => {
    const active = document.documentElement.lang === 'ru' ? ru : kk;
    return `<${tag} data-kk="${escape(kk)}" data-ru="${escape(ru)}">${escape(active)}</${tag}>`;
  };
  const pair = (texts,tag='p') => bi(texts[0],texts[1],tag);
  const shell=$('.calculator-shell'), panel=$('#lessonPanel'), tabs=$('#lessonTabs');
  const labels={condition:['Шарты','Условие'],calculate:['Есептеу','Расчёт'],steps:['Қадамдар','Шаги'],code:['C++ коды','Код C++']};
  let view='calculate', snapshot=null, cursor=0, timer=null, error=false;
  let completed={}, canSave=true;
  try {const data=JSON.parse(localStorage.getItem('mpi-completed-v1')||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))completed=data;} catch {canSave=false;}
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const stop=()=>{if(timer)clearInterval(timer);timer=null;};
  function lessonNavFooter() {
    const prevLbl = document.querySelector('#prevTaskBottom')?.textContent || '←';
    const nextLbl = document.querySelector('#nextTaskBottom')?.textContent || '→';
    const prevDis = document.querySelector('#prevTaskBottom')?.disabled ? 'disabled' : '';
    const nextDis = document.querySelector('#nextTaskBottom')?.disabled ? 'disabled' : '';
    const prevKk = document.querySelector('#prevTaskBottom')?.dataset.kk || prevLbl;
    const prevRu = document.querySelector('#prevTaskBottom')?.dataset.ru || prevLbl;
    const nextKk = document.querySelector('#nextTaskBottom')?.dataset.kk || nextLbl;
    const nextRu = document.querySelector('#nextTaskBottom')?.dataset.ru || nextLbl;
    return `<div class="lesson-footer-nav"><button type="button" class="button ghost" data-lesson-nav="-1" ${prevDis} data-kk="${escape(prevKk)}" data-ru="${escape(prevRu)}">${escape(prevLbl)}</button><button type="button" class="button primary" data-lesson-nav="1" ${nextDis} data-kk="${escape(nextKk)}" data-ru="${escape(nextRu)}">${escape(nextLbl)}</button></div>`;
  }
  function bindLessonNav() {
    panel.querySelectorAll('[data-lesson-nav]').forEach(btn =>
      btn.addEventListener('click', () => window.MpiNavigateTask?.(Number(btn.dataset.lessonNav)))
    );
  }
  function highlightCppLine(rawLine) {
    const tokenRe = /(\/\/.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(^\s*#\s*[a-zA-Z_]\w*)|\b(MPI_[A-Za-z0-9_]+)\b|\b(int|double|float|char|void|bool|long|size_t|auto|const|constexpr|struct|enum|class|using|namespace|std|string|vector|array)\b|\b(if|else|for|while|do|return|break|continue|switch|case|try|catch|throw|true|false|nullptr)\b|\b(\d+(?:\.\d+)?)\b/g;
    let out = '', last = 0, m;
    while ((m = tokenRe.exec(rawLine)) !== null) {
      if (m.index > last) out += escape(rawLine.slice(last, m.index));
      const full = m[0];
      const cls = m[1] ? 'tok-com' : m[2] ? 'tok-str' : m[3] ? 'tok-pre' : m[4] ? 'tok-mpi' : m[5] ? 'tok-type' : m[6] ? 'tok-kw' : 'tok-num';
      out += `<span class="${cls}">${escape(full)}</span>`;
      last = m.index + full.length;
    }
    if (last < rawLine.length) out += escape(rawLine.slice(last));
    return out || ' ';
  }

  function renderIdeCode(sourceText, fileName, langBadge) {
    const clean = String(sourceText || '').replace(/\r\n/g, '\n');
    const lines = clean.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    const rows = lines.map((ln, idx) => `<tr><td class="ide-ln">${idx + 1}</td><td class="ide-lc">${highlightCppLine(ln)}</td></tr>`).join('');
    return `<div class="ide-frame"><div class="ide-toolbar"><div class="ide-file"><span>${escape(fileName)}</span><span class="ide-lang-pill">${escape(langBadge)}</span></div><button type="button" class="ide-copy-btn" id="copyCppCode" data-kk="Кодты көшіру" data-ru="Копировать код">${document.documentElement.lang==='ru'?'Копировать код':'Кодты көшіру'}</button></div><div class="ide-scroll"><table class="ide-table"><tbody>${rows}</tbody></table></div></div>`;
  }

  function progress() {
    const ids=Object.keys(window.MpiLessons.tasks), count=ids.filter(id=>completed[id]===true).length;
    $('#learningProgress').innerHTML=`<div class="progress-count">${bi(`Орындалды: ${count} / ${ids.length}`,`Выполнено: ${count} / ${ids.length}`)}<progress value="${count}" max="${ids.length}" aria-label="${count} / ${ids.length}"></progress></div><button type="button" class="completion-button" id="markComplete" aria-pressed="${!!completed[currentTask]}" ${!snapshot&&!completed[currentTask]?'disabled':''}>${completed[currentTask]?bi('✓ Орындалды · белгіні алу','✓ Выполнено · снять отметку'):bi('Орындалды деп белгілеу','Отметить выполненной')}</button>${!canSave?bi('Белгілер тек осы сессияда сақталады.','Отметки сохраняются только в этой сессии.'):''}`;
    $('#markComplete').addEventListener('click',()=>{completed[currentTask]=!completed[currentTask];try{localStorage.setItem('mpi-completed-v1',JSON.stringify(completed));}catch{canSave=false;}progress();window.MpiRefreshTaskChips?.();window.MpiSyncGlobalProgress?.();});
    window.MpiSyncGlobalProgress?.();
  }
  function setView(next) {stop();view=next;render();}
  function render() {
    tabs.innerHTML=Object.entries(labels).map(([key,texts])=>`<button type="button" data-view="${key}" aria-pressed="${view===key}" aria-controls="${key==='calculate'?'calculatorForm':'lessonPanel'}">${pair(texts,'span')}</button>`).join('');
    tabs.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
    shell.classList.toggle('lesson-reading',view!=='calculate');panel.hidden=view==='calculate';
    if(view==='calculate') return;
    panel.classList.remove('lesson-enter');void panel.offsetWidth;panel.classList.add('lesson-enter');
    const lesson=window.MpiLessons.tasks[currentTask];
    if(view==='condition') {
      const fileExample=window.MpiFileSummaries?.[currentTask];
      const topoPreview = currentModule===5 ? (() => {
        const k=clampK(), inputs={};
        dynamicFields.querySelectorAll('input,select').forEach(el=>inputs[el.id]=el.value||el.placeholder||'');
        const {points,wires,labels:topoLabels,nodeR}=buildTopologyGeometry(currentTask,k,inputs);
        return `<div class="topo-preview-card"><h3>${bi('Виртуалды топология сызбасы (K = '+k+')','Схема виртуальной топологии (K = '+k+')')}</h3><svg class="trace-diagram topo-static" viewBox="0 0 440 330" role="img" aria-label="MPIBegin${currentTask} topology">${topoLabels.map(l=>renderTopoLabel(l)).join('')}${wires.map(w=>`<path class="wire ${w.dashed?'wire-periodic':''}" d="${w.d}"/>`).join('')}${points.map((p,r)=>`<g class="${p.inactive?'inactive-node':r===0?'sender':''}"><circle class="node" cx="${p.x}" cy="${p.y}" r="${nodeR}"/><text x="${p.x}" y="${p.sub?p.y-3:p.y}">P${r}</text>${p.sub?`<text class="node-sub" x="${p.x}" y="${p.y+9}">${escape(p.sub)}</text>`:''}</g>`).join('')}</svg></div>`;
      })() : '';
      panel.innerHTML=`<p class="lesson-lead">${pair(window.MpiLessons.modules[currentModule],'span')}</p><div class="condition-grid"><section>${bi('Берілгені','Дано','h3')}${pair(lesson.given)}</section><section>${bi('Орындау керек','Требуется','h3')}${pair(lesson.find)}</section></div>${topoPreview}<div class="lesson-example">${fileExample?bi('Берілген файлдағы мысал','Пример из предоставленного файла','h3'):bi('Түсіндіру мысалы','Пример для пояснения','h3')}${fileExample?`<p>${escape(fileExample)}</p>`:pair(lesson.example)}</div><div class="lesson-source"><span class="api-label">${escape(lesson.api)}</span><a href="downloads/praktikum.pdf#page=${lesson.page}" target="_blank" rel="noopener">${bi(`Кітап · ${lesson.page}-бет ↗`,`Книга · страница ${lesson.page} ↗`)}</a></div>${bi('Шарт кітап негізінде қайта баяндалған. Браузер MPI шақыруларын орындамай, олардың нәтижесін модельдейді.','Условие пересказано по книге. Браузер моделирует результат, не выполняя вызовы MPI.','p')}${lessonNavFooter()}`;
      bindLessonNav();
    }
    if(view==='code') {
      const mpi=currentModule>1;
      const path=mpi?`downloads/code/module-${currentModule}/MPIBegin${currentTask}.cpp`:`downloads/code/MPIBegin${currentTask}.cpp`;
      const rawCode=window.MpiSourceCode[currentTask]||'';
      panel.innerHTML=`<div class="code-heading"><div><p class="eyebrow">${mpi?'MPI · C++17':'C++17'}</p><h3>MPIBegin${currentTask}.cpp</h3></div><div class="code-actions"><a class="button ghost" href="${path}" download>${bi('Кодты жүктеу','Скачать код')}</a>${mpi?`<a class="button ghost" href="downloads/module-${currentModule}-variant-11.zip" download>${bi('Толық модуль ZIP','Весь модуль ZIP')}</a>`:''}</div></div><p class="lesson-lead">${mpi?bi('Бұл тапсырманың C++17 және MPI стандартындағы толық бағдарламасы. Модуль архивінде дайын EXE файлдары, ортақ console_mpi.hpp, build.cmd және іске қосу нұсқаулығы жинақталған (іске қосуға MPI Runtime, қайта құрастыруға MPI SDK мен C++17 компиляторы қажет).','Полная программа задачи на C++17 с использованием MPI. В архиве модуля собраны готовые EXE, общий заголовок console_mpi.hpp, скрипт build.cmd и инструкция по запуску (для запуска нужен MPI Runtime, для пересборки — MPI SDK и компилятор C++17).'):bi('Windows үшін MPI-сіз C++ оқу үлгісі. VS Code — редактор; іске қосу үшін C++ компиляторы керек.','Учебный пример C++ без MPI для Windows. VS Code — редактор; для запуска нужен компилятор C++.')}</p>${renderIdeCode(rawCode,`MPIBegin${currentTask}.cpp`,mpi?'C++17 · MPI':'C++17')}${lessonNavFooter()}`;
      $('#copyCppCode')?.addEventListener('click', async ev => {
        const btn = ev.currentTarget;
        const ru = document.documentElement.lang === 'ru';
        try {
          await navigator.clipboard.writeText(rawCode);
          btn.textContent = ru ? '✓ Скопировано' : '✓ Көшірілді';
        } catch {
          btn.textContent = 'Ctrl+C';
        }
        setTimeout(() => {
          btn.textContent = document.documentElement.lang === 'ru' ? 'Копировать код' : 'Кодты көшіру';
        }, 1600);
      });
      bindLessonNav();
    }
    if(view==='steps') { renderSteps(); panel.insertAdjacentHTML('beforeend', lessonNavFooter()); bindLessonNav(); }
  }
  function renderSteps() {
    if(!snapshot) {
      panel.innerHTML=`<div class="lesson-empty">${bi('Өз сандарыңызбен қадамдап қараңыз','Разберите шаги на своих данных','h3')}${bi(error?'Алдымен «Есептеу» бөліміндегі деректер қатесін түзетіңіз.':'Енгізілген деректер бойынша есептеп, процестердің әрекетін көрсетеміз.',error?'Сначала исправьте ошибку данных в разделе «Расчёт».':'Рассчитаем результат и покажем действия процессов для введённых данных.','p')}<button class="button primary" id="traceCalculate" type="button">${bi(error?'Деректерге оралу':'Есептеу және көрсету',error?'Вернуться к данным':'Рассчитать и показать')}</button></div>`;
      $('#traceCalculate').addEventListener('click',()=>{if(error)setView('calculate');else form.requestSubmit();});return;
    }
    panel.innerHTML=`<h3>${bi('Деректер қалай өңделеді?','Как обрабатываются данные?')}</h3><div id="traceStage"></div><div class="trace-controls"><button type="button" id="tracePrev">${bi('← Артқа','← Назад')}</button><button type="button" class="primary" id="tracePlay">${bi('▶ Ойнату','▶ Воспроизвести')}</button><button type="button" id="traceNext">${bi('Келесі →','Далее →')}</button><output id="traceCounter" aria-live="polite"></output></div><p class="trace-footnote" data-kk="Сызба операцияның логикасын көрсетеді. Бұл MPI кітапханасының нақты жіберу реті немесе жылдамдығы емес." data-ru="Схема показывает логику операции, а не фактический порядок сообщений или скорость библиотеки MPI.">${document.documentElement.lang==='ru'?'Схема показывает логику операции, а не фактический порядок сообщений или скорость библиотеки MPI.':'Сызба операцияның логикасын көрсетеді. Бұл MPI кітапханасының нақты жіберу реті немесе жылдамдығы емес.'}</p>`;
    $('#tracePrev').addEventListener('click',()=>{stop();cursor=Math.max(0,cursor-1);draw(false);});
    $('#traceNext').addEventListener('click',()=>{stop();cursor=Math.min(snapshot.steps.length-1,cursor+1);draw(true);});
    $('#tracePlay').hidden=reduced.matches;
    $('#tracePlay').addEventListener('click',()=>{if(timer){stop();draw(false);return;}if(cursor===snapshot.steps.length-1)cursor=0;timer=setInterval(()=>{if(cursor>=snapshot.steps.length-1){stop();draw(false);}else{cursor++;draw(true);}},1900);draw(true);});
    draw(false);
  }
  function renderTopoLabel(l) {
    if (l.kk && l.ru) {
      const active = document.documentElement.lang === 'ru' ? l.ru : l.kk;
      return `<text class="topo-caption" x="${l.x}" y="${l.y}" data-kk="${escape(l.kk)}" data-ru="${escape(l.ru)}">${escape(active)}</text>`;
    }
    return `<text class="topo-caption" x="${l.x}" y="${l.y}">${escape(l.text || '')}</text>`;
  }

  function buildTopologyGeometry(task, k, inputs) {
    const W = 440, H = 330;
    const points = [];
    const wires = [];
    const labels = [];
    let nodeR = 23;

    const placeGrid = (rows, cols, x0, x1, y0, y1, startRank = 0) => {
      for (let r = 0; r < rows * cols; r++) {
        const row = Math.floor(r / cols), col = r % cols;
        const x = cols === 1 ? (x0 + x1) / 2 : x0 + (col * (x1 - x0)) / (cols - 1);
        const y = rows === 1 ? (y0 + y1) / 2 : y0 + (row * (y1 - y0)) / (rows - 1);
        points[startRank + r] = { x, y, sub: `(${row},${col})` };
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cur = startRank + row * cols + col;
          if (col + 1 < cols) wires.push({ d: `M ${points[cur].x} ${points[cur].y} L ${points[cur + 1].x} ${points[cur + 1].y}` });
          if (row + 1 < rows) wires.push({ d: `M ${points[cur].x} ${points[cur].y} L ${points[cur + cols].x} ${points[cur + cols].y}` });
        }
      }
    };

    if (task === 83) {
      const rows = Math.max(2, Number(inputs?.n_0) || 2);
      const cols = Math.max(1, Math.floor(k / rows));
      nodeR = Math.max(17, Math.min(23, Math.floor(115 / Math.max(rows, cols))));
      placeGrid(rows, cols, 85, 355, 68, 265);
      labels.push({ x: 220, y: 24, kk: `MPI_Cart_create: ${rows} × ${cols} декарттық тор`, ru: `MPI_Cart_create: решётка ${rows} × ${cols}` });
    } else if (task === 85 || task === 96) {
      const cols = Math.max(2, Math.floor(k / 2));
      nodeR = cols >= 5 ? 18 : 22;
      placeGrid(2, cols, 75, 365, 98, 232);
      if (task === 85) {
        wires.length = 0;
        for (let row = 0; row < 2; row++) {
          labels.push({ x: 30, y: row === 0 ? 98 : 232, text: `r${row}` });
          for (let col = 0; col + 1 < cols; col++) {
            const a = row * cols + col, b = a + 1;
            wires.push({ d: `M ${points[a].x} ${points[a].y} L ${points[b].x} ${points[b].y}` });
          }
        }
        labels.push({ x: 220, y: 24, kk: `MPI_Cart_sub: 2 × ${cols} → 2 жол`, ru: `MPI_Cart_sub: 2 × ${cols} → 2 строки` });
      } else {
        for (let row = 0; row < 2; row++) {
          const first = points[row * cols], last = points[row * cols + cols - 1];
          const bend = row === 0 ? 44 : 286;
          wires.push({ d: `M ${last.x} ${last.y} Q 220 ${bend} ${first.x} ${first.y}`, dashed: true });
        }
        labels.push({ x: 220, y: 24, kk: `MPI_Cart_shift (+1): 2 × ${cols} (периодты)`, ru: `MPI_Cart_shift (+1): 2 × ${cols} (периодическая)` });
      }
    } else if (task === 92 && (k === 8 || k === 12)) {
      const zDim = k / 4;
      nodeR = zDim === 3 ? 18 : 21;
      const sliceW = zDim === 2 ? 150 : 112;
      const gap = zDim === 2 ? 56 : 26;
      const totalW = zDim * sliceW + (zDim - 1) * gap;
      const startX = (W - totalW) / 2;
      for (let z = 0; z < zDim; z++) {
        const sx0 = startX + z * (sliceW + gap);
        const sx1 = sx0 + sliceW;
        const sy0 = 96, sy1 = 228;
        labels.push({ x: (sx0 + sx1) / 2, y: 56, text: `z = ${z} (2×2)` });
        const sliceRanks = [];
        for (let ix = 0; ix < 2; ix++) {
          for (let iy = 0; iy < 2; iy++) {
            const r = ix * (2 * zDim) + iy * zDim + z;
            const x = sx0 + iy * (sx1 - sx0);
            const y = sy0 + ix * (sy1 - sy0);
            points[r] = { x, y, sub: `${ix},${iy},${z}` };
            sliceRanks.push(r);
          }
        }
        const [r00, r01, r10, r11] = sliceRanks;
        wires.push(
          { d: `M ${points[r00].x} ${points[r00].y} L ${points[r01].x} ${points[r01].y}` },
          { d: `M ${points[r10].x} ${points[r10].y} L ${points[r11].x} ${points[r11].y}` },
          { d: `M ${points[r00].x} ${points[r00].y} L ${points[r10].x} ${points[r10].y}` },
          { d: `M ${points[r01].x} ${points[r01].y} L ${points[r11].x} ${points[r11].y}` }
        );
      }
      labels.push({ x: 220, y: 24, kk: `2 × 2 × ${zDim} → ${zDim} қима матрица (MPI_Cart_sub)`, ru: `2 × 2 × ${zDim} → ${zDim} матрицы-среза (MPI_Cart_sub)` });
    } else if (task === 94) {
      const m = Math.max(1, Number(inputs?.m_0) || 2);
      const cols = Math.max(1, Number(inputs?.n_0) || 2);
      const total = Math.min(k, m * cols);
      const hasUnused = total < k;
      nodeR = Math.max(16, Math.min(21, Math.floor(96 / Math.max(m, cols))));
      placeGrid(m, cols, 85, 355, 68, hasUnused ? 225 : 265);
      if (cols > 1) {
        for (let row = 0; row < m; row++) {
          const first = points[row * cols], last = points[row * cols + cols - 1];
          wires.push({ d: `M ${last.x} ${last.y} Q 220 ${first.y - 28} ${first.x} ${first.y}`, dashed: true });
        }
      }
      if (hasUnused) {
        const rem = k - total;
        for (let i = 0; i < rem; i++) {
          const r = total + i;
          const x = rem === 1 ? 220 : 100 + (i * 240) / (rem - 1);
          points[r] = { x, y: 294, inactive: true, sub: 'NULL' };
        }
      }
      labels.push({ x: 220, y: 24, kk: `${m} × ${cols} тор (2-өлшем периодты)`, ru: `Решётка ${m} × ${cols} (периодическая по Y)` });
    } else if (task === 100 && [7, 10, 13].includes(k)) {
      const rays = (k - 1) / 3;
      const ruRays = rays === 1 ? 'луч' : rays < 5 ? 'луча' : 'лучей';
      nodeR = k === 13 ? 17 : 19;
      const cx = 220, cy = 170;
      points[0] = { x: cx, y: cy };
      for (let b = 0; b < rays; b++) {
        const baseAngle = -Math.PI / 2 + (2 * Math.PI * b) / rays;
        const spread = rays >= 4 ? 0.27 : 0.34;
        const rHub = 74, rOuter = 134;
        const pHub = { x: cx + rHub * Math.cos(baseAngle), y: cy + rHub * Math.sin(baseAngle) };
        const pA = { x: cx + rOuter * Math.cos(baseAngle - spread), y: cy + rOuter * Math.sin(baseAngle - spread) };
        const pB = { x: cx + rOuter * Math.cos(baseAngle + spread), y: cy + rOuter * Math.sin(baseAngle + spread) };
        const first = 1 + 3 * b;
        points[first] = pA;
        points[first + 1] = pB;
        points[first + 2] = pHub;
        wires.push(
          { d: `M ${cx} ${cy} L ${pHub.x} ${pHub.y}` },
          { d: `M ${pHub.x} ${pHub.y} L ${pA.x} ${pA.y}` },
          { d: `M ${pHub.x} ${pHub.y} L ${pB.x} ${pB.y}` },
          { d: `M ${pA.x} ${pA.y} L ${pB.x} ${pB.y}` }
        );
      }
      labels.push({ x: 220, y: 20, kk: `MPI_Graph_create: ${rays} сәуле (орталығы P0)`, ru: `MPI_Graph_create: ${rays} ${ruRays} (центр P0)` });
    } else {
      nodeR = k >= 10 ? 19 : 23;
      for (let r = 0; r < k; r++) {
        const angle = -Math.PI / 2 + (2 * Math.PI * r) / k;
        points[r] = { x: 220 + 145 * Math.cos(angle), y: 165 + 115 * Math.sin(angle) };
      }
    }
    return { points, wires, labels, nodeR };
  }

  function draw(animate) {
    const {k,steps,inputs}=snapshot, step=steps[cursor];
    const {points,wires,labels:topoLabels,nodeR}=buildTopologyGeometry(currentTask,k,inputs||{});
    const matches=(group,r)=>Array.isArray(group)?group.includes(r):group==='all'||group===r;
    const expand=group=>Array.isArray(group)?group:group==='all'?Array.from({length:k},(_,r)=>r):[group];
    const from=expand(step.from);
    const to=expand(step.to);
    const paths=[];for(const a of from)for(const b of to)if(a!==b&&points[a]&&points[b]){const p=points[a],q=points[b];paths.push(`M ${p.x} ${p.y} L ${q.x} ${q.y}`);}
    const packet=animate&&!reduced.matches?paths.map(d=>`<circle class="packet" r="4"><animateMotion dur="0.7s" path="${d}" fill="freeze"/></circle>`).join(''):'';
    const baseWires=wires.map(w=>`<path class="wire ${w.dashed?'wire-periodic':''}" d="${w.d}"/>`).join('');
    const headerLabels=topoLabels.map(l=>renderTopoLabel(l)).join('');
    const nodesSvg=points.map((p,r)=>`<g class="${p.inactive?'inactive-node ':''}${matches(step.to,r)?'receiver':matches(step.from,r)?'sender':''}"><circle class="node" cx="${p.x}" cy="${p.y}" r="${nodeR}"/><text x="${p.x}" y="${p.sub?p.y-3:p.y}">P${r}</text>${p.sub?`<text class="node-sub" x="${p.x}" y="${p.y+9}">${escape(p.sub)}</text>`:''}</g>`).join('');
    const svg=`<svg class="trace-diagram" viewBox="0 0 440 330" role="img" aria-label="MPIBegin${currentTask}: ${cursor+1}/${steps.length}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="17" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#3657f5"/></marker></defs>${headerLabels}${baseWires}${paths.map(d=>`<path class="active-wire" d="${d}" marker-end="url(#arrow)"/>`).join('')}${packet}${nodesSvg}</svg>`;
    $('#traceStage').innerHTML=`<div class="trace-layout">${svg}<div class="trace-detail">${pair(step.text)}<div class="trace-payload">${escape(step.payload)}</div></div></div>`;
    $('#traceCounter').innerHTML=bi(`${cursor+1} / ${steps.length} қадам`,`${cursor+1} / ${steps.length} шагов`);
    $('#tracePrev').disabled=cursor===0;$('#traceNext').disabled=cursor===steps.length-1;
    $('#tracePlay').innerHTML=timer?bi('Ⅱ Тоқтату','Ⅱ Пауза'):bi(cursor===steps.length-1?'↻ Қайта ойнату':'▶ Ойнату',cursor===steps.length-1?'↻ Повторить':'▶ Воспроизвести');
  }
  window.MpiLessonUI={
    setCalculateView(){stop();view='calculate';},
    reset(){stop();snapshot=null;cursor=0;error=false;progress();render();},
    success(){stop();const inputs={};dynamicFields.querySelectorAll('input,textarea,select').forEach(el=>inputs[el.id]=el.value);snapshot={k:clampK(),inputs,steps:window.MpiTrace(currentTask,clampK(),inputs)};cursor=0;error=false;progress();if(view==='steps')render();$('.result-panel').classList.remove('result-enter');void $('.result-panel').offsetWidth;$('.result-panel').classList.add('result-enter');},
    failure(){stop();snapshot=null;error=true;progress();if(view==='steps')render();}
  };
  form.addEventListener('input',()=>{window.MpiLessonUI.reset();resultContent.innerHTML=bi('Деректер өзгерді. Нәтижені қайта есептеңіз.','Данные изменились. Рассчитайте результат заново.','p').replace('<p ','<p class="result-placeholder" ');document.getElementById('copyResult')?.setAttribute('disabled','');document.getElementById('copyResult')?.classList.remove('ready');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(view==='steps'&&snapshot)draw(false);}});
  reduced.addEventListener('change',()=>{stop();if(view==='steps')renderSteps();});
  progress();render();
})();
