const MAX_RETRY_SECONDS = 86400;
const HTTP_DATE = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;

// A Retry-After header is either delta-seconds or an IMF-fixdate, never a URL,
// provider message or arbitrary Date.parse input. Return only a bounded number.
export function parseAuthRetryAfter(value, now = Date.now()) {
  let seconds;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) return null;
    seconds = value;
  } else if (typeof value === 'string' && value.length <= 64 && !/[\r\n]/.test(value)) {
    const text = value.trim();
    if (/^\d{1,10}$/.test(text)) seconds = Number(text);
    else if (HTTP_DATE.test(text) && Number.isFinite(now)) {
      const date = Date.parse(text);
      if (!Number.isFinite(date) || new Date(date).toUTCString() !== text) return null;
      seconds = (date - now) / 1000;
    }
  }
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(MAX_RETRY_SECONDS, Math.ceil(seconds)) : null;
}

export function authRetryAfterSeconds(value, fallback = 300, now = Date.now()) {
  return parseAuthRetryAfter(value, now) ?? parseAuthRetryAfter(fallback, now) ?? 300;
}
