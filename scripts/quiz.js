(() => {
  const QUESTIONS = [
    // Module 1
    {
      m: 1,
      q: ['MPI_COMM_WORLD коммуникаторындағы негізгі (бас) процестің рангы қандай болады?', 'Какой ранг имеет главный процесс в коммуникаторе MPI_COMM_WORLD?'],
      opts: [
        ['0 (нөлінші ранг)', '0 (нулевой ранг)'],
        ['1 (бірінші ранг)', '1 (первый ранг)'],
        ['K − 1 (соңғы ранг)', 'K − 1 (последний ранг)'],
        ['MPI_ANY_SOURCE', 'MPI_ANY_SOURCE']
      ],
      ans: 0,
      exp: ['MPI стандартында K процестің рангтары әрқашан 0…K−1 аралығында нөмірленеді, ал негізгі процесс — P0.', 'В стандарте MPI ранги K процессов всегда нумеруются от 0 до K−1, а главным считается процесс P0.']
    },
    {
      m: 1,
      q: ['Коммуникатордағы барлық іске қосылған процестердің жалпы санын қай функция анықтайды?', 'Какая функция определяет общее количество процессов в коммуникаторе?'],
      opts: [
        ['MPI_Comm_rank', 'MPI_Comm_rank'],
        ['MPI_Comm_size', 'MPI_Comm_size'],
        ['MPI_Get_count', 'MPI_Get_count'],
        ['MPI_Init', 'MPI_Init']
      ],
      ans: 1,
      exp: ['MPI_Comm_size процестер санын (K), ал MPI_Comm_rank ағымдағы процестің өз нөмірін қайтарады.', 'MPI_Comm_size возвращает общее число процессов (K), а MPI_Comm_rank — номер текущего процесса.']
    },
    {
      m: 1,
      q: ['MPI бағдарламасының соңында MPI ортасын дұрыс аяқтау үшін қай функция міндетті түрде шақырылады?', 'Какая функция обязательно вызывается в конце программы для корректного завершения среды MPI?'],
      opts: [
        ['MPI_Abort', 'MPI_Abort'],
        ['MPI_Close', 'MPI_Close'],
        ['MPI_Finalize', 'MPI_Finalize'],
        ['MPI_Comm_free', 'MPI_Comm_free']
      ],
      ans: 2,
      exp: ['Барлық MPI шақырулары MPI_Init пен MPI_Finalize жұбының арасында орналасуы тиіс.', 'Все вызовы MPI должны располагаться строго между MPI_Init и MPI_Finalize.']
    },
    // Module 2
    {
      m: 2,
      q: ['Хабарды буферге көшірмей тұрып, оның тегі мен өлшемін алдын ала тексеруге қай функция мүмкіндік береді (MPIBegin29)?', 'Какая функция позволяет узнать тег и размер входящего сообщения ДО его фактического приёма (MPIBegin29)?'],
      opts: [
        ['MPI_Bsend', 'MPI_Bsend'],
        ['MPI_Probe', 'MPI_Probe'],
        ['MPI_Sendrecv', 'MPI_Sendrecv'],
        ['MPI_Buffer_attach', 'MPI_Buffer_attach']
      ],
      ans: 1,
      exp: ['MPI_Probe хабарды кезектен алмай MPI_Status құрылымын толтырады; содан соң MPI_Get_count арқылы элемент санын білуге болады.', 'MPI_Probe заполняет MPI_Status без извлечения сообщения из очереди, после чего через MPI_Get_count определяется его длина.']
    },
    {
      m: 2,
      q: ['Екі процестің бір-біріне бір уақытта дерек жібергенде тығырыққа (deadlock) тірелмеуін қай функция қамтамасыз етеді (MPIBegin24)?', 'Какая функция гарантирует обмен сообщениями между парой процессов без риска взаимной блокировки (deadlock) в MPIBegin24?'],
      opts: [
        ['Екі рет MPI_Send шақыру', 'Два вызова MPI_Send подряд'],
        ['MPI_Sendrecv', 'MPI_Sendrecv'],
        ['MPI_Probe', 'MPI_Probe'],
        ['MPI_Buffer_detach', 'MPI_Buffer_detach']
      ],
      ans: 1,
      exp: ['MPI_Sendrecv жіберу мен қабылдауды бір операцияда біріктіріп, буферлеу мен реттілікті MPI кітапханасына тапсырады.', 'MPI_Sendrecv объединяет отправку и приём в одной операции и исключает взаимную блокировку процессов.']
    },
    {
      m: 2,
      q: ['MPI_Bsend буферленген жіберу функциясын қолдану үшін алдын ала не істеу қажет (MPIBegin10)?', 'Что необходимо сделать перед вызовом буферизованной отправки MPI_Bsend (MPIBegin10)?'],
      opts: [
        ['MPI_Buffer_attach арқылы MPI_BSEND_OVERHEAD қосылған жад буферін тіркеу', 'Присоединить буфер через MPI_Buffer_attach с запасом MPI_BSEND_OVERHEAD'],
        ['MPI_Barrier шақыру', 'Вызвать MPI_Barrier'],
        ['MPI_Comm_split шақыру', 'Вызвать MPI_Comm_split'],
        ['MPI_Type_commit шақыру', 'Вызвать MPI_Type_commit']
      ],
      ans: 0,
      exp: ['MPI_Bsend пайдаланушы тіркеген буферді қолданады; оның көлемі дерек өлшеміне MPI_BSEND_OVERHEAD қосылған мәннен кем болмауы керек.', 'MPI_Bsend использует буфер пользователя, прикреплённый через MPI_Buffer_attach (размер данных + MPI_BSEND_OVERHEAD).']
    },
    // Module 3
    {
      m: 3,
      q: ['MPI_Reduce пен MPI_Scan (MPIBegin48 vs MPIBegin57) арасындағы басты айырмашылық неде?', 'В чём ключевое отличие MPI_Scan от MPI_Reduce (MPIBegin57 vs MPIBegin48)?'],
      opts: [
        ['MPI_Scan тек нақты сандармен жұмыс істейді', 'MPI_Scan работает только с вещественными числами'],
        ['MPI_Scan әр R процесіне тек 0…R рангтарының префикстік редукциясын береді', 'MPI_Scan выдаёт каждому процессу ранга R частичную (префиксную) редукцию рангов 0…R'],
        ['MPI_Scan нәтижені тек P0-ге жинайды', 'MPI_Scan собирает результат только в P0'],
        ['Айырмашылығы жоқ', 'Отличий нет']
      ],
      ans: 1,
      exp: ['MPI_Reduce барлық 0…K−1 процестер бойынша жалпы нәтижені root процесіне жинаса, MPI_Scan әр R рангына 0…R префикстік нәтижесін есептейді.', 'MPI_Reduce собирает общую редукцию по всем рангам в root, тогда как MPI_Scan вычисляет в каждом ранге R префиксную редукцию по рангам 0…R.']
    },
    {
      m: 3,
      q: ['int–double–int сияқты әртекті құрылымнан туынды тип жасаған соң (MPI_Type_create_struct), оны жіберуде қолданар алдында не шақырылады?', 'Что нужно вызвать после создания производного типа через MPI_Type_create_struct перед его передачей в сообщениях?'],
      opts: [
        ['MPI_Type_free', 'MPI_Type_free'],
        ['MPI_Type_commit', 'MPI_Type_commit'],
        ['MPI_Pack_size', 'MPI_Pack_size'],
        ['MPI_Unpack', 'MPI_Unpack']
      ],
      ans: 1,
      exp: ['Кез келген жаңа туынды MPI_Datatype коммуникацияда қолданылмас бұрын MPI_Type_commit арқылы тіркелуі тиіс.', 'Любой созданный производный тип MPI_Datatype перед использованием в пересылках обязательно фиксируется вызовом MPI_Type_commit.']
    },
    {
      m: 3,
      q: ['MPI_Pack арқылы оралған буферді ұжымдық операциямен жібергенде қандай MPI дерек типі көрсетіледі (MPIBegin67)?', 'Какой тип данных указывается при пересылке буфера, упакованного функцией MPI_Pack (MPIBegin67)?'],
      opts: [
        ['MPI_CHAR', 'MPI_CHAR'],
        ['MPI_DOUBLE', 'MPI_DOUBLE'],
        ['MPI_PACKED', 'MPI_PACKED'],
        ['MPI_STRUCT', 'MPI_STRUCT']
      ],
      ans: 2,
      exp: ['MPI_Pack және MPI_Unpack функцияларымен жұмыс істегенде хабар типі ретінде арнайы MPI_PACKED типі беріледі.', 'Для данных, упакованных через MPI_Pack и распаковываемых через MPI_Unpack, используется специальный тип MPI_PACKED.']
    },
    // Module 4
    {
      m: 4,
      q: ['MPI_Scatterv функциясының кәдімгі MPI_Scatter-ден артықшылығы қандай (MPIBegin37)?', 'В чём преимущество MPI_Scatterv перед обычным MPI_Scatter (MPIBegin37)?'],
      opts: [
        ['Әр процеске әртүрлі блок өлшемін (sendcounts) және буфердегі еркін ығысуды (displs) беруге болады', 'Позволяет задать индивидуальные длины блоков (sendcounts) и произвольные смещения (displs) для каждого ранга'],
        ['Тек бүтін сандарды ғана жібереді', 'Пересылает только целые числа'],
        ['Барлық процестен барлығына жібереді', 'Пересылает данные от всех процессов всем'],
        ['Жаңа коммуникатор құрады', 'Создаёт новый коммуникатор']
      ],
      ans: 0,
      exp: ['displs массиві арқылы MPIBegin37 есебінде элементтер бастапқы ретін өзгертпей-ақ рангтардың кему ретімен (K−1…0) үлестіріледі.', 'Благодаря массиву смещений displs в MPIBegin37 числа рассылаются в обратном порядке рангов без перестановки исходного массива.']
    },
    {
      m: 4,
      q: ['MPI_Comm_split шақырғанда белгілі бір процесті жаңа коммуникаторға мүлде қоспау үшін color параметріне не беріледі (MPIBegin77, 79)?', 'Какое значение параметра color передаётся в MPI_Comm_split, чтобы процесс не вошёл ни в одну новую группу (MPIBegin77, 79)?'],
      opts: [
        ['0', '0'],
        ['-1', '-1'],
        ['MPI_UNDEFINED', 'MPI_UNDEFINED'],
        ['MPI_COMM_NULL', 'MPI_COMM_NULL']
      ],
      ans: 2,
      exp: ['color = MPI_UNDEFINED берілген процестер үшін MPI_Comm_split нәтиже ретінде MPI_COMM_NULL қайтарады.', 'При color = MPI_UNDEFINED функция MPI_Comm_split возвращает для этого процесса дескриптор MPI_COMM_NULL.']
    },
    {
      m: 4,
      q: ['Әр процестегі бір санды жинап, нәтижелік массивті бірден БАРЛЫҚ процеске тарататын функция қайсы (MPIBegin40, 80)?', 'Какая функция собирает по элементу от каждого процесса и сразу предоставляет собранный массив ВСЕМ процессам коммуникатора (MPIBegin40, 80)?'],
      opts: [
        ['MPI_Gather', 'MPI_Gather'],
        ['MPI_Bcast', 'MPI_Bcast'],
        ['MPI_Allgather', 'MPI_Allgather'],
        ['MPI_Scatter', 'MPI_Scatter']
      ],
      ans: 2,
      exp: ['MPI_Allgather логикалық тұрғыдан MPI_Gather + MPI_Bcast комбинациясына тең: жиналған массив барлық процесте болады.', 'MPI_Allgather эквивалентна сборке MPI_Gather с последующей рассылкой результата всем процессам коммуникатора.']
    },
    // Module 5
    {
      m: 5,
      q: ['Декарттық торды төменгі өлшемді ішкі торларға (мысалы, жолдарға немесе 2×2 матрицаларға) қай функция бөледі (MPIBegin85, 92)?', 'Какая функция расщепляет декартову решётку на подрешётки меньшей размерности — строки или матрицы 2×2 (MPIBegin85, 92)?'],
      opts: [
        ['MPI_Cart_sub', 'MPI_Cart_sub'],
        ['MPI_Cart_shift', 'MPI_Cart_shift'],
        ['MPI_Cart_coords', 'MPI_Cart_coords'],
        ['MPI_Graph_create', 'MPI_Graph_create']
      ],
      ans: 0,
      exp: ['MPI_Cart_sub функциясына remain_dims массиві (1 — қалдыру, 0 — бекіту) беріліп, әр қима үшін жеке коммуникатор алынады.', 'В MPI_Cart_sub передаётся массив remain_dims (1 — сохранить измерение, 0 — зафиксировать), что создаёт коммуникаторы строк или срезов.']
    },
    {
      m: 5,
      q: ['Жол ішінде +1 қадаммен циклдік жылжу жасау үшін көрші жіберуші мен қабылдаушы рангтарды қай функция есептеп береді (MPIBegin96)?', 'Какая функция определяет ранги источника и получателя для сдвига вдоль измерения декартовой решётки (MPIBegin96)?'],
      opts: [
        ['MPI_Cart_rank', 'MPI_Cart_rank'],
        ['MPI_Cart_shift', 'MPI_Cart_shift'],
        ['MPI_Graph_neighbors', 'MPI_Graph_neighbors'],
        ['MPI_Comm_rank', 'MPI_Comm_rank']
      ],
      ans: 1,
      exp: ['MPI_Cart_shift(cart, direction, disp, &source, &dest) көрсетілген бағыт пен қадам бойынша дайын source пен dest рангтарын қайтарады.', 'MPI_Cart_shift возвращает готовые ранги source и dest для последующего вызова MPI_Sendrecv.']
    },
    {
      m: 5,
      q: ['MPI_Graph_create функциясындағы index және edges массивтері нені сипаттайды (MPIBegin100)?', 'Что задают массивы index и edges в функции MPI_Graph_create (MPIBegin100)?'],
      opts: [
        ['Процестердің 2D координаттарын', 'Двумерные координаты процессов'],
        ['Әр төбенің көршілер санының жиынтық (кумулятивті) дәрежесін және барлық көрші рангтар тізімін', 'Накопленные степени вершин (число соседей) и объединённый список рёбер-соседей'],
        ['Хабарлардың тегтері мен ұзындықтарын', 'Теги и длины сообщений'],
        ['Тек P0 процесінің көршілерін', 'Только соседей главного процесса P0']
      ],
      ans: 1,
      exp: ['index[i] — 0…i процестерінің жалпы көршілер санының қосындысы, ал edges — сәйкес көрші рангтар тізімі.', 'index[i] хранит суммарное число соседей вершин 0…i, а массив edges подряд перечисляет ранги этих соседей.']
    }
  ];

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bi = (kk, ru, tag = 'span') => {
    const active = document.documentElement.lang === 'ru' ? ru : kk;
    return `<${tag} data-kk="${esc(kk)}" data-ru="${esc(ru)}">${esc(active)}</${tag}>`;
  };

  const root = document.getElementById('mpiQuizRoot');
  if (!root) return;

  let activeMod = 0; // 0 = all 15 questions, 1..5 = module filter
  let answers = {};  // key: globalIndex -> chosenOptionIndex

  function filteredList() {
    return QUESTIONS.map((item, idx) => ({ ...item, idx })).filter(item => activeMod === 0 || item.m === activeMod);
  }

  function renderQuiz() {
    const list = filteredList();
    const answeredCount = list.filter(it => it.idx in answers).length;
    const correctCount = list.filter(it => answers[it.idx] === it.ans).length;
    const pct = list.length ? Math.round((correctCount / list.length) * 100) : 0;

    const filterBtns = [
      { m: 0, kk: `Барлығы (${QUESTIONS.length})`, ru: `Все (${QUESTIONS.length})` },
      { m: 1, kk: 'Модуль 1', ru: 'Модуль 1' },
      { m: 2, kk: 'Модуль 2', ru: 'Модуль 2' },
      { m: 3, kk: 'Модуль 3', ru: 'Модуль 3' },
      { m: 4, kk: 'Модуль 4', ru: 'Модуль 4' },
      { m: 5, kk: 'Модуль 5', ru: 'Модуль 5' }
    ].map(f => `<button type="button" class="quiz-filter-btn ${activeMod === f.m ? 'active' : ''}" data-qmod="${f.m}" data-kk="${esc(f.kk)}" data-ru="${esc(f.ru)}">${esc(document.documentElement.lang === 'ru' ? f.ru : f.kk)}</button>`).join('');

    const cardsHtml = list.map((item, pos) => {
      const chosen = answers[item.idx];
      const hasAns = chosen !== undefined;
      const isOk = hasAns && chosen === item.ans;
      const optsHtml = item.opts.map((opt, oi) => {
        let cls = 'quiz-opt';
        if (hasAns) {
          if (oi === item.ans) cls += ' correct';
          else if (oi === chosen) cls += ' wrong';
        }
        return `<button type="button" class="${cls}" data-qidx="${item.idx}" data-opt="${oi}" ${hasAns ? 'disabled' : ''}><span class="q-letter">${String.fromCharCode(65 + oi)}</span>${bi(opt[0], opt[1])}</button>`;
      }).join('');

      const expHtml = hasAns
        ? `<div class="quiz-exp ${isOk ? 'ok' : 'bad'}"><strong>${isOk ? bi('✓ Дұрыс!', '✓ Верно!') : bi('✕ Қате.', '✕ Неверно.')}</strong> ${bi(item.exp[0], item.exp[1])}</div>`
        : '';

      return `<article class="quiz-card"><div class="qc-top"><span class="hm-badge">M${item.m}</span><span class="qc-num">#${pos + 1}</span></div><h4>${bi(item.q[0], item.q[1])}</h4><div class="quiz-opts">${optsHtml}</div>${expHtml}</article>`;
    }).join('');

    root.innerHTML = `
      <div class="panel-title quiz-header-row">
        <div>
          <p class="eyebrow" data-kk="Өзін-өзі тексеру · Қорғауға дайындық" data-ru="Самопроверка · Подготовка к защите">${document.documentElement.lang === 'ru' ? 'Самопроверка · Подготовка к защите' : 'Өзін-өзі тексеру · Қорғауға дайындық'}</p>
          <h2 data-kk="MPI бойынша интерактивті тест" data-ru="Интерактивный тест по MPI">${document.documentElement.lang === 'ru' ? 'Интерактивный тест по MPI' : 'MPI бойынша интерактивті тест'}</h2>
        </div>
        <div class="quiz-score-box">
          <span>${bi(`Ұпай: ${correctCount} / ${list.length} (${pct}%) · Жауап берілді: ${answeredCount}`, `Баллы: ${correctCount} / ${list.length} (${pct}%) · Отвечено: ${answeredCount}`)}</span>
          <button type="button" class="button ghost quiz-reset-btn" id="resetQuizBtn" data-kk="Қайта бастау" data-ru="Сбросить тест">${document.documentElement.lang === 'ru' ? 'Сбросить тест' : 'Қайта бастау'}</button>
        </div>
      </div>
      <div class="quiz-filters" role="tablist">${filterBtns}</div>
      <div class="quiz-list">${cardsHtml}</div>
    `;

    root.querySelectorAll('.quiz-filter-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        activeMod = Number(btn.dataset.qmod);
        renderQuiz();
      })
    );
    root.querySelectorAll('.quiz-opt').forEach(btn =>
      btn.addEventListener('click', () => {
        const qIdx = Number(btn.dataset.qidx);
        const opt = Number(btn.dataset.opt);
        if (!(qIdx in answers)) {
          answers[qIdx] = opt;
          renderQuiz();
        }
      })
    );
    root.querySelector('#resetQuizBtn')?.addEventListener('click', () => {
      if (activeMod === 0) answers = {};
      else for (const it of list) delete answers[it.idx];
      renderQuiz();
    });
  }

  renderQuiz();
})();
