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
  sessionStorage.setItem('nostr_nsec', nsec);
}

export function loadProfile() {
  try {
    const raw = sessionStorage.getItem('nostr_profile');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(_) { return null; }
}

export function updateProfile(partial) {
  const current = loadProfile() || {};
  const next = { ...current, ...partial };
  sessionStorage.setItem('nostr_profile', JSON.stringify(next));
  return next;
}

export function loadSecret() {
  return sessionStorage.getItem('nostr_nsec');
}

export function clearKeys() {
  sessionStorage.removeItem('nostr_profile');
  sessionStorage.removeItem('nostr_nsec');
  sessionStorage.removeItem('nostr_unread_since');
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
