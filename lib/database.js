import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

let singleton;
export function database() {
  if (singleton) return singleton;
  const root = process.env.ARG_DATA_DIR || path.join(process.cwd(), 'data');
  mkdirSync(root, {recursive:true});
  const db = new DatabaseSync(path.join(root, 'arg.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, role TEXT NOT NULL, state TEXT NOT NULL, expires INTEGER NOT NULL, updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, draft TEXT NOT NULL, published TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS clues(id TEXT PRIMARY KEY, chapter INTEGER NOT NULL, title TEXT NOT NULL, text TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY, count INTEGER NOT NULL, until_time INTEGER NOT NULL);`);
  singleton = db;
  if (!setting('export-key')) setSetting('export-key',randomBytes(32).toString('hex'));
  if (!setting('released')) setSetting('released',[1,2]);
  for (const id of [3,4,6,7,8]) if (!setting(`seal-${id}`)) setSetting(`seal-${id}`,randomBytes(16).toString('hex'));
  return db;
}
export function setting(key) { const row = database().prepare('SELECT value FROM settings WHERE key=?').get(key); return row ? JSON.parse(row.value) : null; }
export function setSetting(key,value) { database().prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value)); }
export function blankProgress() { return {solved:[],found:[],notes:{},links:[],hints:{},judgment:''}; }
