const router = require('express').Router();
router.get('/toggle', (req,res)=>{ const q=req.query.lang||'en'; res.json({ ok:true, lang:q }); });
module.exports = router;
