(()=>{'use strict';
 const screen=document.querySelector('#screen'),input=document.querySelector('#command'),form=document.querySelector('#cli'),prompt=document.querySelector('#prompt');
 const saved=ArchivePersistence.load(),engine=ArchiveEngine.create(saved.data);
 let historyIndex=engine.state.history.length,draft='',busy=false,generation=0,storageWarning=false,fastForward=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function write(text,kind=''){if(!text)return;const line=document.createElement('div');line.className='line '+kind;line.textContent=text;screen.appendChild(line);while(screen.childElementCount>700)screen.firstChild.remove();screen.scrollTop=screen.scrollHeight;return line}
 function transmitting(active){busy=active;const foot=document.querySelector('#foot');if(foot)foot.textContent=active?'RECEBENDO DADOS · ENTER: EXIBIR TUDO · CTRL+C: INTERROMPER':'HELP: COMANDOS · TAB: COMPLETAR ▌'}
 async function reveal(text,kind='',token=generation){
  if(!text||token!==generation)return;
  if(reduced||fastForward){write(text,kind);return}
  const line=write(' ',kind),chars=Array.from(text),step=Math.max(3,Math.ceil(chars.length/220));
  let visible='';
  for(let i=0;i<chars.length;i+=step){
   await new Promise(r=>setTimeout(r,visible.endsWith('\n')?55:18));
   if(token!==generation)return;
   if(fastForward){line.textContent=text;screen.scrollTop=screen.scrollHeight;return}
   visible+=chars.slice(i,i+step).join('');line.textContent=visible;screen.scrollTop=screen.scrollHeight;
  }
 }
 function sync(){prompt.textContent=engine.prompt();if(!ArchivePersistence.save(engine.state)&&!storageWarning){storageWarning=true;write('AVISO: armazenamento local indisponível; progresso mantido apenas nesta aba.','gold')}}
 async function boot(){const token=++generation;fastForward=false;transmitting(true);const lines=[['INITIALIZING MEMORY INTERFACE...','dim'],['ARCHIVE NODE: 07 / SYSTEM INTEGRITY: 83.7%','dim'],['ENCRYPTION STATUS: ACTIVE','dim'],['WARNING: UNAUTHORIZED ACCESS DETECTED.','gold'],['RECOVERING FRAGMENTED RECORDS... [████████████████████] 100%','dim'],['ANTES DO AMANHÃ','mast'],['CATASTROPHE / COMPILAÇÃO DE ASAHI TENSHI','sub'],['\nA memória sobreviveu. A versão dos fatos, também.\n','dim'],["IDENTIDADE DO OPERADOR: DESCONHECIDA\nDigite 'help' para consultar os comandos.\nComece com cat README.txt.",'']];for(const [text,kind] of lines){if(token!==generation)return;await reveal(text,kind,token)}if(token!==generation)return;transmitting(false);sync()}
 async function submit(raw){
  if(busy)return;
  if(!raw.trim())return;
  write(engine.prompt()+' '+raw,'echo');
  const result=engine.run(raw);input.value='';historyIndex=engine.state.history.length;draft='';
  if(result.clear)screen.replaceChildren();
  const token=++generation;fastForward=false;transmitting(true);sync();
  if(result.operation&&!reduced){await reveal('RECUPERANDO BLOCOS...','dim',token);if(token!==generation)return}
  await reveal(result.text,result.kind,token);if(token!==generation)return;transmitting(false);
 }
 form.addEventListener('submit',e=>{e.preventDefault();submit(input.value)});
 input.addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.key.toLowerCase()==='c'){if(window.getSelection()?.toString())return;e.preventDefault();generation++;transmitting(false);input.value='';write(engine.interrupt().text,'gold');sync();return}
  if(busy){if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();fastForward=true}return}
  if(e.key==='ArrowUp'){e.preventDefault();if(historyIndex===engine.state.history.length)draft=input.value;historyIndex=Math.max(0,historyIndex-1);input.value=engine.state.history[historyIndex]||''}
  else if(e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.min(engine.state.history.length,historyIndex+1);input.value=historyIndex===engine.state.history.length?draft:engine.state.history[historyIndex]||''}
  else if(e.key==='Tab'){e.preventDefault();const options=engine.complete(input.value);if(options.length===1){const i=input.value.lastIndexOf(' ');input.value=input.value.slice(0,i+1)+options[0]}else if(options.length)write(options.join('  '),'dim')}
 });
 screen.addEventListener('click',()=>{if(!window.getSelection()?.toString())input.focus()});
 window.addEventListener('pagehide',()=>ArchivePersistence.save(engine.state));
 sync();if(saved.error)write(saved.error,'gold');boot();
})();
