export const WALLET_TUTORIAL_VIDEO_URL = 'https://pub-e8ff1acf24ec42d68953c2801f2699ae.r2.dev/TutorialMindbliss.mp4';
export const WALLET_TUTORIAL_POSTER = '/mindbliss/wallet-tutorial-poster.svg';

const storagePrefix = 'mindbliss:wallet-tutorial:v1:';
const memoryLimit = 128;

export function createWalletTutorialPreference() {
  const claimed = new Set();

  function remember(key) {
    if (claimed.has(key)) return;
    claimed.add(key);
    if (claimed.size > memoryLimit) claimed.delete(claimed.values().next().value);
  }

  // Pass only session.subject. Storage contains no session object or credentials.
  function claim(ownerId, storage) {
    if (typeof ownerId !== 'string') return false;
    const owner = ownerId.trim();
    if (!owner || owner.length > 256) return false;

    let key;
    try { key = `${storagePrefix}${encodeURIComponent(owner)}`; }
    catch { return false; }

    try {
      if (storage?.getItem(key) === 'seen') {
        remember(key);
        return false;
      }
    } catch { /* Browser storage can be blocked or unavailable. */ }

    const alreadyClaimed = claimed.has(key);
    try { storage?.setItem(key, 'seen'); }
    catch { /* Keep document-local deduplication when persistence fails. */ }
    remember(key);
    return !alreadyClaimed;
  }

  return { claim };
}

const preference = createWalletTutorialPreference();

export function claimWalletTutorial(ownerId, storage) {
  return preference.claim(ownerId, storage);
}
