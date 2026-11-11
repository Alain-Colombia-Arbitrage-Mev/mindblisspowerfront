// This signal contains no identity, credential or financial data. It only
// retires an already mounted private document after a confirmed server logout.
const eventName = 'vp:member-logout';
const channelName = 'mindbliss.member-logout.v1';
const storageKey = 'mindbliss.member-logout.v1';
const message = 'confirmed-logout-v1';
const subscriptions = new WeakMap();

export function subscribeMemberLogout(listener, browser = globalThis.window) {
  if (!browser) return () => {};
  let entry = subscriptions.get(browser);
  if (!entry) {
    entry = { listeners: new Set(), channel: null, notified: false, local: null, storage: null };
    const notify = (local = false) => {
      if (entry.notified) return;
      entry.notified = true;
      // A listener may synchronously unmount the private tree. Snapshot first
      // so wallet cancellation subscribers still receive this same signal.
      for (const callback of [...entry.listeners]) {
        try { callback({ local }); } catch { /* One cleanup cannot prevent the others. */ }
      }
    };
    entry.local = () => notify(true);
    entry.storage = event => { if (event.key === storageKey && event.newValue === message) notify(); };
    browser.addEventListener(eventName, entry.local);
    browser.addEventListener('storage', entry.storage);
    try {
      if (browser.BroadcastChannel) {
        entry.channel = new browser.BroadcastChannel(channelName);
        entry.channel.onmessage = event => { if (event.data === message) notify(); };
      }
    } catch { /* Storage and the local signal remain available. */ }
    subscriptions.set(browser, entry);
  }
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
    if (entry.listeners.size) return;
    browser.removeEventListener(eventName, entry.local);
    browser.removeEventListener('storage', entry.storage);
    try { entry.channel?.close(); } catch { /* best effort */ }
    if (subscriptions.get(browser) === entry) subscriptions.delete(browser);
  };
}

export function publishMemberLogout(browser = globalThis.window) {
  if (!browser) return;
  // Send cross-document signals before a local listener starts navigation.
  let channel = subscriptions.get(browser)?.channel;
  let temporary = false;
  try {
    if (!channel && browser.BroadcastChannel) { channel = new browser.BroadcastChannel(channelName); temporary = true; }
    channel?.postMessage(message);
  } catch { /* The storage fallback is independent of BroadcastChannel. */ }
  finally { if (temporary) { try { channel?.close(); } catch { /* best effort */ } } }
  try {
    browser.localStorage.setItem(storageKey, message);
    browser.localStorage.removeItem(storageKey);
  } catch { /* Private mode may disable storage. */ }
  browser.dispatchEvent(new Event(eventName));
}
