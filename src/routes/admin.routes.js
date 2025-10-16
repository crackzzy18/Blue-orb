const router = require('express').Router();
const { adminLimiter } = require('../middleware/rateLimit.middleware');
const basicAuth = require('../middleware/basicAuth.middleware');
const curriculaCtrl = require('../controllers/admin.curricula.controller');
const examsCtrl = require('../controllers/admin.exams.controller');
const materialsCtrl = require('../controllers/admin.materials.controller');
const usersCtrl = require('../controllers/users.controller');

router.use(basicAuth);
router.use(adminLimiter);

router.post('/upload/curricula', curriculaCtrl.create);
router.post('/upload/exam', examsCtrl.create);
router.post('/upload/material', materialsCtrl.create);

router.get('/curricula', curriculaCtrl.list);
router.get('/curricula/:id', curriculaCtrl.get);
router.put('/curricula/:id', curriculaCtrl.update);
router.delete('/curricula/:id', curriculaCtrl.remove);

router.get('/exams', examsCtrl.list);
router.get('/exams/:id', examsCtrl.get);
router.put('/exams/:id', examsCtrl.update);
router.delete('/exams/:id', examsCtrl.remove);

router.get('/materials', materialsCtrl.list);
router.get('/materials/:id', materialsCtrl.get);
router.put('/materials/:id', materialsCtrl.update);
router.delete('/materials/:id', materialsCtrl.remove);

// users
router.get('/users', usersCtrl.list);
router.post('/users', usersCtrl.create);
router.put('/users/:id', usersCtrl.update);
router.delete('/users/:id', usersCtrl.remove);

module.exports = router;
