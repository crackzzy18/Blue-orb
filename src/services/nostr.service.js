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
  const pubkey = getPublicKey(privkey);
  const event = { kind, pubkey, created_at: Math.floor(Date.now()/1000), tags, content };
  event.id = getEventHash(event);
  event.sig = signEvent(event, privkey);
  const pub = pool.publish(relays, event);
  return await new Promise((resolve, reject) => {
    let done=false;
    pub.on('ok', relay=>{ if(!done){ done=true; resolve({ok:true, relay, id:event.id}); }});
    pub.on('failed', (relay, err)=>{ if(!done){ done=true; reject(new Error('Failed to publish')); }});
    setTimeout(()=>{ if(!done){ done=true; resolve({ok:true, timeout:true, id:event.id}); } }, 3000);
  });
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
