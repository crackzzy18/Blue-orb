require('dotenv').config();
const app = require('./app');
const db = require('./services/db.service');
const nostr = require('./services/nostr.service');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await db.init();
    nostr.initNostr([process.env.NOSTR_RELAY || 'wss://relay.damus.io']);
    console.log('Services initialized.');
    app.listen(PORT, () => {
      console.log(`Blue Orb backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
