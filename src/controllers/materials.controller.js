const db = require('../services/db.service');

module.exports = {
  list: async (req, res, next) => {
    try {
      const items = await db.getAll_materials();
      res.json({ ok: true, data: items });
    } catch (err) { next(err); }
  },

  get: async (req, res, next) => {
    try {
      const id = req.params.id;
      const item = await db.getById_materials(id);
      if (!item) return res.status(404).json({ ok:false, error: 'Not found' });
      res.json({ ok: true, data: item });
    } catch (err) { next(err); }
  }
};
