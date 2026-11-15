/* Interpretador puro: não executa código, shell, rede nem acessa arquivos reais. */
const ArchiveEngine=(()=>{
 const F=typeof module!=='undefined'?require('./filesystem.js'):ArchiveFS;
 const P=typeof module!=='undefined'?require('./puzzles.js'):ArchivePuzzles;
 const C=typeof module!=='undefined'?require('./content.js'):ArchiveContent;
 const commands=['help','ls','cd','cat','search','unlock','decrypt','clear','exit'];
 const fresh=()=>({version:1,cwd:'/home/archive',keys:[],read:[],history:[],});
 function create(saved){
  const fs=F.create(C),state=fresh();
  if(saved&&saved.version===1){
   if(fs.isDir(saved.cwd))state.cwd=saved.cwd;
   state.keys=Array.isArray(saved.keys)?saved.keys.filter(k=>P.locks.some(l=>l.id===k)):[];
   state.read=Array.isArray(saved.read)?saved.read.filter(p=>fs.get(p)&&(!fs.get(p).need||state.keys.includes(fs.get(p).need))):[];
   state.history=Array.isArray(saved.history)?saved.history.filter(x=>typeof x==='string').map(x=>x.slice(0,2048)).slice(-250):[];
  }
  let ended=false;
  const can=d=>d&&!d.removed&&(!d.need||state.keys.includes(d.need));
  const path=s=>F.resolve(s,state.cwd);
  const get=s=>{const p=path(s),d=fs.get(p);if(!d)throw Error(fs.isDir(p)?`${p}: é um diretório`:`${p}: arquivo não encontrado`);return d};
  const accessible=s=>{const d=get(s);if(!can(d))throw Error(`${d.path}: PERMISSION DENIED\nEnvelope selado.\n${envelope(d)}`);return d};
  function envelope(d){const lock=P.locks.find(l=>l.id===d.need);return [lock?'PISTA: '+lock.hint:'',...Object.entries(d.meta||{}).map(([k,v])=>k+': '+v)].filter(Boolean).join('\n')}
  const mark=d=>{if(!state.read.includes(d.path))state.read.push(d.path)};
  function tokenize(raw){const words=[];let v='',quote='',active=false;for(const c of raw){if(quote){if(c===quote)quote='';else v+=c;active=true}else if(c==='"'||c==="'"){quote=c;active=true}else if(/\s/.test(c)){if(active){words.push(v);v='';active=false}}else{v+=c;active=true}}if(quote)throw Error('Aspas não terminadas.');if(active)words.push(v);return words}
  function run(raw){
   try{
    if(typeof raw!=='string'||raw.length>2048)throw Error('Entrada inválida ou superior a 2048 caracteres.');
    const args=tokenize(raw.trim());if(!args.length)return {text:''};
    const cmd=F.normalize(args.shift());
    if(ended)return {text:'Sessão encerrada. Recarregue a página para voltar. Seu progresso foi salvo.',kind:'dim'};
    state.history.push(raw);state.history=state.history.slice(-250);
    const discovered=args.length===0?P.locks.find(l=>P.accepts(l,cmd)):null;
    if(discovered){
     if(!state.keys.includes(discovered.id))state.keys.push(discovered.id);
     const related=C.filter(d=>d.need===discovered.id);
     const diary=related.find(d=>d.diaryPart)||related.find(d=>d.chapter)||related[0];
     if(diary){mark(diary);return {text:`${diary.title||diary.path}\n${'─'.repeat(48)}\n\n${diary.text}`}}
    }
    switch(cmd){
     case 'help':return {text:`COMANDOS\n\nls [pasta]             listar arquivos\ncd [pasta]             entrar em uma pasta\ncat arquivo            ler um arquivo\nsearch palavra         procurar nos textos disponíveis\nunlock senha           desbloquear um registro\ndecrypt arquivo [chave] decodificar uma mensagem\nclear                  limpar a tela\nexit                   encerrar a sessão\nhelp                   consultar esta lista\n\nEncontrou uma palavra? Digite-a sozinha para ler o diário.\n\nComece com cat README.txt.\nO caminho atual aparece no prompt. cd .. retorna à pasta anterior.\nTab completa nomes. ↑/↓ recuperam comandos.\nEnter mostra o texto completo. Ctrl+C interrompe.`};
     case 'ls':{if(args.length>1||args.some(a=>a.startsWith('-')))throw Error('Use: ls [pasta]');const p=path(args[0]||'.');if(!fs.isDir(p))throw Error(`${p}: pasta não encontrada`);return {text:`${p}\n`+fs.children(p,true).map(x=>{const d=fs.get(x);return `  ${x.split('/').pop()}${fs.isDir(x)?'/':d.need&&!can(d)?'  [BLOQUEADO]':''}`}).join('\n')}}
     case 'cd':{if(args.length>1)throw Error('cd: argumentos em excesso');const p=path(args[0]||'~');if(!fs.isDir(p))throw Error(`${p}: não é um diretório`);state.cwd=p;return {text:''}}
     case 'cat':{if(args.length!==1)throw Error('Use: cat arquivo');const d=accessible(args[0]);mark(d);return {text:`${d.title||d.path}\n${'─'.repeat(48)}\n\n${d.text}`}}
     case 'search':{if(!args.length)throw Error('Sintaxe: search TERMO');const q=F.normalize(args.join(' ')),hits=[];for(const d of fs.files.values())if(can(d)&&F.normalize(d.text).includes(q))hits.push(d.path);return {text:`${hits.length} resultado(s) acessível(is).\n`+hits.join('\n')}}
     case 'unlock':{if(args.length!==1)throw Error('Use: unlock senha');const lock=P.locks.find(l=>P.accepts(l,args[0]));if(!lock)throw Error('Senha não reconhecida. Procure pistas nos arquivos.');if(state.keys.includes(lock.id))return {text:'Este registro já está disponível.',kind:'dim'};state.keys.push(lock.id);return {text:'ACESSO LIBERADO\n'+C.filter(d=>d.need===lock.id).map(d=>d.path).join('\n'),kind:'bright'}}
     case 'decrypt':{if(args.length<1||args.length>2)throw Error('Use: decrypt arquivo [chave]');const d=accessible(args[0]);return {text:'MENSAGEM RECUPERADA\n'+P.decode(d,d.cipher,args[1])+'\nDigite a palavra recuperada para abrir seu registro.',kind:'bright',operation:true}}
     case 'clear':return {text:'',clear:true};
     case 'exit':ended=true;return {text:'Sessão encerrada. Progresso salvo.\nRecarregue a página para voltar.',kind:'dim'};
     default:throw Error(`${cmd}: comando não encontrado. Digite help.`);
    }
   }catch(e){return {text:e.message,kind:'error'}}
  }
  function complete(raw){
   const parts=raw.split(/\s+/),last=parts.pop()||'';
   if(!parts.length)return commands.filter(c=>c.startsWith(F.normalize(last)));
   const base=last.includes('/')?last.slice(0,last.lastIndexOf('/')+1):'',prefix=last.slice(base.length),dir=path(base||'.');
   return fs.children(dir,true).filter(p=>p.split('/').pop().startsWith(prefix)).map(p=>base+p.split('/').pop()+(fs.isDir(p)?'/':''));
  }
  return {state,run,complete,fs,can,interrupt(){return {text:'^C',kind:'gold'}},prompt(){const cwd=state.cwd.replace(/^\/home\/archive(?=\/|$)/,'~');return `arquivo@amanha:${cwd}$`}};
 }
 return {create,fresh,commands};
})();
if(typeof module!=='undefined')module.exports=ArchiveEngine;
