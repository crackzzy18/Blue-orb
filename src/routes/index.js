const { Router } = require('express');
const curricula = require('./curricula.routes');
const exams = require('./exams.routes');
const materials = require('./materials.routes');
const community = require('./community.routes');
const admin = require('./admin.routes');
const lang = require('./lang.routes');
const ipfs = require('./ipfs.routes');

const router = Router();

router.use('/curricula', curricula);
router.use('/exams', exams);
router.use('/materials', materials);
router.use('/community', community);
router.use('/admin', admin);
router.use('/lang', lang);
router.use('/ipfs', ipfs);

module.exports = router;
