import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { chapters, allDocuments, continuity, finalRoleAlternatives } from './content.js';
import { database, setting, setSetting, blankProgress } from './database.js';
import { checkPassword, createSessionToken, hashSessionToken } from './authentication.js';
import { verifyAnswer, verifySequence, canAccessChapter, caesar, normalizeAnswer } from './puzzle-engine.js';
import { printMaterials } from './print-materials.js';
import { pdfDocument, svgDocument } from './file-renderer.js';

const docs = allDocuments();
const fail = (status,message) => { throw Object.assign(new Error(message),{status}); };
const ok = (value,headers={}) => Response.json(value,{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...headers}});
const cookies = request => Object.fromEntries((request.headers.get('cookie')||'').split(';').map(x=>x.trim().split('=')));
const cookie = (name,value,age) => `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.ARG_SECURE_COOKIE==='1'?'; Secure':''}`;
function getSession(token,role) {
  if (!token || !/^[a-zA-Z0-9_-]{43}$/.test(token)) return null;
  const row = database().prepare('SELECT * FROM sessions WHERE id=? AND role=? AND expires>?').get(hashSessionToken(token),role,Date.now());
  return row ? {...row,state:JSON.parse(row.state)} : null;
}
function newSession(role) {
  const token=createSessionToken(), id=hashSessionToken(token), now=Date.now();
  const state=blankProgress(), expires=now+(role==='master'?8*3600000:30*86400000);
  database().prepare('DELETE FROM sessions WHERE expires<=?').run(now);
  database().prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(id,role,JSON.stringify(state),expires,now);
  return {token,id,role,state,expires};
}
function save(session) { database().prepare('UPDATE sessions SET state=?,updated=? WHERE id=?').run(JSON.stringify(session.state),Date.now(),session.id); }
function completed(state) { return chapters.filter(c=>state.solved.includes(`${c.id}-main`)).map(c=>c.id); }
function allowed(id,session) { return canAccessChapter({chapter:id,released:setting('released'),solved:completed(session.state),preview:session.role==='preview',isMaster:session.role==='preview'}); }
function requireChapter(id,s) { if(!allowed(id,s)) fail(403,'Registro selado. Pode depender de uma etapa presencial ou de evidências anteriores.'); return chapters[id-1]; }
function override(d,preview=false) { const row=database().prepare('SELECT * FROM documents WHERE id=?').get(d.id); return {...d,text:row?(preview?row.draft:row.published):d.text,access:'disponível'}; }
function availableDocs(s) {
  return docs.filter(d=>allowed(d.chapter,s)&&(!d.reward||s.state.solved.includes(`${d.chapter}-main`))&&(!d.secret||s.state.links.includes(`connection-${d.chapter}`)));
}
function readDocument(id,s) {
  const d=availableDocs(s).find(x=>x.id===id) || extraClues(s).find(x=>x.id===id);
  if(!d) fail(403,'Arquivo indisponível.');
  if(!s.state.found.includes(id)) s.state.found.push(id);
  save(s); return override(d,s.role==='preview');
}
function extraClues(s) { return database().prepare('SELECT * FROM clues WHERE published=1').all().filter(d=>allowed(d.chapter,s)).map(d=>({...d,origin:'Anexo de campo',date:'Sem data',classification:'Complementar',format:'TXT',connections:[],access:'disponível'})); }
function stateFor(s) { return {...s.state,session:s.id.slice(0,10),preview:s.role==='preview',completed:completed(s.state),chapters:chapters.map(c=>({id:c.id,name:allowed(c.id,s)?c.name:'Registro selado',module:allowed(c.id,s)?c.module:null,available:allowed(c.id,s),completed:s.state.solved.includes(`${c.id}-main`)})),documents:[...availableDocs(s),...extraClues(s)].map(d=>({id:d.id,title:d.title,chapter:d.chapter,format:d.format,found:s.state.found.includes(d.id)}))}; }
function chapterFor(id,s) {
  const c=requireChapter(id,s);
  return {id:c.id,name:c.name,module:c.module,intro:c.intro,documents:[...availableDocs(s),...extraClues(s)].filter(d=>d.chapter===id).map(d=>({id:d.id,title:d.title,format:d.format})),puzzles:c.puzzles.map(p=>({id:p.id,title:p.title,method:p.method,prompt:p.prompt,options:p.options||null,seal:!!p.seal,solved:s.state.solved.includes(p.id),hintCount:s.state.hints[p.id]||0,hints:p.hints.slice(0,s.state.hints[p.id]||0)}))};
}
async function body(request) {
  const reader=request.body?.getReader(); let size=0, chunks=[];
  if(!reader) return {};
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>262144){await reader.cancel();fail(413,'Arquivo excede 256 KB.');}chunks.push(part.value);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail(400,'JSON inválido.');}
}
function sign(value) {return createHmac('sha256',setting('export-key')).update(JSON.stringify(value)).digest('hex');}
function validSignature(payload,signature) { return typeof signature==='string'&&/^[a-f0-9]{64}$/.test(signature)&&timingSafeEqual(Buffer.from(sign(payload),'hex'),Buffer.from(signature,'hex')); }
function safeProgress(value) {
  const ids=new Set(chapters.flatMap(c=>c.puzzles.map(p=>p.id))), docIds=new Set(docs.map(d=>d.id));
  if(!value||!Array.isArray(value.solved)||!Array.isArray(value.found)||!Array.isArray(value.links)||!value.notes||!value.hints||typeof value.judgment!=='string')fail(400,'Progresso inválido.');
  if(value.solved.some(x=>!ids.has(x))||value.found.some(x=>!docIds.has(x)&&!String(x).startsWith('extra-'))||value.judgment.length>6000)fail(400,'Referências inválidas.');
  const notes={};for(const [k,v] of Object.entries(value.notes)){if(typeof v!=='string'||v.length>6000)fail(400,'Nota inválida.');notes[k]=v;}
  return {solved:[...new Set(value.solved)],found:[...new Set(value.found)],links:value.links.filter(x=>/^connection-[1-8]$/.test(x)),notes,hints:value.hints,judgment:value.judgment};
}
function verifyPuzzle(p,b,s) {
  if(p.seal&&s.role!=='preview'&&b.seal!==setting(`seal-${p.id.split('-')[0]}`))fail(422,'Selo de campo inválido. Consulte o material entregue na sessão.');
  if(p.method==='sequence')return verifySequence(b.answer,p.answers);
  if(p.method==='final'){
    return verifySequence(b.order,p.order)&&Object.keys(p.roles).every(key=>verifyAnswer(b.roles?.[key],finalRoleAlternatives[key]))&&typeof b.judgment==='string'&&b.judgment.trim().length>=10&&b.judgment.length<=6000;
  }
  return verifyAnswer(b.answer,p.answers);
}
function throttle(key,limit=30) {
  const row=database().prepare('SELECT * FROM attempts WHERE key=?').get(key),now=Date.now();
  if(row&&row.until_time>now&&row.count>=limit)fail(429,'Muitas tentativas. Tente novamente em alguns minutos.');
  database().prepare('INSERT INTO attempts VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,until_time=excluded.until_time').run(key,row&&row.until_time>now?row.count+1:1,row&&row.until_time>now?row.until_time:now+300000);
}

