export const SUBJECT_OPTIONS = ['Math','Science','English','Biology','Chemistry','Physics','History','Geography'];
export const GRADE_OPTIONS = ['Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6','JSS 1','JSS 2','JSS 3','SSS 1','SSS 2','SSS 3'];

export async function generateKeypair() {
  // Use dynamic import for ES module compatibility
  const { generateSecretKey, getPublicKey } = await import('nostr-tools');
  const nsec = generateSecretKey();
  const npub = getPublicKey(nsec);
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
  return nsec.slice(0, 6) + '...' + nsec.slice(-6);
}

export function getUnreadSince() {
  const v = sessionStorage.getItem('nostr_unread_since');
  return v ? parseInt(v, 10) : 0;
}

export function setUnreadSince(ts) {
  sessionStorage.setItem('nostr_unread_since', String(ts));
}

export async function derivePublicKey(nsec) {
  try {
    const { getPublicKey } = await import('nostr-tools');
    const npub = getPublicKey(nsec);
    return npub;
  } catch (error) {
    console.error('Failed to derive public key:', error);
    return null;
  }
}
