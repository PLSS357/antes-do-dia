const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('HTML distribuído inicializa e recebe comandos sem recursos externos',async()=>{
 const html=fs.readFileSync('dist/index.html','utf8');assert.doesNotMatch(html,/<(?:script|link|img)[^>]+(?:src|href)=/i);
 const nodes={};function node(){return {textContent:'',value:'',className:'',children:[],listeners:{},appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},remove(){},focus(){},addEventListener(k,fn){this.listeners[k]=fn},get childElementCount(){return this.children.length},scrollHeight:100,scrollTop:0}}
 for(const id of ['#screen','#command','#cli','#prompt'])nodes[id]=node();
 const store=new Map(),ctx={document:{querySelector:s=>nodes[s],createElement:node,body:{classList:{toggle(){}}}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},matchMedia:()=>({matches:true}),setTimeout,window:{addEventListener(){},getSelection:()=>''}};
 vm.createContext(ctx);const code=html.match(/<script>([\s\S]*)<\/script>/)[1];vm.runInContext(code,ctx);await new Promise(r=>setImmediate(r));
 const output=()=>nodes['#screen'].children.map(n=>n.textContent).join('\n');
 assert.match(output(),/ANTES DO AMANHÃ/);assert.match(output(),/cat README.txt/);
 async function submit(s){nodes['#command'].value=s;nodes['#cli'].listeners.submit({preventDefault(){}});await new Promise(r=>setImmediate(r))}
 await submit('cat README.txt');assert.match(output(),/compilação|MAPA DE RECUPERAÇÃO/i);
 await submit('unlock herdar');assert.match(output(),/ACESSO LIBERADO/);assert.match([...store.values()][0],/heranca/);
 await submit('cd /personal');assert.equal(nodes['#prompt'].textContent,'arquivo@amanha:/personal$');
 await submit('<img src=x onerror=alert(1)>');assert.match(output(),/comando não encontrado/);
});
test('armazenamento inválido e quota esgotada têm tratamento explícito',()=>{
 const source=fs.readFileSync('src/persistence.js','utf8');let exported;const ctx={module:{exports:{}},localStorage:{getItem(){return '{invalid'},setItem(){throw Error('quota')}}};vm.createContext(ctx);vm.runInContext(source,ctx);exported=ctx.module.exports;
 assert.equal(exported.load().data,null);assert.match(exported.load().error,/indisponível/);assert.equal(exported.save({}),false);
});
test('saída surge em partes, Enter completa e Ctrl+C cancela sem texto atrasado',async()=>{
 const html=fs.readFileSync('dist/index.html','utf8'),nodes={},timers=[];
 function node(){return {textContent:'',value:'',children:[],listeners:{},appendChild(n){this.children.push(n)},addEventListener(k,f){this.listeners[k]=f},get childElementCount(){return this.children.length},scrollHeight:100,scrollTop:0}}
 for(const id of ['#screen','#command','#cli','#prompt','#foot'])nodes[id]=node();
 const ctx={document:{querySelector:s=>nodes[s],createElement:node,body:{classList:{toggle(){}}}},localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:false}),setTimeout:f=>timers.push(f),window:{addEventListener(){},getSelection:()=>''}};
 vm.createContext(ctx);vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1],ctx);
 const output=()=>nodes['#screen'].children.map(n=>n.textContent).join('\n');
 const tick=async()=>{timers.shift()?.();await new Promise(r=>setImmediate(r))};
 const key=(key,ctrlKey=false)=>nodes['#command'].listeners.keydown({key,ctrlKey,preventDefault(){}});
 assert.doesNotMatch(output(),/INITIALIZING MEMORY INTERFACE/);
 await tick();assert.match(output(),/INI/);assert.doesNotMatch(output(),/INITIALIZING MEMORY INTERFACE/);
 key('Enter');await tick();assert.match(output(),/ANTES DO AMANHÃ/);
 nodes['#command'].value='cat README.txt';nodes['#cli'].listeners.submit({preventDefault(){}});
 await tick();assert.doesNotMatch(output(),/MAPA DE RECUPERAÇÃO/);
 key('c',true);const interrupted=output();while(timers.length)await tick();assert.equal(output(),interrupted);assert.match(output(),/\^C/);
 nodes['#command'].value='help';nodes['#cli'].listeners.submit({preventDefault(){}});key('Enter');while(timers.length)await tick();assert.match(output(),/COMANDOS/);
});
