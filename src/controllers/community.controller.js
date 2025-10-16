const nostr = require('../services/nostr.service');

exports.generateKeys = async (req, res, next) => {
  try {
    const kp = nostr.generateKeypair();
    res.json({ ok:true, data: kp });
  } catch (err) { next(err); }
};

exports.postQuestion = async (req, res, next) => {
  try {
    const { nsec, content, subject } = req.body;
    if (!nsec || !content) return res.status(400).json({ ok:false, error:'Missing' });
    const tags = subject ? [['t', subject]] : [];
    const r = await nostr.publishEvent({ kind:1, content, tags, privkey: nsec });
    res.status(201).json({ ok:true, data: r });
  } catch (err) { next(err); }
};

exports.listQuestions = async (req, res, next) => {
  try {
    const subject = req.query.subject;
    const filters = [{ kinds:[1], limit:50 }];
    if (subject) filters[0]['#t'] = [subject];
    const events = await nostr.fetchEvents(filters, 3000);
    res.json({ ok:true, data: events });
  } catch (err) { next(err); }
};

exports.postReply = async (req, res, next) => {
  try {
    const { nsec, content, parentId } = req.body;
    if (!nsec || !content || !parentId) return res.status(400).json({ ok:false, error:'Missing' });
    const tags = [['e', parentId]];
    const r = await nostr.publishEvent({ kind:1, content, tags, privkey: nsec });
    res.status(201).json({ ok:true, data: r });
  } catch (err) { next(err); }
};

exports.listReplies = async (req, res, next) => {
  try {
    const parentId = req.query.parentId;
    if (!parentId) return res.status(400).json({ ok:false, error:'Missing parentId' });
    const filters = [{ kinds:[1], limit:50, '#e':[parentId] }];
    const events = await nostr.fetchEvents(filters, 3000);
    res.json({ ok:true, data: events });
  } catch (err) { next(err); }
};
