const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/engine.js'),P=require('../src/puzzles.js'),C=require('../src/content.js'),F=require('../src/filesystem.js');
const path=n=>C.find(d=>d.chapter===n).path;
function ok(e,s){const r=e.run(s);assert.notEqual(r.kind,'error',s+': '+r.text);return r.text}
test('cifras recuperam credenciais determinísticas',()=>{
 const fs=F.create(C),decode=(file,m,k)=>P.decode(fs.get(file),m,k);
 assert.equal(decode('/imperial/genealogy/transmissao.csr','caesar','3'),'HERDAR');
 assert.equal(decode('/imperial/classified/voz.hex','hex'),'HOSPEDE');
 assert.equal(decode('/seraphim/research/indice.bin','binary'),'SERAFIM');
 assert.equal(decode('/correspondence/encrypted/canal.vig','vigenere','MIKAELA'),'CENTVEIL');
 assert.equal(decode('/personal/recordings/convite.sub','substitution'),'SANGUE');
 assert.equal(decode('/home/archive/fragments/memoria.dmg','rebuild'),'AUSENCIA');
});
test('percurso integral desbloqueia e lê todos os documentos',()=>{
 const e=E.create();for(const lock of P.locks){ok(e,'unlock '+lock.keys.join('+'));}
 for(const d of C)assert.ok(ok(e,'cat '+d.path).includes(d.text),'conteúdo completo: '+d.path);
 assert.equal(e.state.keys.length,P.locks.length);assert.equal(e.state.read.length,C.length);
});
test('dez capítulos sem nenhuma credencial externa e sem estado impossível',()=>{
 const e=E.create();for(const l of P.locks.filter(l=>!l.external)){assert.ok(C.some(d=>d.need===l.id));ok(e,'unlock '+l.keys.join('+'));assert.ok(e.can(C.find(d=>d.need===l.id)))}
 assert.equal(C.filter(d=>d.chapter&&e.can(d)).length,10);
 assert.equal(e.can(C.find(d=>d.need==='laboratorio')),false);
 assert.ok(ok(e,'cat '+path(10)).endsWith('Eu queria um amanhã que fosse meu.'));
});
test('pistas de todas as travas internas são públicas; grafo sem bloqueio circular',()=>{
 const e=E.create();const clues={heranca:['/boot/recovery.log','/imperial/genealogy/transmissao.csr'],cultivo:['/imperial/military/relatorio_a.txt','/imperial/military/relatorio_b.txt'],hospede:['/imperial/classified/voz.hex'],serafim:['/seraphim/research/indice.bin'],intermediario:['/correspondence/encrypted/canal.vig'],sangue:['/personal/recordings/convite.sub'],ausencia:['/home/archive/fragments/memoria.dmg'],vespera:['/imperial/military/escala.txt','/seraphim/observations/rota.txt'],seis:['/seraphim/restricted/operacao.idx'],testamento:['/system/unknown/.manifest','/personal/letters/limiar.txt','/correspondence/recovered/limite.txt']};
 Object.assign(clues,{respirar:['/seraphim/laboratory/registro_10.txt'],escolha:['/seraphim/laboratory/registro_11.txt'],jardim:['/seraphim/laboratory/registro_12.txt'],lei:['/seraphim/laboratory/registro_13.txt']});
 for(const l of P.locks.filter(l=>!l.external)){for(const p of clues[l.id])ok(e,'cat '+p);assert.ok(l.hint)}
 assert.match(e.run('cat '+path(10)).text,/token: RESPIRAR/);
});
test('leitura e busca não vazam conteúdo bloqueado',()=>{
 const e=E.create();assert.equal(e.run('cat '+path(7)).kind,'error');
 assert.equal(e.run('search "Lian Rosseul"').text,'0 resultado(s) acessível(is).\n');
 assert.equal(e.run('decrypt '+path(7)+' hex').kind,'error');
 ok(e,'unlock ausencia');assert.match(ok(e,'search "Lian Rosseul"'),/07_ausencia/);
});
test('dupla custódia exige todos os componentes, sem importar ordem ou acentos',()=>{
 const e=E.create();ok(e,'unlock RESPIRAR');assert.equal(e.can(C.find(d=>d.chapter===10)),false);ok(e,'unlock ESCOLHA');assert.equal(e.can(C.find(d=>d.chapter===10)),false);ok(e,'ÚNLOCK escolha+respirar');assert.ok(e.can(C.find(d=>d.chapter===10)));
});
test('navegação e autocomplete funcionam sem opções extras',()=>{
 const e=E.create();assert.equal(e.state.cwd,'/home/archive');ok(e,'cd /');ok(e,'cd ../../personal/../system/unknown');assert.equal(e.state.cwd,'/system/unknown');assert.match(ok(e,'ls'),/\.manifest/);
 assert.ok(e.complete('cat /system/unknown/.m').includes('/system/unknown/.manifest'));assert.ok(e.complete('he').includes('help'));ok(e,'cd');assert.equal(e.state.cwd,'/home/archive');
});
test('apenas nove comandos e uma sintaxe por ação',()=>{
 const e=E.create();assert.equal(E.commands.length,9);
 for(const c of ['effects','sound','reset','diff','less','stat','pwd','grep','whoami','history','status','resume','reboot'])assert.equal(e.run(c).kind,'error',c);
 assert.equal(e.run('unlock '+path(1)+' HERDAR').kind,'error');assert.equal(e.run('ls -a').kind,'error');
 assert.match(ok(e,'decrypt /imperial/genealogy/transmissao.csr 3'),/HERDAR/);
 assert.match(ok(e,'decrypt /imperial/classified/voz.hex'),/HOSPEDE/);
 assert.match(ok(e,'decrypt /correspondence/encrypted/canal.vig MIKAELA'),/CENTVEIL/);
});
test('persistência restaura estado e rejeita dados inválidos',()=>{
 const e=E.create();ok(e,'unlock herdar');ok(e,'cat '+path(1));ok(e,'cd /imperial');const restored=E.create(JSON.parse(JSON.stringify(e.state)));assert.equal(restored.state.cwd,'/imperial');assert.deepEqual(restored.state.keys,['heranca']);assert.ok(restored.state.read.includes(path(1)));
 const bad=E.create({version:1,cwd:'/etc',keys:['bogus'],read:['/etc/passwd'],history:[42,'ls']});assert.deepEqual(bad.state.keys,[]);assert.deepEqual(bad.state.read,[]);assert.equal(bad.state.cwd,'/home/archive');
});
test('exit encerra e recarregar restaura o progresso',()=>{
 const e=E.create();ok(e,'unlock herdar');ok(e,'exit');assert.match(e.run('ls').text,/encerrada/);const next=E.create(e.state);assert.ok(next.state.keys.includes('heranca'));ok(next,'ls');
});
test('entrada é tratada como dados; não há execução nem caminhos reais',()=>{
 const e=E.create();for(const s of ['sudo rm -rf /','<img src=x onerror=alert(1)>','cat /etc/passwd','cat "sem fim','ls -x','decrypt /imperial/genealogy/transmissao.csr caesar 99'])assert.equal(e.run(s).kind,'error');
 assert.equal(e.run('x'.repeat(2049)).kind,'error');assert.equal(e.run('unlock inexistente').kind,'error');
 const ui=require('node:fs').readFileSync('src/ui.js','utf8');assert.doesNotMatch(ui,/innerHTML|eval\(|new Function/);
});
test('nomes reservados e confirmação de autoria não estão no conteúdo jogável',()=>{
 const text=C.map(d=>d.text).join('\n');assert.doesNotMatch(text,/Alexiel|Riliane|Libitina|Lian.{0,40}(executou|realizou|provocou)/i);assert.ok(C.filter(d=>d.chapter).length===10);
});
test('treze palavras escondidas no laboratório abrem treze folhas do diário',()=>{
 const words=['HERDAR','CULTIVO','HOSPEDE','SERAFIM','CENTVEIL','SANGUE','AUSENCIA','VESPERA','SEIS','RESPIRAR','ESCOLHA','JARDIM','LEI'];
 const reports=C.filter(d=>d.labRecord),diaries=C.filter(d=>d.diaryPart);assert.equal(reports.length,13);assert.equal(diaries.length,13);
 for(let i=0;i<words.length;i++){
  const e=E.create(),report=reports[i],diary=diaries[i];assert.ok(e.can(report));assert.equal(e.can(diary),false);
  const block=report.text.split('OBSERVAÇÕES\n')[1].split('\n\n')[0];
  const recovered=P.normalize(block.split('\n').map(l=>l[0]).join(''));assert.equal(recovered,words[i]);
  assert.ok(!report.text.includes(words[i]),'palavra não é escrita por inteiro no relatório');assert.match(report.text,/DIÁRIO DE ASAHI/);
  ok(e,'unlock '+recovered);assert.ok(e.can(diary));assert.ok(ok(e,'cat '+diary.path).includes(diary.text));assert.ok(diary.text.length>500);
 }
});
test('palavras sozinhas mostram o diário e permitem reler com progresso salvo',()=>{
 const words=['HERDAR','CULTIVO','HÓSPEDE','SERAFIM','CENTVEIL','SANGUE','AUSÊNCIA','VÉSPERA','SEIS','RESPIRAR','ESCOLHA','JARDIM','LEI'];
 for(let i=0;i<words.length;i++){
  const e=E.create(),diary=C.find(d=>d.diaryPart===String(i+1).padStart(2,'0'));
  const result=ok(e,'  '+words[i].toLowerCase()+'  ');
  assert.ok(result.includes(diary.text),words[i]);assert.match(result,/DIÁRIO DE ASAHI/);
  assert.ok(e.state.read.includes(diary.path));assert.ok(e.can(diary));
  assert.equal(ok(e,words[i]),result);assert.equal(e.state.keys.length,1);
  const restored=E.create(JSON.parse(JSON.stringify(e.state)));assert.equal(ok(restored,words[i]),result);
 }
 const e=E.create();assert.equal(e.run('HERDAR qualquercoisa').kind,'error');assert.equal(e.state.keys.length,0);
});
