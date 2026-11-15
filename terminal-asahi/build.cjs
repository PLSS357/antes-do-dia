const fs=require('node:fs');
const scripts=['content.js','filesystem.js','puzzles.js','engine.js','persistence.js','ui.js'].map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n');
const html=fs.readFileSync('src/index.html','utf8').replace('/* BUNDLE */',()=>scripts.replace(/<\/script/gi,'<\\/script'));
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/index.html',html);fs.writeFileSync('dist/antes_do_amanha.html',html);console.log('HTML offline gerado em dist/.');
