export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (trimmed.startsWith('/assets/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // invalid url
  }
  return fallback;
}

export function formatRelativeTime(ts) {
  const diffSec = Math.max(1, Math.floor((Date.now() - (Number(ts) || Date.now())) / 1000));
  if (diffSec < 60) return 'just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getStoredUid() {
  try {
    return localStorage.getItem('newcials_uid') || '';
  } catch {
    return '';
  }
}

export function setStoredUid(uid) {
  try {
    if (uid) localStorage.setItem('newcials_uid', uid);
    else localStorage.removeItem('newcials_uid');
  } catch {
    // ignore storage failures
  }
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const uid = getStoredUid();
  if (uid) headers['x-newcials-uid'] = uid;
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getMeta: () => request('/api/meta'),
  getMe: () => request('/api/auth/me'),
  createOrSignIn: (payload) =>
    request('/api/auth/account', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () =>
    request('/api/auth/logout', {
      method: 'POST',
      body: '{}',
    }),
  updateProfile: (payload) =>
    request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getFeed: ({ pillar = 'all', refresh = false } = {}) => {
    const params = new URLSearchParams();
    if (pillar) params.set('pillar', pillar);
    if (refresh) params.set('refresh', '1');
    return request(`/api/feed?${params.toString()}`);
  },
  setInteraction: (payload) =>
    request('/api/interactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSaved: () => request('/api/saved'),
};

