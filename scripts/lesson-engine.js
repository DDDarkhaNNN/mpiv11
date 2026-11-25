/* Pure, deterministic learning trace. Arrows explain logical data flow,
   not the implementation or timing of an MPI library. */
window.MpiTrace = function(id, k, inputs) {
  const n = key => Number(inputs[key]);
  const list = r => inputs['set_'+r].trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  const f = x => { const v = Object.is(x, -0) ? 0 : x; return Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(8))); };
  const show = xs => xs.map(f).join(', ');
  const steps = [];
  const add = (from,to,payload,kk,ru) => steps.push({from,to,payload:String(payload),text:[kk,ru]});
  const triple = r => [n('x_'+r),n('y_'+r),n('z_'+r)];
  if(id===3) for(let r=0;r<k;r++) add(r,r,f(n('v_'+r)*2),`P${r}: ${f(n('v_'+r))} × 2 = ${f(n('v_'+r)*2)}. Есептеу осы процесте орындалады.`,`P${r}: ${f(n('v_'+r))} × 2 = ${f(n('v_'+r)*2)}. Вычисление выполняется локально.`);
  if(id===5) for(let r=0;r<k;r++) {
    const xs=list(r), sum=xs.reduce((a,b)=>a+b,0), out=r%2?sum/xs.length:sum;
    add(r,r,f(out),`P${r}: (${xs.map(f).join(' + ')})${r%2?' / '+xs.length:''} = ${f(out)}.`,`P${r}: (${xs.map(f).join(' + ')})${r%2?' / '+xs.length:''} = ${f(out)}.`);
  }
  if([10,29].includes(id)) for(let r=1;r<k;r++) {
    const xs=list(r), tag=id===29?` · T=${n('t_'+r)}`:'';
    add(r,0,show(xs),`P${r} → P0: [${show(xs)}], N=${xs.length}${tag}. P0 жиынды ранг ретімен сақтайды.`,`P${r} → P0: [${show(xs)}], N=${xs.length}${tag}. P0 сохраняет набор по порядку рангов.`);
  }
  if(id===11) for(let r=1;r<k;r++) add(0,r,f(n('v_'+r)),`P0 → P${r}: ${f(n('v_'+r))}. P${r} алған санын шығарады.`,`P0 → P${r}: ${f(n('v_'+r))}. P${r} выводит полученное число.`);
  if(id===16) {
    let sum=0;
    for(let r=1;r<k;r++) {const x=n('v_'+r); if(x>0){sum+=x; add(r,0,f(x),`P${r}: ${x}>0 → P0. Ағымдағы қосынды: ${sum}.`,`P${r}: ${x}>0 → P0. Текущая сумма: ${sum}.`);} else add(r,r,f(x),`P${r}: ${x}≤0, бұл сан жіберілмейді.`,`P${r}: ${x}≤0, это число не отправляется.`);}
  }
  if([18,21,24].includes(id)) for(let r=0;r<k;r++) {
    const dest=id===18?(r+1)%k:id===21?n('n_'+r):(r%2?r-1:r+1);
    const payload=id===24?show(list(r)):f(n((id===21?'a_':'v_')+r));
    add(r,dest,payload,`P${r} → P${dest}: ${payload}. Қабылдаушы — P${dest}, дереккөзі — P${r}.`,`P${r} → P${dest}: ${payload}. Получатель — P${dest}, источник — P${r}.`);
  }
  if(id===26) for(let order=1;order<k;order++) {
    const r=Array.from({length:k-1},(_,i)=>i+1).find(r=>n('n_'+r)===order);
    add(r,0,f(n('a_'+r)),`P${r} → P0: A=${f(n('a_'+r))}, тег N=${order}. Нәтижедегі орны: ${order}.`,`P${r} → P0: A=${f(n('a_'+r))}, тег N=${order}. Позиция в результате: ${order}.`);
  }
  if(id===30) {
    const workers=Array.from({length:k-1},(_,i)=>i+1), v=f(n('v_0'));
    add(0,workers,v,`MPI_Bcast: P0 → ${workers.map(r=>'P'+r).join(', ')} мәні ${v} таратылады.`,`MPI_Bcast: P0 → ${workers.map(r=>'P'+r).join(', ')} рассылается число ${v}.`);
  }
  if(id===34) for(let r=0;r<k;r++) {
    const xs=list(r);
    add(r,0,show(xs),`MPI_Gatherv: P${r} (${xs.length} сан) → P0: [${show(xs)}].`,`MPI_Gatherv: P${r} (${xs.length} чис.) → P0: [${show(xs)}].`);
  }
  if(id===37) {
    const xs=list(0);
    for(let i=0;i<k;i++) {
      const dest=k-1-i;
      add(0,dest,f(xs[i]),`MPI_Scatterv: P0 жиынының ${i+1}-саны (${f(xs[i])}) → P${dest}.`,`MPI_Scatterv: ${i+1}-е число набора P0 (${f(xs[i])}) → P${dest}.`);
    }
  }
  if(id===40) for(let r=0;r<k;r++) {
    const v=f(n('v_'+r));
    add(r,'all',v,`MPI_Allgather: P${r} саны (${v}) барлық процестерге таратылады.`,`MPI_Allgather: число P${r} (${v}) передаётся всем процессам.`);
  }
  if(id===43) {
    const sets=Array.from({length:k},(_,r)=>list(r));
    for(let dest=0;dest<k;dest++) {
      const col=sets.map(s=>s[dest]);
      add('all',dest,show(col),`MPI_Alltoall: әр жиынның ${dest+1}-саны → P${dest}: [${show(col)}].`,`MPI_Alltoall: ${dest+1}-е числа всех наборов → P${dest}: [${show(col)}].`);
    }
  }
  if(id===45) {
    const sets=Array.from({length:k},(_,r)=>list(r));
    for(let dest=0;dest<k;dest++) {
      const start=dest*(dest+1)/2, len=dest+1;
      const chunks=sets.flatMap(s=>s.slice(start,start+len));
      add('all',dest,show(chunks),`MPI_Alltoallv: әр процестен ${len} саннан → P${dest}: [${show(chunks)}].`,`MPI_Alltoallv: по ${len} чис. от каждого процесса → P${dest}: [${show(chunks)}].`);
    }
  }
  if([48,51,54,57].includes(id)) {
    const sets=Array.from({length:k},(_,r)=>list(r));
    if(id===57) {
      let prefix=[...sets[0]];
      for(let r=0;r<k;r++) {prefix=prefix.map((x,i)=>Math.max(x,sets[r][i]));add(r===0?0:r-1,r,show(prefix),`P${r}: P0…P${r} позициялық максимумдары = [${show(prefix)}].`,`P${r}: максимумы по позициям P0…P${r} = [${show(prefix)}].`);}
    } else {
      const out=sets[0].map((_,i)=>id===48?sets.reduce((a,s)=>a+s[i],0):id===51?sets.reduce((a,s)=>a*s[i],1):Math.max(...sets.map(s=>s[i])));
      for(let i=0;i<out.length;i++) {
        const formula=id===54?`max(${show(sets.map(s=>s[i]))})`:sets.map(s=>f(s[i])).join(id===48?' + ':' × ');
        add('all',id===48?0:id===54?Math.floor(i/2):'all',f(out[i]),`${i+1}-позиция: ${formula} = ${f(out[i])}.`, `Позиция ${i+1}: ${formula} = ${f(out[i])}.`);
      }
    }
  }
  if([59,62,67].includes(id)) for(let r=1;r<k;r++) {
    const payload=show(id===59?list(r):triple(r));
    add(0,r,payload,`P0 → P${r}: [${payload}]. ${id===67?'Үштік оралады, жіберіледі, содан кейін ашылады.':'Үштіктегі сандардың реті сақталады.'}`,`P0 → P${r}: [${payload}]. ${id===67?'Тройка упаковывается, передаётся и распаковывается.':'Порядок чисел в тройке сохраняется.'}`);
  }
  if(id===64) for(let r=0;r<k;r++) add(r,'all',show(triple(r)),`P${r}: [${show(triple(r))}] барлық процеске беріледі. Үштіктер P0…P${k-1} ретімен орналасады.`,`P${r}: [${show(triple(r))}] передаётся всем процессам. Тройки располагаются в порядке P0…P${k-1}.`);
  if(id===69) for(let r=1;r<k;r++) add(r,0,show(triple(r)),`P${r} → P0: [${show(triple(r))}]. Оралған үштік ашылып, ранг ретімен сақталады.`,`P${r} → P0: [${show(triple(r))}]. Упакованная тройка распаковывается и сохраняется по порядку рангов.`);
  if(id===71) {
    const evens=Array.from({length:Math.floor((k+1)/2)},(_,i)=>2*i), xs=list(0);
    add(evens,evens,evens.map(r=>'P'+r).join(', '),`MPI_Group_incl + MPI_Comm_create: жұп рангтар тобы құрылды (${evens.map(r=>'P'+r).join(', ')}).`,`MPI_Group_incl + MPI_Comm_create: создан коммуникатор чётных рангов (${evens.map(r=>'P'+r).join(', ')}).`);
    evens.forEach((dest,i)=>add(0,dest,f(xs[i]),`MPI_Scatter (evenComm): P0 → P${dest}: ${f(xs[i])}.`,`MPI_Scatter (evenComm): P0 → P${dest}: ${f(xs[i])}.`));
  }
  if(id===75) {
    const evens=[], odds=[];
    for(let r=0;r<k;r++) (r%2===0?evens:odds).push(r);
    const maxEven=Math.max(...evens.map(r=>n('v_'+r))), minOdd=Math.min(...odds.map(r=>n('v_'+r)));
    add(evens,0,f(maxEven),`Жұп рангтар (${evens.map(r=>'P'+r).join(', ')}): MPI_MAX = ${f(maxEven)} → P0.`,`Чётные ранги (${evens.map(r=>'P'+r).join(', ')}): MPI_MAX = ${f(maxEven)} → P0.`);
    add(odds,1,f(minOdd),`Тақ рангтар (${odds.map(r=>'P'+r).join(', ')}): MPI_MIN = ${f(minOdd)} → P1.`,`Нечётные ранги (${odds.map(r=>'P'+r).join(', ')}): MPI_MIN = ${f(minOdd)} → P1.`);
  }
  if(id===77||id===79) {
    const active=Array.from({length:k},(_,r)=>r).filter(r=>n('n_'+r)===1);
    const vals=active.map(r=>n('a_'+r));
    if(id===77) {
      const root=active[0];
      active.forEach(r=>add(r,root,f(n('a_'+r)),`N=1 тобы (MPI_Gather): P${r} → P${root}: ${f(n('a_'+r))}.`,`Группа N=1 (MPI_Gather): P${r} → P${root}: ${f(n('a_'+r))}.`));
    } else {
      add(active,active,show(vals),`N=1 тобы (${active.map(r=>'P'+r).join(', ')}): MPI_Allgather → [${show(vals)}].`,`Группа N=1 (${active.map(r=>'P'+r).join(', ')}): MPI_Allgather → [${show(vals)}].`);
    }
  }
  if(id===80) {
    for(const g of [1,2]) {
      const grp=Array.from({length:k},(_,r)=>r).filter(r=>n('n_'+r)===g);
      const vals=grp.map(r=>n('a_'+r));
      add(grp,grp,show(vals),`N=${g} тобы (${grp.map(r=>'P'+r).join(', ')}): MPI_Allgather → [${show(vals)}].`,`Группа N=${g} (${grp.map(r=>'P'+r).join(', ')}): MPI_Allgather → [${show(vals)}].`);
    }
  }
  return steps;
};
