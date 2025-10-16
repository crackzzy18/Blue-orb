/*
  Uses @libsql/client to interact with Turso.
  Auto-creates tables: curricula, exams, materials, admin_users.
*/
const { createClient } = require('@libsql/client');
const crypto = require('crypto');

let client = null;

function _makeId() { return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`; }

async function init() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is required (set in env).');
  client = createClient({ url, authToken: token });
  await client.execute('CREATE TABLE IF NOT EXISTS curricula (id TEXT PRIMARY KEY, title TEXT, description TEXT, subject TEXT, level TEXT, thumbnailCID TEXT, fileCID TEXT, createdAt TEXT);');
  await client.execute('CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, title TEXT, subject TEXT, year TEXT, fileCID TEXT, createdAt TEXT);');
  await client.execute('CREATE TABLE IF NOT EXISTS materials (id TEXT PRIMARY KEY, title TEXT, author TEXT, category TEXT, fileCID TEXT, createdAt TEXT);');
  await client.execute('CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, username TEXT, meta JSON, createdAt TEXT);');
  console.log('[db] Turso tables ensured.');
}

/* Curricula */
async function getAll_curricula(){ const r = await client.execute('SELECT id, title, description, subject, level, thumbnailCID, fileCID, createdAt FROM curricula ORDER BY createdAt DESC;'); return r.rows; }
async function getById_curricula(id){ const r = await client.execute('SELECT id, title, description, subject, level, thumbnailCID, fileCID, createdAt FROM curricula WHERE id = ?;', [id]); return r.rows[0] || null; }
async function create_curricula(payload){ const id = payload.id || _makeId(); const createdAt = new Date().toISOString(); await client.execute('INSERT INTO curricula (id, title, description, subject, level, thumbnailCID, fileCID, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [id, payload.title||'', payload.description||'', payload.subject||'', payload.level||'', payload.thumbnailCID||'', payload.fileCID||'', createdAt]); return { id, title: payload.title, description: payload.description, subject: payload.subject, level: payload.level, thumbnailCID: payload.thumbnailCID, fileCID: payload.fileCID, createdAt }; }
async function update_curricula(id, updates){ const existing = await getById_curricula(id); if(!existing) return null; const newObj = Object.assign({}, existing, updates, { updatedAt: new Date().toISOString() }); await client.execute('UPDATE curricula SET title = ?, description = ?, subject = ?, level = ?, thumbnailCID = ?, fileCID = ? WHERE id = ?;', [newObj.title||'', newObj.description||'', newObj.subject||'', newObj.level||'', newObj.thumbnailCID||'', newObj.fileCID||'', id]); return Object.assign({ id }, newObj); }
async function delete_curricula(id){ await client.execute('DELETE FROM curricula WHERE id = ?;', [id]); return true; }

/* Exams */
async function getAll_exams(){ const r = await client.execute('SELECT id, title, subject, year, fileCID, createdAt FROM exams ORDER BY createdAt DESC;'); return r.rows; }
async function getById_exams(id){ const r = await client.execute('SELECT id, title, subject, year, fileCID, createdAt FROM exams WHERE id = ?;', [id]); return r.rows[0] || null; }
async function create_exams(payload){ const id = payload.id || _makeId(); const createdAt = new Date().toISOString(); await client.execute('INSERT INTO exams (id, title, subject, year, fileCID, createdAt) VALUES (?, ?, ?, ?, ?, ?);', [id, payload.title||'', payload.subject||'', payload.year||'', payload.fileCID||'', createdAt]); return { id, title: payload.title, subject: payload.subject, year: payload.year, fileCID: payload.fileCID, createdAt }; }
async function update_exams(id, updates){ const existing = await getById_exams(id); if(!existing) return null; const newObj = Object.assign({}, existing, updates, { updatedAt: new Date().toISOString() }); await client.execute('UPDATE exams SET title = ?, subject = ?, year = ?, fileCID = ? WHERE id = ?;', [newObj.title||'', newObj.subject||'', newObj.year||'', newObj.fileCID||'', id]); return Object.assign({ id }, newObj); }
async function delete_exams(id){ await client.execute('DELETE FROM exams WHERE id = ?;', [id]); return true; }

/* Materials */
async function getAll_materials(){ const r = await client.execute('SELECT id, title, author, category, fileCID, createdAt FROM materials ORDER BY createdAt DESC;'); return r.rows; }
async function getById_materials(id){ const r = await client.execute('SELECT id, title, author, category, fileCID, createdAt FROM materials WHERE id = ?;', [id]); return r.rows[0] || null; }
async function create_materials(payload){ const id = payload.id || _makeId(); const createdAt = new Date().toISOString(); await client.execute('INSERT INTO materials (id, title, author, category, fileCID, createdAt) VALUES (?, ?, ?, ?, ?, ?);', [id, payload.title||'', payload.author||'', payload.category||'', payload.fileCID||'', createdAt]); return { id, title: payload.title, author: payload.author, category: payload.category, fileCID: payload.fileCID, createdAt }; }
async function update_materials(id, updates){ const existing = await getById_materials(id); if(!existing) return null; const newObj = Object.assign({}, existing, updates, { updatedAt: new Date().toISOString() }); await client.execute('UPDATE materials SET title = ?, author = ?, category = ?, fileCID = ? WHERE id = ?;', [newObj.title||'', newObj.author||'', newObj.category||'', newObj.fileCID||'', id]); return Object.assign({ id }, newObj); }
async function delete_materials(id){ await client.execute('DELETE FROM materials WHERE id = ?;', [id]); return true; }

/* Admin users */
async function getAll_admin_users(){ const r = await client.execute('SELECT id, username, meta, createdAt FROM admin_users ORDER BY createdAt DESC;'); return r.rows; }
async function create_admin_users(payload){ const id = payload.id || _makeId(); const createdAt = new Date().toISOString(); await client.execute('INSERT INTO admin_users (id, username, meta, createdAt) VALUES (?, ?, ?, ?);', [id, payload.username||'', JSON.stringify(payload.meta||{}), createdAt]); return { id, username: payload.username, meta: payload.meta, createdAt }; }
async function update_admin_users(id, updates){ const existing = (await getAll_admin_users()).find(u => u.id === id); if(!existing) return null; const newObj = Object.assign({}, existing, updates, { updatedAt: new Date().toISOString() }); await client.execute('UPDATE admin_users SET username = ?, meta = ? WHERE id = ?;', [newObj.username||'', JSON.stringify(newObj.meta||{}), id]); return Object.assign({ id }, newObj); }
async function delete_admin_users(id){ await client.execute('DELETE FROM admin_users WHERE id = ?;', [id]); return true; }

module.exports = {
  init,
  getAll_curricula, getById_curricula, create_curricula, update_curricula, delete_curricula,
  getAll_exams, getById_exams, create_exams, update_exams, delete_exams,
  getAll_materials, getById_materials, create_materials, update_materials, delete_materials,
  getAll_admin_users, create_admin_users, update_admin_users, delete_admin_users
};
