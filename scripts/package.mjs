import {cpSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {database} from '../lib/database.js';
const dest=path.join(process.cwd(),'work','package','antes-do-dia');
if(existsSync(dest))throw new Error('A pasta de empacotamento já existe; escolha um destino novo.');
mkdirSync(dest,{recursive:true});
for(const entry of readdirSync('.')){
  if(['node_modules','.next','work','data','scripts','tsconfig.tsbuildinfo','.git'].includes(entry)||entry.startsWith('.env')&&entry!=='.env.example')continue;
  cpSync(entry,path.join(dest,entry),{recursive:true});
}
mkdirSync(path.join(dest,'scripts'));
for(const entry of readdirSync('scripts'))if(!['cleanup-qa.mjs','package.mjs'].includes(entry))cpSync(path.join('scripts',entry),path.join(dest,'scripts',entry));
mkdirSync(path.join(dest,'data'));
const seed=new DatabaseSync(path.join(dest,'data','arg.sqlite'));
seed.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
for(const row of database().prepare('SELECT * FROM settings WHERE key!=?').all('master-password')){
  seed.prepare('INSERT INTO settings VALUES(?,?)').run(row.key,row.key==='released'?'[1,2]':row.value);
}
seed.close();
console.log(dest);
