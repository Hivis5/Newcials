export const store = {
  meta: {
    ageGroups: [],
    countries: [],
    pillars: {},
  },
  user: null,
  recentAccounts: [],
  feed: null,
  saved: [],
  activeTab: 'reels', // 'reels' | 'radar' | 'saved' | 'profile'
  activePillar: 'all',
  activeReelIndex: 0,
  loadingFeed: false,
};

let toastTimer = null;

export function showToast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('visible');
  }, 2400);
}

export function resolveAgeGroupMeta(age) {
  const groups = store.meta.ageGroups || [];
  const n = Number(age);
  if (!Number.isFinite(n)) return groups[1] || null;
  return groups.find((g) => n >= g.minAge && n <= g.maxAge) || groups[groups.length - 1] || null;
}

export function getStatesForCountry(countryCodeOrName) {
  const countries = store.meta.countries || [];
  const match = countries.find(
    (c) =>
      c.code.toLowerCase() === String(countryCodeOrName || '').toLowerCase() ||
      c.name.toLowerCase() === String(countryCodeOrName || '').toLowerCase()
  );
  return match?.states || [];
}

