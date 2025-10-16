const router = require('express').Router();
router.get('/test', (req,res)=>res.json({ ok:true, msg:'IPFS disabled on server; provide CID in admin payloads.' }));
module.exports = router;
