const ArchiveFS=(()=>{
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function resolve(path='',cwd='/home/archive'){
  path=path.replace(/^~(?=\/|$)/,'/home/archive');
  const parts=(path.startsWith('/')?path:cwd+'/'+path).split('/'),out=[];
  for(const p of parts){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}
  return '/'+out.join('/');
 }
 function create(content){
  const files=new Map(content.map(d=>[d.path,d])),dirs=new Set(['/']);
  for(const d of content){let p=d.path;while((p=p.slice(0,p.lastIndexOf('/'))))dirs.add(p)}
  for(const p of ['/personal/letters','/seraphim/subjects','/system/unknown'])dirs.add(p);
  const get=p=>files.get(p),isDir=p=>dirs.has(p);
  function children(p,hidden=false){return [...dirs,...files.keys()].filter(x=>x!==p&&x.slice(0,x.lastIndexOf('/'))===(p==='/'?'':p)).filter(x=>hidden||!x.split('/').pop().startsWith('.')).sort()}
  return {files,dirs,get,isDir,children};
 }
 return {normalize,resolve,create};
})();
if(typeof module!=='undefined')module.exports=ArchiveFS;
