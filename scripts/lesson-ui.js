(() => {
  const $ = selector => document.querySelector(selector);
  const escape = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bi = (kk,ru,tag='span') => `<${tag} data-kk="${escape(kk)}" data-ru="${escape(ru)}">${escape(kk)}</${tag}>`;
  const pair = (texts,tag='p') => bi(texts[0],texts[1],tag);
  const shell=$('.calculator-shell'), panel=$('#lessonPanel'), tabs=$('#lessonTabs');
  const labels={condition:['Шарты','Условие'],calculate:['Есептеу','Расчёт'],steps:['Қадамдар','Шаги'],code:['C++ коды','Код C++']};
  let view='calculate', snapshot=null, cursor=0, timer=null, error=false;
  let completed={}, canSave=true;
  try {const data=JSON.parse(localStorage.getItem('mpi-completed-v1')||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))completed=data;} catch {canSave=false;}
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const stop=()=>{if(timer)clearInterval(timer);timer=null;};
  function progress() {
    const ids=Object.keys(window.MpiLessons.tasks), count=ids.filter(id=>completed[id]===true).length;
    $('#learningProgress').innerHTML=`<div class="progress-count">${bi(`Орындалды: ${count} / ${ids.length}`,`Выполнено: ${count} / ${ids.length}`)}<progress value="${count}" max="${ids.length}" aria-label="${count} / ${ids.length}"></progress></div><button type="button" class="completion-button" id="markComplete" aria-pressed="${!!completed[currentTask]}" ${!snapshot&&!completed[currentTask]?'disabled':''}>${completed[currentTask]?bi('✓ Орындалды · белгіні алу','✓ Выполнено · снять отметку'):bi('Орындалды деп белгілеу','Отметить выполненной')}</button>${!canSave?bi('Белгілер тек осы сессияда сақталады.','Отметки сохраняются только в этой сессии.'):''}`;
    $('#markComplete').addEventListener('click',()=>{completed[currentTask]=!completed[currentTask];try{localStorage.setItem('mpi-completed-v1',JSON.stringify(completed));}catch{canSave=false;}progress();});
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
      panel.innerHTML=`<p class="lesson-lead">${pair(window.MpiLessons.modules[currentModule],'span')}</p><div class="condition-grid"><section>${bi('Берілгені','Дано','h3')}${pair(lesson.given)}</section><section>${bi('Орындау керек','Требуется','h3')}${pair(lesson.find)}</section></div><div class="lesson-example">${fileExample?bi('Берілген файлдағы мысал','Пример из предоставленного файла','h3'):bi('Түсіндіру мысалы','Пример для пояснения','h3')}${fileExample?`<p>${escape(fileExample)}</p>`:pair(lesson.example)}</div><div class="lesson-source"><span class="api-label">${escape(lesson.api)}</span><a href="downloads/praktikum.pdf#page=${lesson.page}" target="_blank" rel="noopener">${bi(`Кітап · ${lesson.page}-бет ↗`,`Книга · страница ${lesson.page} ↗`)}</a></div>${bi('Шарт кітап негізінде қайта баяндалған. Браузер MPI шақыруларын орындамай, олардың нәтижесін модельдейді.','Условие пересказано по книге. Браузер моделирует результат, не выполняя вызовы MPI.','p')}`;
    }
    if(view==='code') {
      const mpi=currentModule>1;
      const path=mpi?`downloads/code/module-${currentModule}/MPIBegin${currentTask}.cpp`:`downloads/code/MPIBegin${currentTask}.cpp`;
      panel.innerHTML=`<div class="code-heading"><div><p class="eyebrow">${mpi?'Microsoft MPI · C++17':'C++17'}</p><h3>MPIBegin${currentTask}.cpp</h3></div><div class="code-actions"><a class="button ghost" href="${path}" download>${bi('Кодты жүктеу','Скачать код')}</a>${mpi?`<a class="button ghost" href="downloads/module-${currentModule}-variant-11.zip" download>${bi('Толық модуль ZIP','Весь модуль ZIP')}</a>`:''}</div></div><p class="lesson-lead">${mpi?bi('Бұл — сіз берген қалтадағы нақты MPI коды. Жинақта EXE файлдары, ортақ console_mpi.hpp, build.cmd және іске қосу нұсқаулығы бар. Іске қосу үшін Microsoft MPI Runtime, ал қайта құрастыру үшін SDK мен C++17 компиляторы қажет.','Это реальный MPI код из предоставленной папки. В архиве есть EXE, общий console_mpi.hpp, build.cmd и инструкция. Для запуска нужен Microsoft MPI Runtime, для пересборки — SDK и компилятор C++17.'):bi('Windows үшін MPI-сіз C++ оқу үлгісі. VS Code — редактор; іске қосу үшін C++ компиляторы керек.','Учебный пример C++ без MPI для Windows. VS Code — редактор; для запуска нужен компилятор C++.')}</p><pre class="code-view"><code id="sourceCode"></code></pre>`;
      $('#sourceCode').textContent=window.MpiSourceCode[currentTask];
    }
    if(view==='steps') renderSteps();
  }
  function renderSteps() {
    if(!snapshot) {
      panel.innerHTML=`<div class="lesson-empty">${bi('Өз сандарыңызбен қадамдап қараңыз','Разберите шаги на своих данных','h3')}${bi(error?'Алдымен «Есептеу» бөліміндегі деректер қатесін түзетіңіз.':'Енгізілген деректер бойынша есептеп, процестердің әрекетін көрсетеміз.',error?'Сначала исправьте ошибку данных в разделе «Расчёт».':'Рассчитаем результат и покажем действия процессов для введённых данных.','p')}<button class="button primary" id="traceCalculate" type="button">${bi(error?'Деректерге оралу':'Есептеу және көрсету',error?'Вернуться к данным':'Рассчитать и показать')}</button></div>`;
      $('#traceCalculate').addEventListener('click',()=>{if(error)setView('calculate');else if(form.reportValidity())form.requestSubmit();else setView('calculate');});return;
    }
    panel.innerHTML=`<h3>${bi('Деректер қалай өңделеді?','Как обрабатываются данные?')}</h3><div id="traceStage"></div><div class="trace-controls"><button type="button" id="tracePrev">${bi('← Артқа','← Назад')}</button><button type="button" class="primary" id="tracePlay">${bi('▶ Ойнату','▶ Воспроизвести')}</button><button type="button" id="traceNext">${bi('Келесі →','Далее →')}</button><output id="traceCounter" aria-live="polite"></output></div>${bi('Сызба операцияның логикасын көрсетеді. Бұл MPI кітапханасының нақты жіберу реті немесе жылдамдығы емес.','Схема показывает логику операции, а не фактический порядок сообщений или скорость библиотеки MPI.','p')}`;
    panel.lastElementChild.className='trace-footnote';
    $('#tracePrev').addEventListener('click',()=>{stop();cursor=Math.max(0,cursor-1);draw(false);});
    $('#traceNext').addEventListener('click',()=>{stop();cursor=Math.min(snapshot.steps.length-1,cursor+1);draw(true);});
    $('#tracePlay').hidden=reduced.matches;
    $('#tracePlay').addEventListener('click',()=>{if(timer){stop();draw(false);return;}if(cursor===snapshot.steps.length-1)cursor=0;timer=setInterval(()=>{if(cursor>=snapshot.steps.length-1){stop();draw(false);}else{cursor++;draw(true);}},1900);draw(true);});
    draw(false);
  }
  function draw(animate) {
    const {k,steps}=snapshot, step=steps[cursor];
    const points=Array.from({length:k},(_,r)=>{const angle=-Math.PI/2+2*Math.PI*r/k;return {x:220+145*Math.cos(angle),y:165+115*Math.sin(angle)};});
    const matches=(group,r)=>group==='all'||group===r;
    const from=step.from==='all'?Array.from({length:k},(_,r)=>r):[step.from];
    const to=step.to==='all'?Array.from({length:k},(_,r)=>r):[step.to];
    const paths=[];for(const a of from)for(const b of to)if(a!==b){const p=points[a],q=points[b];paths.push(`M ${p.x} ${p.y} L ${q.x} ${q.y}`);}
    const packet=animate&&!reduced.matches?paths.map(d=>`<circle class="packet" r="4"><animateMotion dur="0.7s" path="${d}" fill="freeze"/></circle>`).join(''):'';
    const svg=`<svg class="trace-diagram" viewBox="0 0 440 330" role="img" aria-label="MPIBegin${currentTask}: ${cursor+1}/${steps.length}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#3657f5"/></marker></defs>${paths.map(d=>`<path class="active-wire" d="${d}" marker-end="url(#arrow)"/>`).join('')}${packet}${points.map((p,r)=>`<g class="${matches(step.to,r)?'receiver':matches(step.from,r)?'sender':''}"><circle class="node" cx="${p.x}" cy="${p.y}" r="24"/><text x="${p.x}" y="${p.y}">P${r}</text></g>`).join('')}</svg>`;
    $('#traceStage').innerHTML=`<div class="trace-layout">${svg}<div class="trace-detail">${pair(step.text)}<div class="trace-payload">${escape(step.payload)}</div></div></div>`;
    $('#traceCounter').innerHTML=bi(`${cursor+1} / ${steps.length} қадам`,`${cursor+1} / ${steps.length} шагов`);
    $('#tracePrev').disabled=cursor===0;$('#traceNext').disabled=cursor===steps.length-1;
    $('#tracePlay').innerHTML=timer?bi('Ⅱ Тоқтату','Ⅱ Пауза'):bi(cursor===steps.length-1?'↻ Қайта ойнату':'▶ Ойнату',cursor===steps.length-1?'↻ Повторить':'▶ Воспроизвести');
  }
  window.MpiLessonUI={
    reset(){stop();snapshot=null;cursor=0;error=false;progress();render();},
    success(){stop();const inputs={};dynamicFields.querySelectorAll('input,textarea,select').forEach(el=>inputs[el.id]=el.value);snapshot={k:clampK(),steps:window.MpiTrace(currentTask,clampK(),inputs)};cursor=0;error=false;progress();if(view==='steps')render();$('.result-panel').classList.remove('result-enter');void $('.result-panel').offsetWidth;$('.result-panel').classList.add('result-enter');},
    failure(){stop();snapshot=null;error=true;progress();if(view==='steps')render();}
  };
  form.addEventListener('input',()=>{window.MpiLessonUI.reset();resultContent.innerHTML=bi('Деректер өзгерді. Нәтижені қайта есептеңіз.','Данные изменились. Рассчитайте результат заново.','p');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(view==='steps'&&snapshot)draw(false);}});
  reduced.addEventListener('change',()=>{stop();if(view==='steps')renderSteps();});
  progress();render();
})();
