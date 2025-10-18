const nostr = require('../services/nostr.service');

exports.generateKeys = async (req, res, next) => {
  try {
    const kp = nostr.generateKeypair();
    res.json({ ok:true, data: kp });
  } catch (err) { next(err); }
};

exports.postQuestion = async (req, res, next) => {
  try {
    const { nsec, content, subject, grade, role = 'student', allow = 'both' } = req.body;
    if (!nsec || !content) return res.status(400).json({ ok:false, error:'Missing' });
    const tags = [];
    // Scope all community posts to BlueOrb by a dedicated topic tag
    tags.push(['t', 'blueorb']);
    if (subject) tags.push(['t', subject]);
    if (grade) tags.push(['g', grade]);
    if (allow) tags.push(['perm', allow]);
    if (role) tags.push(['role', role]);
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
    const { nsec, content, parentId, role = 'teacher', tags: extraTags } = req.body;
    if (!nsec || !content || !parentId) return res.status(400).json({ ok:false, error:'Missing' });
    const tags = [['e', parentId], ['t', 'blueorb']];
    if (role) tags.push(['role', role]);
    if (Array.isArray(extraTags)) {
      extraTags.forEach(t=>{ if (Array.isArray(t) && t.length>=2) tags.push(t); });
    }
    const r = await nostr.publishEvent({ kind:1, content, tags, privkey: nsec });
    res.status(201).json({ ok:true, data: r });
  } catch (err) { next(err); }
};

exports.listReplies = async (req, res, next) => {
  try {
    const parentId = req.query.parentId;
    if (!parentId) return res.status(400).json({ ok:false, error:'Missing parentId' });
    const filters = [{ kinds:[1], limit:50, '#e':[parentId], '#t':['blueorb'] }];
    let events = await nostr.fetchEvents(filters, 3000);
    // filter out events deleted by kind 5
    const deletes = await nostr.fetchEvents([{ kinds:[5], limit:200 }], 3000);
    const deletedIds = new Set();
    (deletes||[]).forEach(d => (d.tags||[]).forEach(t=>{ if (t && t[0]==='e' && t[1]) deletedIds.add(t[1]); }));
    events = (events||[]).filter(ev => !deletedIds.has(ev.id));
    res.json({ ok:true, data: events });
  } catch (err) { next(err); }
};

exports.listRepliesByAuthor = async (req, res, next) => {
  try {
    const { author } = req.query;
    if (!author) return res.status(400).json({ ok:false, error:'Missing author' });
    const filters = [{ kinds:[1], limit:50, '#p':[author], '#t':['blueorb'] }];
    let events = await nostr.fetchEvents(filters, 3000);
    events = (events||[]).filter(ev => Array.isArray(ev.tags) && ev.tags.some(t=>t && t[0]==='e'));
    const deletes = await nostr.fetchEvents([{ kinds:[5], limit:200 }], 3000);
    const deletedIds = new Set();
    (deletes||[]).forEach(d => (d.tags||[]).forEach(t=>{ if (t && t[0]==='e' && t[1]) deletedIds.add(t[1]); }));
    events = events.filter(ev => !deletedIds.has(ev.id));
    res.json({ ok:true, data: events });
  } catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const { nsec, eventId } = req.body;
    if (!nsec || !eventId) return res.status(400).json({ ok:false, error:'Missing' });
    const tags = [['e', eventId]];
    const r = await nostr.publishEvent({ kind:5, content:'', tags, privkey: nsec });
    res.status(201).json({ ok:true, data: r });
  } catch (err) { next(err); }
};

exports.clearAllData = async (req, res, next) => {
  try {
    const { nsec } = req.body;
    if (!nsec) return res.status(400).json({ ok:false, error:'Missing private key' });
    
    // Fetch all questions and replies
    const questionFilters = [{ kinds:[1], limit:1000, '#t':['blueorb'] }];
    const allEvents = await nostr.fetchEvents(questionFilters, 5000);
    
    if (!allEvents || allEvents.length === 0) {
      return res.json({ ok:true, data: { message: 'No data found to clear', deletedCount: 0 } });
    }
    
    // Create deletion events for all found events
    const deletionPromises = allEvents.map(event => {
      const tags = [['e', event.id]];
      return nostr.publishEvent({ kind:5, content:'', tags, privkey: nsec });
    });
    
    // Execute all deletions
    const results = await Promise.allSettled(deletionPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    res.json({ 
      ok:true, 
      data: { 
        message: `Cleared ${successful} events successfully${failed > 0 ? `, ${failed} failed` : ''}`, 
        deletedCount: successful,
        failedCount: failed,
        totalFound: allEvents.length
      } 
    });
  } catch (err) { 
    console.error('Clear all data error:', err);
    next(err); 
  }
};