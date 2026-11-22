export const startEngine=()=>(function redirectLegacyEngine(options){
  const location=options.location??globalThis.location;
  const next=new URL('../launch.html',options.base);
  next.search=location.search;next.hash=location.hash;
  next.searchParams.set('_entry',String(options.now??Date.now()));
  location.replace(next.href);
  return new Promise(()=>{});
})({base:import.meta.url});
