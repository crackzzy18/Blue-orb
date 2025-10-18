const router = require('express').Router();
const ctrl = require('../controllers/community.controller');

// Community (Nostr) endpoints
router.post('/questions', ctrl.postQuestion);
router.get('/questions', ctrl.listQuestions);
router.post('/replies', ctrl.postReply);
router.get('/replies', ctrl.listReplies);
router.get('/replies-by-author', ctrl.listRepliesByAuthor);
router.post('/delete', ctrl.deleteEvent);
router.post('/clear-all', ctrl.clearAllData);

// Optional: key generation helper
router.get('/keys', ctrl.generateKeys);

module.exports = router;


