/** Search only the backend's offered countries; names never create availability. */
export function walletCountrySearch(countries, locale, query = '') {
  const normalize = value => String(value).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const needle = normalize(query.trim());
  let names, collator;
  try { names = new Intl.DisplayNames(locale, { type: 'region' }); collator = new Intl.Collator(locale); } catch { /* Keep server labels. */ }
  return countries.map(item => ({ code: item.code, label: names?.of(item.code) || item.name, name: item.name }))
    .filter(item => normalize(`${item.label} ${item.name} ${item.code}`).includes(needle))
    .sort((a, b) => collator ? collator.compare(a.label, b.label) : a.label.localeCompare(b.label));
}
