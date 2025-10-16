const router = require('express').Router();
const ctrl = require('../controllers/exams.controller');

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

module.exports = router;
