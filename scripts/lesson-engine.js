/* Pure, deterministic learning trace. Arrows explain logical data flow,
   not the implementation or timing of an MPI library. */
window.MpiTrace = function(id, k, inputs) {
  const n = key => Number(inputs[key]);
  const list = r => inputs['set_'+r].trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  const f = x => Number.isInteger(x) ? String(x) : String(Number(x.toPrecision(8)));
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
  return steps;
};
