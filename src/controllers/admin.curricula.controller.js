const db = require('../services/db.service');

module.exports = {
  list: async (req,res,next) => {
    try { const items = await db.getAll_curricula(); res.json({ ok:true, data: items }); } catch(e){ next(e); }
  },
  get: async (req,res,next) => {
    try { const item = await db.getById_curricula(req.params.id); if(!item) return res.status(404).json({ok:false}); res.json({ok:true,data:item}); } catch(e){ next(e); }
  },
  create: async (req,res,next) => {
    try {
      const payload = req.body || {};
      const required = ['title','subject','level'];
      const missing = required.filter(k=>!payload[k]);
      if (missing.length) return res.status(400).json({ ok:false, error:'Missing', missing });
      const created = await db.create_curricula(payload);
      res.status(201).json({ ok:true, data: created });
    } catch(e){ next(e); }
  },
  update: async (req,res,next) => {
    try { const updated = await db.update_curricula(req.params.id, req.body || {}); if(!updated) return res.status(404).json({ok:false}); res.json({ok:true,data:updated}); } catch(e){ next(e); }
  },
  remove: async (req,res,next) => {
    try { await db.delete_curricula(req.params.id); res.json({ok:true}); } catch(e){ next(e); }
  }
};
