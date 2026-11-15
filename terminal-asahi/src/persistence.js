const ArchivePersistence=(()=>{
 const key='catastrophe.archive.v1';
 function load(){try{const raw=localStorage.getItem(key);return {data:raw?JSON.parse(raw):null}}catch{return {data:null,error:'Memória local indisponível ou danificada. A sessão continua sem garantia de persistência.'}}}
 function save(state){try{localStorage.setItem(key,JSON.stringify(state));return true}catch{return false}}
 return {load,save,key};
})();
if(typeof module!=='undefined')module.exports=ArchivePersistence;
