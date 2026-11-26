// Compatibility entry: current game only; no historical physics or saved-data changes.
(async function compatibilityBoot(options){
  const doc=options.doc??document,read=options.read??fetch,location=options.location??globalThis.location;
  const later=options.later??setTimeout,cancel=options.cancel??clearTimeout;
  const root=doc.getElementById('app');
  if(!root)return;
  let cancelled=false,stage='update',primary='';
  const record=(phase,error='')=>{const value={version:'compatibility',stage,phase,code:phase==='slow'?'INIT-WAIT-UPDATE':'INIT-UPDATE',error:String(error).slice(0,800),at:Date.now()};try{globalThis.sessionStorage?.setItem('castle-startup-diagnostic-v1',JSON.stringify(value));}catch{}};
  const show=(failed=false)=>{
    root.innerHTML='<div style="min-height:100dvh;display:grid;place-content:center;gap:16px;text-align:center;background:#172019;color:#f4edce;font-family:Georgia,serif"><h1>Осада замка</h1><p role="status">Загрузка игры…</p><button type="button" hidden style="padding:12px;color:#172019;background:#e8bd69;border:1px solid #f4edce">Повторить</button></div>';
    const message=root.querySelector('[role="status"]'),retry=root.querySelector('button');
    retry.onclick=()=>{cancelled=true;record('cancelled');retry.disabled=true;location.reload();};
    if(failed){message.textContent=`Не удалось обновить файлы игры. Проверьте соединение и повторите. Код: INIT-UPDATE-${stage.toUpperCase()}.`;retry.hidden=false;}
  };
  show();
  const deadline=async(operation)=>{
    let timer;
    try{record('loading');timer=later(()=>{record('slow');const message=root.querySelector('[role="status"]'),retry=root.querySelector('button');message.textContent='Обновление файлов занимает больше времени. Можно подождать или повторить. Код: INIT-WAIT-UPDATE.';retry.hidden=false;},20000);const value=await operation;if(cancelled)throw Error('Update cancelled');return value;}
    finally{cancel(timer);}
  };
  let css;
  try{
    // A cached compatibility loader must discover the current release afresh.
    const base=new URL('../',options.base);
    const response=await deadline(read(new URL('current-entry.json',base),{cache:'no-store',credentials:'same-origin'}));
    if(!response.ok)throw Error('Entry unavailable');
    const entry=await deadline(response.json());
    if(entry.schema!==1||!/^assets\/index-[A-Za-z0-9_-]+\.js$/.test(entry.entry)||
      !/^assets\/index-[A-Za-z0-9_-]+\.css$/.test(entry.css))throw Error('Invalid entry');
    stage='styles';const stylesheet=doc.createElement('link');css=stylesheet;
    stylesheet.rel='stylesheet';stylesheet.href=new URL(entry.css,base).href;
    const ready=new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=()=>reject(Error('Styles unavailable'));});
    doc.head.append(stylesheet);await deadline(ready);
    // The old stylesheet may also have survived in cache. Remove it only after
    // the current stylesheet is ready, so it cannot override the new shell.
    for(const link of doc.querySelectorAll('link[rel="stylesheet"]')){
      if(link!==stylesheet&&['assets/index-LPhG8MAj.css','assets/index-sqpJNCZV.css'].some(old=>new URL(link.href,base).pathname===new URL(old,base).pathname)&&link.href!==stylesheet.href)link.remove();
    }
    stage='entry';if(cancelled)throw Error('Update cancelled');await deadline(options.load(new URL(entry.entry,base).href));
    return true;
  }catch(error){
    if(cancelled)return false;
    primary=error instanceof Error?`${error.name}: ${error.message}`:String(error);record('failed',primary);
    css?.remove();show(true);
    return false;
  }
})({base:import.meta.url,load:url=>import(url)});
