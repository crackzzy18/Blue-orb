const nostr = require('../services/nostr.service');

exports.generateKeys = async (req, res, next) => {
  try {
    const kp = nostr.generateKeypair();
    res.json({ ok:true, data: kp });
  } catch (err) { next(err); }
};

exports.postQuestion = async (req, res, next) => {
  try {
    const { nsec, content, subject, grade } = req.body;
    if (!nsec || !content) return res.status(400).json({ ok:false, error:'Missing' });
    const tags = [];
    // Scope all community posts to BlueOrb by a dedicated topic tag
    tags.push(['t', 'blueorb']);
    if (subject) tags.push(['t', subject]);
    if (grade) tags.push(['g', grade]);
    // Add pubkey tag for author discovery
    try {
      const { getPublicKey } = require('nostr-tools');
      const pub = getPublicKey(nsec);
      tags.push(['p', pub]);
    } catch(_){}
    const r = await nostr.publishEvent({ kind:1, content, tags, privkey: nsec });
    res.status(201).json({ ok:true, data: r });
  } catch (err) { next(err); }
};

exports.listQuestions = async (req, res, next) => {
  try {
    const { subject, grade, author } = req.query;
    const filters = [{ kinds:[1], limit:50 }];
    // Always require the BlueOrb tag to confine results to our community
    filters[0]['#t'] = subject ? ['blueorb', subject] : ['blueorb'];
    if (grade) filters[0]['#g'] = [grade];
    if (author) filters[0]['#p'] = [author];
    let events = await nostr.fetchEvents(filters, 3000);
    // Exclude replies: any event that has an 'e' tag is a reply to another
    events = (events || []).filter(ev => !Array.isArray(ev.tags) || !ev.tags.some(t => t && t[0] === 'e'));
    res.json({ ok:true, data: events });
  } catch (err) { next(err); }
};

exports.postReply = async (req, res, next) => {
  try {
    const { nsec, content, parentId } = req.body;
    if (!nsec || !content || !parentId) return res.status(400).json({ ok:false, error:'Missing' });
    const tags = [['e', parentId], ['t', 'blueorb']];
    const r = await nostr.publishEvent({ kind:1, content, tags, privkey: nsec });
    res.status(201).json({ ok:true, data: r });
  } catch (err) { next(err); }
};

exports.listReplies = async (req, res, next) => {
  try {
    const parentId = req.query.parentId;
    if (!parentId) return res.status(400).json({ ok:false, error:'Missing parentId' });
    const filters = [{ kinds:[1], limit:50, '#e':[parentId], '#t':['blueorb'] }];
    const events = await nostr.fetchEvents(filters, 3000);
    res.json({ ok:true, data: events });
  } catch (err) { next(err); }
};
