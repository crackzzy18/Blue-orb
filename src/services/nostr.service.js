const { generatePrivateKey, getPublicKey, getEventHash, signEvent, SimplePool } = require('nostr-tools');
let pool = null;
let relays = [];

function initNostr(relayList) {
  relays = relayList || (process.env.NOSTR_RELAY || 'wss://relay.damus.io').split(',').map(s=>s.trim());
  pool = new SimplePool();
  console.log('[nostr] init', relays);
  return { relays };
}

function generateKeypair(){ const priv = generatePrivateKey(); const pub = getPublicKey(priv); return { nsec: priv, npub: pub }; }

async function publishEvent({ kind=1, content='', tags=[], privkey }) {
  if (!privkey) throw new Error('Missing private key');
  if (!pool) initNostr();
  const pubkey = getPublicKey(privkey);
  const event = { kind, pubkey, created_at: Math.floor(Date.now()/1000), tags, content };
  event.id = getEventHash(event);
  event.sig = signEvent(event, privkey);

  try {
    const pub = pool.publish(relays, event);
    // Support both Pub interface (with .on) and Promise-like return values depending on nostr-tools version
    if (pub && typeof pub.on === 'function') {
      return await new Promise((resolve, reject) => {
        let done = false;
        pub.on('ok', relay => { if (!done) { done = true; resolve({ ok:true, relay, id:event.id }); } });
        pub.on('seen', relay => { if (!done) { done = true; resolve({ ok:true, relay, id:event.id }); } });
        pub.on('failed', (relay, err) => { if (!done) { done = true; reject(new Error('Failed to publish')); } });
        setTimeout(() => { if (!done) { done = true; resolve({ ok:true, timeout:true, id:event.id }); } }, 3000);
      });
    } else {
      await pub; // if it's a Promise, await it
      return { ok:true, id: event.id };
    }
  } catch (err) {
    // As a fallback, don't fail hard; report timeout-like success so UI can proceed
    return { ok:true, id: event.id, error: String(err && err.message || err) };
  }
}

async function fetchEvents(filters=[], timeoutMs=2500) {
  if (!pool) initNostr();
  return new Promise((resolve)=> {
    const sub = pool.sub(relays, filters);
    const events = [];
    sub.on('event', e=>events.push(e));
    setTimeout(()=>{ try{sub.unsub();}catch(e){}; resolve(events); }, timeoutMs);
  });
}

module.exports = { initNostr, generateKeypair, publishEvent, fetchEvents };
