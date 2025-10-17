export const SUBJECT_OPTIONS = ['Math','Science','English','Biology','Chemistry','Physics','History','Geography'];
export const GRADE_OPTIONS = ['Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6','JSS 1','JSS 2','JSS 3','SSS 1','SSS 2','SSS 3'];

function u8ToHex(u8){ return Array.from(u8).map(b=>b.toString(16).padStart(2,'0')).join(''); }

export async function generateKeypair() {
  // Use dynamic import for ES module compatibility
  const { generateSecretKey, getPublicKey } = await import('nostr-tools');
  const raw = generateSecretKey(); // Uint8Array
  const nsec = u8ToHex(raw); // store as hex string consistently
  const npub = getPublicKey(raw);
  return { nsec, npub };
}

export function saveKeysSecurely({ nsec, npub, role = 'student', username = '', bio = '' }) {
  const profile = { npub, role, username, bio };
  sessionStorage.setItem('nostr_profile', JSON.stringify(profile));
  try { localStorage.setItem('nostr_profile', JSON.stringify(profile)); } catch(_){}
  sessionStorage.setItem('nostr_nsec', nsec);
  try { localStorage.setItem('nostr_nsec', nsec); } catch(_){}
  try {
    const key = 'nostr_roles';
    const map = JSON.parse(localStorage.getItem(key) || '{}');
    if (!map[npub]) {
      map[npub] = role;
      localStorage.setItem(key, JSON.stringify(map));
    }
  } catch(_) {}
}

export function loadProfile() {
  try {
    const rawLocal = localStorage.getItem('nostr_profile');
    const raw = rawLocal || sessionStorage.getItem('nostr_profile');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(_) { return null; }
}

export function updateProfile(partial) {
  const current = loadProfile() || {};
  const next = { ...current, ...partial };
  sessionStorage.setItem('nostr_profile', JSON.stringify(next));
  try { localStorage.setItem('nostr_profile', JSON.stringify(next)); } catch(_){ }
  return next;
}

export function loadSecret() {
  return localStorage.getItem('nostr_nsec') || sessionStorage.getItem('nostr_nsec');
}

export function clearKeys() {
  sessionStorage.removeItem('nostr_profile');
  sessionStorage.removeItem('nostr_nsec');
  sessionStorage.removeItem('nostr_unread_since');
  try {
    localStorage.removeItem('nostr_profile');
    localStorage.removeItem('nostr_nsec');
  } catch(_) {}
}

export function maskNsec(nsec) {
  if (!nsec) return '';
  const str = String(nsec);
  return str.slice(0, 6) + '...' + str.slice(-6);
}

export function getUnreadSince() {
  const v = sessionStorage.getItem('nostr_unread_since');
  return v ? parseInt(v, 10) : 0;
}

export function setUnreadSince(ts) {
  sessionStorage.setItem('nostr_unread_since', String(ts));
}

export async function normalizePrivateKey(input){
  try {
    if (!input) return '';
    const str = String(input).trim();
    if (str.startsWith('nsec')) {
      const { nip19 } = await import('nostr-tools');
      const decoded = nip19.decode(str);
      if (decoded?.type === 'nsec' && decoded.data) {
        const data = decoded.data; // Uint8Array
        return u8ToHex(data);
      }
    }
    // assume hex
    return str.toLowerCase();
  } catch(_) { return String(input||''); }
}

export async function derivePublicKey(nsec) {
  try {
    const normalized = await normalizePrivateKey(nsec);
    const { getPublicKey } = await import('nostr-tools');
    const npub = getPublicKey(normalized);
    return npub;
  } catch (error) {
    console.error('Failed to derive public key:', error);
    return null;
  }
}

export function getStoredRoleForPubkey(npub){
  try {
    const map = JSON.parse(localStorage.getItem('nostr_roles') || '{}');
    return map[npub] || '';
  } catch(_) { return ''; }
}

export function setStoredRoleForPubkey(npub, role){
  try {
    const key = 'nostr_roles';
    const map = JSON.parse(localStorage.getItem(key) || '{}');
    map[npub] = role;
    localStorage.setItem(key, JSON.stringify(map));
  } catch(_) {}
}
