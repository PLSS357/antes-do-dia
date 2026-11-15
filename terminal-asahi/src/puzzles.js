const ArchivePuzzles=(()=>{
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/\s+/g,' ');
 const locks=[
  {id:'heranca',keys:['HERDAR'],hint:'/imperial/genealogy/transmissao.csr'},
  {id:'cultivo',keys:['CULTIVO'],hint:'/imperial/military/relatorio_a.txt + relatorio_b.txt'},
  {id:'hospede',keys:['HOSPEDE'],hint:'/imperial/classified/voz.hex'},
  {id:'serafim',keys:['SERAFIM'],hint:'/seraphim/research/indice.bin'},
  {id:'intermediario',keys:['CENTVEIL'],hint:'/correspondence/encrypted/canal.vig'},
  {id:'sangue',keys:['SANGUE'],hint:'/personal/recordings/convite.sub'},
  {id:'ausencia',keys:['AUSENCIA'],hint:'/home/archive/fragments/memoria.dmg'},
  {id:'vespera',keys:['VESPERA'],hint:'/seraphim/laboratory/registro_08.txt'},
  {id:'seis',keys:['SEIS'],hint:'/seraphim/restricted/operacao.idx'},
  {id:'respirar',keys:['RESPIRAR'],hint:'/seraphim/laboratory/registro_10.txt'},
  {id:'escolha',keys:['ESCOLHA'],hint:'/seraphim/laboratory/registro_11.txt'},
  {id:'testamento',keys:['RESPIRAR','ESCOLHA'],hint:'/system/unknown/.manifest'},
  {id:'jardim',keys:['JARDIM'],hint:'/seraphim/laboratory/registro_12.txt ou Jardim de Rosas e Ouro'},
  {id:'lei',keys:['LEI'],hint:'/seraphim/laboratory/registro_13.txt ou inscrições da campanha'},
  {id:'laboratorio',keys:['S17-MK'],external:true,hint:'Identificador entregue pelo mestre no laboratório'}
 ];
 function accepts(lock,key){const got=normalize(key).split('+').map(s=>s.trim()).sort();return JSON.stringify(got)===JSON.stringify([...lock.keys].sort())}
 function decode(doc,method,key){
  if(!doc.cipher||doc.cipher!==method)throw Error('decrypt: método incompatível com o envelope. Leia /boot/recovery.log.');
  const p=doc.payload;
  if(method==='caesar'){if(!/^\d{1,2}$/.test(key||''))throw Error('Use: decrypt ARQUIVO DESLOCAMENTO (0–25)');let n=Number(key);if(n>25)throw Error('Deslocamento fora de 0–25.');return [...p].map(c=>/[A-Z]/.test(c)?String.fromCharCode(65+(c.charCodeAt(0)-65-n+26)%26):c).join('')}
  if(method==='hex'){if(!/^(?:[0-9a-f]{2}\s*)+$/i.test(p))throw Error('Carga hexadecimal inválida.');return p.trim().split(/\s+/).map(x=>String.fromCharCode(parseInt(x,16))).join('')}
  if(method==='binary'){if(!/^(?:[01]{8}\s*)+$/.test(p))throw Error('Octetos inválidos.');return p.trim().split(/\s+/).map(x=>String.fromCharCode(parseInt(x,2))).join('')}
  if(method==='vigenere'){key=normalize(key||'');if(!/^[A-Z]{1,40}$/.test(key))throw Error('Use: decrypt ARQUIVO CHAVE');return [...p].map((c,i)=>String.fromCharCode(65+(c.charCodeAt(0)-key.charCodeAt(i%key.length)+26)%26)).join('')}
  if(method==='substitution')return [...p].map(c=>/[A-Z]/.test(c)?String.fromCharCode(90-(c.charCodeAt(0)-65)):c).join('');
  if(method==='rebuild')return p.split('\n').sort((a,b)=>parseInt(a)-parseInt(b)).map(s=>s.split(':')[1]).join('');
  throw Error('Método desconhecido.');
 }
 return {normalize,locks,accepts,decode};
})();
if(typeof module!=='undefined')module.exports=ArchivePuzzles;
