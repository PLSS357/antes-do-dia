import { mkdirSync, writeFileSync } from 'node:fs';
import { printMaterials, materialCards } from '../lib/print-materials.js';
mkdirSync('work',{recursive:true});
writeFileSync('work/materials-export.json',JSON.stringify(Object.fromEntries(['session-1','session-2','post-oneshot'].map(set=>[set,materialCards(set)]))));
for(const set of ['session-1','session-2','post-oneshot']){
  mkdirSync(`materials/${set}`,{recursive:true});
  for(const styled of [true,false])writeFileSync(`materials/${set}/${styled?'estilizado':'legivel'}.html`,printMaterials(set,styled));
}
console.log('Materiais HTML A4 gerados com os selos desta instalação. Imprima pelo navegador ou salve como PDF. Não distribua a pasta pós-one-shot antecipadamente.');