export async function handle(request) {
  try {
    database();
    const url=new URL(request.url),route=url.pathname.replace(/^\/api\//,''),isPost=request.method==='POST', jar=cookies(request);
    if(!['GET','POST'].includes(request.method))fail(405,'Método indisponível.');
    if(isPost){
      if(request.headers.get('x-requested-with')!=='antes-do-dia')fail(403,'Cabeçalho de origem obrigatório.');
      const expectedOrigin=process.env.ARG_ORIGIN||`${url.protocol}//${request.headers.get('host')||url.host}`;
      if(request.headers.get('origin')&&request.headers.get('origin')!==expectedOrigin)fail(403,'Origem inválida.');
      if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'Envie JSON.');
    }
    const b=isPost?await body(request):{};
    const master=getSession(jar.arg_master,'master');
    if(route==='admin/login'&&isPost){
      throttle('master-login',8);
      if(!setting('master-password'))fail(503,'Execute npm run setup no servidor para cadastrar a senha do mestre.');
      if(!checkPassword(b.password,setting('master-password')))fail(401,'Credenciais inválidas.');
      const s=newSession('master');return ok({ok:true},{'Set-Cookie':cookie('arg_master',s.token,8*3600)});
    }
    if(route.startsWith('admin/')) {
      if(!master)fail(401,'Autenticação do mestre necessária.');
      return admin(route,b,isPost,master,url);
    }
    const preview=request.headers.get('x-arg-preview')==='1'||(route.startsWith('file/')&&url.searchParams.get('preview')==='1');
    if(preview&&!master)fail(403,'Pré-visualização exige autenticação.');
    const role=preview?'preview':'player',cookieName=preview?'arg_preview':'arg_player';
    let s=getSession(jar[cookieName],role),created=false;
    if(!s){if(route!=='state')fail(401,'Abra o caderno para iniciar a sessão.');s=newSession(role);created=true;}
    const reply=v=>ok(v,created?{'Set-Cookie':cookie(cookieName,s.token,30*86400)}:{});
    if(route==='state'&&!isPost)return reply(stateFor(s));
    if(/^chapter\/[1-8]$/.test(route)&&!isPost)return reply(chapterFor(Number(route.split('/')[1]),s));
    if(route.startsWith('document/')&&!isPost)return reply(readDocument(route.slice(9),s));
    if(route.startsWith('file/')&&!isPost){const d=readDocument(route.slice(5),s),pdf=d.format==='PDF',svg=d.format==='IMG',ext=pdf?'pdf':svg?'svg':d.format==='MD'?'md':'txt';return new Response(pdf?pdfDocument(d):svg?svgDocument(d):d.text,{headers:{'Content-Type':pdf?'application/pdf':svg?'image/svg+xml':'text/plain; charset=utf-8','Content-Disposition':`attachment; filename="${d.id}.${ext}"`,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'none'; sandbox"}});}
    if(route==='solve'&&isPost){
      throttle(`solve-${s.id}`,100);
      const c=chapters.find(c=>c.puzzles.some(p=>p.id===b.id));if(!c)fail(404,'Desafio inexistente.');requireChapter(c.id,s);
      const p=c.puzzles.find(p=>p.id===b.id);
      if(p.id.endsWith('-main')&&!c.puzzles.filter(p=>!p.id.endsWith('-main')).every(p=>s.state.solved.includes(p.id)))fail(409,'Compare primeiro os dois indícios deste arquivo.');
      if(!verifyPuzzle(p,b,s))return reply({correct:false,message:'A reconstrução não coincide com os registros. O progresso foi preservado.'});
      if(!s.state.solved.includes(p.id))s.state.solved.push(p.id);
      if(p.method==='final')s.state.judgment=b.judgment.trim();save(s);
      return reply({correct:true,message:p.id.endsWith('-main')?'Anotação recuperada. Consulte o novo documento no inventário.':'Indício confirmado.',state:stateFor(s)});
    }
    if(route==='hint'&&isPost){const c=chapters.find(c=>c.puzzles.some(p=>p.id===b.id));if(!c)fail(404,'Desafio inexistente.');requireChapter(c.id,s);s.state.hints[b.id]=Math.min(3,(s.state.hints[b.id]||0)+1);save(s);return reply({hints:c.puzzles.find(p=>p.id===b.id).hints.slice(0,s.state.hints[b.id])});}
    if(route==='note'&&isPost){if(!s.state.found.includes(b.id))fail(403,'Leia a evidência antes de anotar.');if(typeof b.text!=='string'||b.text.length>6000)fail(400,'Limite de 6000 caracteres.');s.state.notes[b.id]=b.text;save(s);return reply({ok:true});}
    if(route==='connect'&&isPost){
      if(!Array.isArray(b.ids)||b.ids.length<2||b.ids.length>12||b.ids.some(id=>!s.state.found.includes(id)))fail(400,'Selecione duas ou mais evidências já lidas.');
      const c=chapters.find(c=>c.connection.every(id=>b.ids.includes(id))&&b.ids.every(id=>String(id).startsWith(`${c.id}-`))&&allowed(c.id,s));
      if(!c)return reply({correct:false,message:'Os registros não confirmam essa ligação. Nenhuma evidência foi perdida.'});
      const key=`connection-${c.id}`;if(!s.state.links.includes(key))s.state.links.push(key);save(s);return reply({correct:true,message:'A comparação recuperou uma margem preservada.',state:stateFor(s)});
    }
    if(route==='export'&&!isPost){const payload={version:1,state:s.state};return reply({payload,signature:sign(payload)});}
    if(route==='import'&&isPost){if(!b.payload||b.payload.version!==1||!validSignature(b.payload,b.signature))fail(400,'Exportação inválida ou de outra instalação.');s.state=safeProgress(b.payload.state);save(s);return reply(stateFor(s));}
    if(route==='reset'&&isPost){if(b.confirm!=='REINICIAR')fail(400,'Confirmação necessária.');s.state=blankProgress();save(s);return reply(stateFor(s));}
    if(route==='terminal'&&isPost)return reply(terminal(b.command,s));
    fail(404,'Rota não encontrada.');
  }catch(e){return Response.json({error:e.status?e.message:'Falha interna. Consulte o servidor.'},{status:e.status||500,headers:{'Cache-Control':'no-store'}});}
}

function terminal(command,s) {
  if(typeof command!=='string'||command.length>4096)fail(400,'Comando inválido.');
  const [cmd,...args]=command.trim().split(/\s+/),arg=args.join(' '),list=availableDocs(s);
  switch(cmd?.toLowerCase()){
    case 'help':return {output:'help · dir · read ID · search TERMO · decrypt 3 TEXTO · status · archive\nEste terminal é fictício. Não executa comandos do sistema.'};
    case 'dir':case 'archive':return {output:list.map(d=>`${d.id}  ${d.title}`).join('\n')};
    case 'read':{const d=readDocument(arg,s);return {output:`${d.id} / ${d.title}\n\n${d.text}`};}
    case 'search':return {output:list.filter(d=>normalizeAnswer(`${d.title} ${override(d).text}`).includes(normalizeAnswer(arg))).map(d=>`${d.id} / ${d.title}`).join('\n')||'Nenhum registro disponível coincide.'};
    case 'decrypt':if(args[0]!=='3')return {output:'A roda preservada admite deslocamento 3. Uso: decrypt 3 TEXTO'};return {output:caesar(args.slice(1).join(' '),-3)};
    case 'status':return {output:`${s.state.solved.length} indícios confirmados; ${s.state.found.length} arquivos lidos. Etapas presenciais exigem liberação do mestre.`};
    default:return {output:'Comando não reconhecido. Digite help.'};
  }
}

function admin(route,b,isPost,master,url) {
  if(route==='admin/logout'&&isPost){database().prepare('DELETE FROM sessions WHERE id=?').run(master.id);return ok({ok:true},{'Set-Cookie':cookie('arg_master','',0)});}
  if(route==='admin/state'&&!isPost)return ok({chapters,continuity,documents:docs.map(d=>({...override(d),draft:override(d,true).text})),released:setting('released'),seals:Object.fromEntries([3,4,6,7,8].map(i=>[i,setting(`seal-${i}`)])),clues:database().prepare('SELECT * FROM clues').all(),sessions:database().prepare("SELECT id,role,state,updated FROM sessions WHERE role!='master' AND expires>?").all(Date.now()).map(r=>({id:r.id,role:r.role,updated:r.updated,state:JSON.parse(r.state)}))});
  if(route==='admin/release'&&isPost){if(!Number.isInteger(b.chapter)||b.chapter<1||b.chapter>8||typeof b.open!=='boolean')fail(400,'Capítulo inválido.');if(b.chapter===8&&b.open&&b.confirm!=='ONE-SHOT CONCLUIDA')fail(400,'Confirme ONE-SHOT CONCLUIDA antes de liberar O Dia.');const value=setting('released').filter(id=>id!==b.chapter);if(b.open)value.push(b.chapter);setSetting('released',value.sort());return ok({ok:true});}
  if(route==='admin/document'&&isPost){if(!docs.some(d=>d.id===b.id)||typeof b.text!=='string'||b.text.length>20000)fail(400,'Documento inválido.');const original=docs.find(d=>d.id===b.id);const row=database().prepare('SELECT * FROM documents WHERE id=?').get(b.id);database().prepare('INSERT INTO documents VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET draft=excluded.draft,published=excluded.published').run(b.id,b.text,b.publish?b.text:row?.published||original.text);return ok({ok:true});}
  if(route==='admin/clue'&&isPost){if(!Number.isInteger(b.chapter)||b.chapter<1||b.chapter>8||typeof b.title!=='string'||!b.title.trim()||b.title.length>120||typeof b.text!=='string'||!b.text.trim()||b.text.length>10000)fail(400,'Pista inválida.');const id=`extra-${randomUUID()}`;database().prepare('INSERT INTO clues VALUES(?,?,?,?,?)').run(id,b.chapter,b.title,b.text,b.publish?1:0);return ok({id});}
  if(route==='admin/reset-session'&&isPost){if(b.confirm!=='REINICIAR'||typeof b.id!=='string')fail(400,'Confirmação necessária.');database().prepare("UPDATE sessions SET state=?,updated=? WHERE id=? AND role!='master'").run(JSON.stringify(blankProgress()),Date.now(),b.id);return ok({ok:true});}
  if(route==='admin/export'&&!isPost)return ok({version:1,documents:docs.map(d=>({id:d.id,draft:override(d,true).text,published:override(d).text})),clues:database().prepare('SELECT * FROM clues').all()});
  if(route==='admin/import'&&isPost){
    if(b.version!==1||!Array.isArray(b.documents)||!Array.isArray(b.clues)||b.documents.length>100||b.clues.length>100)fail(400,'Conteúdo inválido.');
    for(const d of b.documents)if(!docs.some(x=>x.id===d.id)||typeof d.draft!=='string'||d.draft.length>20000||typeof d.published!=='string'||d.published.length>20000)fail(400,'Documento inválido.');
    for(const d of b.clues)if(!/^extra-[a-f0-9-]{36}$/.test(d.id)||!Number.isInteger(d.chapter)||d.chapter<1||d.chapter>8||typeof d.title!=='string'||d.title.length>120||typeof d.text!=='string'||d.text.length>10000||![0,1].includes(d.published))fail(400,'Pista inválida.');
    database().exec('BEGIN');try{for(const d of b.documents)database().prepare('INSERT OR REPLACE INTO documents VALUES(?,?,?)').run(d.id,d.draft,d.published);for(const d of b.clues)database().prepare('INSERT OR REPLACE INTO clues VALUES(?,?,?,?,?)').run(d.id,d.chapter,d.title,d.text,d.published);database().exec('COMMIT');}catch(e){database().exec('ROLLBACK');throw e;}return ok({ok:true});
  }
  if(route==='admin/print'&&!isPost)return new Response(printMaterials(url.searchParams.get('set')||'session-1',url.searchParams.get('style')!=='plain'),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'"}});
  if(route==='admin/preview-reset'&&isPost){database().prepare("DELETE FROM sessions WHERE role='preview'").run();return ok({ok:true});}
  fail(404,'Rota administrativa não encontrada.');
}
