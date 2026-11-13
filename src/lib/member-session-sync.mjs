// A confirmed native sign-in can replace a shared cookie without logging out.
// Notify mounted private documents without sharing identity or session data.
const eventName = 'vp:member-session-replaced';
const channelName = 'mindbliss.member-session.v1';
const prefix = 'confirmed-session-v1:';
const validMessage = value => typeof value === 'string'
  && /^confirmed-session-v1:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const subscriptions = new WeakMap();

export function subscribeMemberSessionReplacement(listener, browser = globalThis.window) {
  if (!browser?.addEventListener) return () => {};
  let entry = subscriptions.get(browser);
  if (!entry) {
    entry = { listeners: new Set(), channel: null, seen: new Set(), local: null, storage: null };
    const notify = (value, local = false) => {
      if (!validMessage(value) || entry.seen.has(value)) return;
      entry.seen.add(value);
      if (entry.seen.size > 32) entry.seen.delete(entry.seen.values().next().value);
      // Synchronous retirement may unmount other subscribers during dispatch.
      for (const callback of [...entry.listeners]) {
        try { callback({ local }); } catch { /* Keep the other owner fences active. */ }
      }
    };
    entry.local = event => notify(event.detail, true);
    entry.storage = event => { if (event.key === channelName) notify(event.newValue); };
    browser.addEventListener(eventName, entry.local);
    browser.addEventListener('storage', entry.storage);
    try {
      if (browser.BroadcastChannel) {
        entry.channel = new browser.BroadcastChannel(channelName);
        entry.channel.onmessage = event => notify(event.data);
      }
    } catch { /* Storage and the local event remain independent fallbacks. */ }
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

// Only validated same-origin native session acknowledgements call this helper.
// An opaque event ID coalesces both transports without dropping a later sign-in.
export function publishMemberSessionReplacement(browser = globalThis.window) {
  if (!browser) return;
  let message;
  try { message = `${prefix}${globalThis.crypto.randomUUID()}`; } catch { return; }
  let channel = subscriptions.get(browser)?.channel, temporary = false;
  try {
    if (!channel && browser.BroadcastChannel) { channel = new browser.BroadcastChannel(channelName); temporary = true; }
    channel?.postMessage(message);
  } catch { /* Storage remains available when channels are blocked. */ }
  finally { if (temporary) { try { channel?.close(); } catch { /* best effort */ } } }
  try {
    browser.localStorage.setItem(channelName, message);
    browser.localStorage.removeItem(channelName);
  } catch { /* Private browsing can disable storage. */ }
  try {
    const event = new Event(eventName);
    Object.defineProperty(event, 'detail', { value: message });
    browser.dispatchEvent(event);
  } catch { /* Optional notification cannot strand a verified sign-in. */ }
}
