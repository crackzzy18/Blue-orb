const router = require('express').Router();
const ctrl = require('../controllers/materials.controller');

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

module.exports = router;
