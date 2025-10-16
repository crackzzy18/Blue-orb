const db = require('../services/db.service');
module.exports = {
  list: async (req,res,next) => { try { const items = await db.getAll_admin_users(); res.json({ ok:true, data: items }); } catch(e){ next(e); } },
  create: async (req,res,next) => { try { const payload = req.body || {}; const created = await db.create_admin_users(payload); res.status(201).json({ok:true,data:created}); } catch(e){ next(e); } },
  update: async (req,res,next) => { try { const updated = await db.update_admin_users(req.params.id, req.body || {}); res.json({ok:true,data:updated}); } catch(e){ next(e); } },
  remove: async (req,res,next) => { try { await db.delete_admin_users(req.params.id); res.json({ok:true}); } catch(e){ next(e); } }
};
