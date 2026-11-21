'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { AGE_GROUPS, COUNTRIES, PILLAR_META } = require('./profiles');
const { aggregateFeedForProfile } = require('./aggregator');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

function readJsonBody(req, maxBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk.toString('utf8');
      if (raw.length > maxBytes) {
        reject(new Error('Request payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function setSessionCookie(userId) {
  return `newcials_uid=${encodeURIComponent(userId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
}

function clearSessionCookie() {
  return 'newcials_uid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

function createRequestHandler({ db, aggregatorOptions = {} } = {}) {
  function getCurrentUser(req) {
    const cookies = parseCookies(req);
    const uid = req.headers['x-newcials-uid'] || cookies.newcials_uid;
    if (!uid) return null;
    return db.getUserById(String(uid));
  }

  async function handleApi(req, res, urlObj) {
    const { pathname, searchParams } = urlObj;

    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, service: 'newcials', time: Date.now() });
    }

    if (req.method === 'GET' && pathname === '/api/meta') {
      return sendJson(res, 200, {
        ageGroups: AGE_GROUPS,
        countries: COUNTRIES.map((c) => ({
          code: c.code,
          name: c.name,
          flag: c.flag,
          states: c.states,
        })),
        pillars: PILLAR_META,
      });
    }

    if (req.method === 'GET' && pathname === '/api/auth/me') {
      const user = getCurrentUser(req);
      const recentAccounts = db.listUsers(6).map((u) => ({
        id: u.id,
        username: u.username,
        age: u.age,
        ageLabel: u.ageLabel,
        countryCode: u.countryCode,
        countryName: u.countryName,
        countryFlag: u.countryFlag,
        state: u.state,
      }));
      return sendJson(res, 200, { user, recentAccounts });
    }

    if (req.method === 'POST' && pathname === '/api/auth/account') {
      const body = await readJsonBody(req);
      const user = db.createOrSignInUser({
        username: body.username,
        age: body.age,
        country: body.country,
        state: body.state || '',
        mode: body.mode || 'auto',
      });
      return sendJson(res, 200, { user }, { 'Set-Cookie': setSessionCookie(user.id) });
    }

    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
    }

    if (req.method === 'PUT' && pathname === '/api/profile') {
      const current = getCurrentUser(req);
      if (!current) {
        return sendJson(res, 401, { error: 'Not signed in.' });
      }
      const body = await readJsonBody(req);
      const updated = db.updateUserProfile(current.id, {
        username: body.username,
        age: body.age,
        country: body.country,
        state: body.state,
      });
      return sendJson(res, 200, { user: updated });
    }

    if (req.method === 'GET' && pathname === '/api/feed') {
      const current = getCurrentUser(req);
      const profile = current || {
        age: Number(searchParams.get('age')) || 27,
        country: searchParams.get('country') || 'India',
        state: searchParams.get('state') || '',
      };

      const forceRefresh = searchParams.get('refresh') === '1' || searchParams.get('refresh') === 'true';
      const pillarFilter = (searchParams.get('pillar') || 'all').trim();

      const feed = await aggregateFeedForProfile(profile, db, {
        ...aggregatorOptions,
        forceRefresh,
      });

      const filteredArticles =
        pillarFilter && pillarFilter !== 'all'
          ? feed.articles.filter((a) => a.pillar === pillarFilter)
          : feed.articles;

      return sendJson(res, 200, {
        ...feed,
        activePillar: pillarFilter || 'all',
        articles: filteredArticles,
      });
    }

    if (req.method === 'POST' && pathname === '/api/interactions') {
      const current = getCurrentUser(req);
      if (!current) {
        return sendJson(res, 401, { error: 'Sign in required to save or like reels.' });
      }
      const body = await readJsonBody(req);
      if (!body.articleId) {
        return sendJson(res, 400, { error: 'articleId is required.' });
      }
      const result = db.setInteraction(current.id, String(body.articleId), {
        liked: body.liked,
        saved: body.saved,
        dismissed: body.dismissed,
        article: body.article,
      });
      return sendJson(res, 200, { interaction: result });
    }

    if (req.method === 'GET' && pathname === '/api/saved') {
      const current = getCurrentUser(req);
      if (!current) {
        return sendJson(res, 401, { error: 'Not signed in.' });
      }
      const saved = db.getSavedArticles(current.id);
      return sendJson(res, 200, { saved });
    }

    return sendJson(res, 404, { error: 'API route not found' });
  }

  function serveStatic(req, res, urlObj) {
    let reqPath = decodeURIComponent(urlObj.pathname);
    if (reqPath === '/') reqPath = '/index.html';

    const resolvedPath = path.resolve(PUBLIC_DIR, `.${reqPath}`);
    if (!resolvedPath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    let targetFile = resolvedPath;
    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      targetFile = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(targetFile).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(targetFile);
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    });
    res.end(content);
  }

  return async function handleRequest(req, res) {
    try {
      const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      if (urlObj.pathname.startsWith('/api/')) {
        await handleApi(req, res, urlObj);
      } else {
        serveStatic(req, res, urlObj);
      }
    } catch (err) {
      const status = err.message && /must be|not found|already taken|valid age|required/i.test(err.message) ? 400 : 500;
      if (!res.headersSent) {
        sendJson(res, status, { error: err.message || 'Internal server error' });
      }
    }
  };
}

function createApp(options = {}) {
  const handleRequest = createRequestHandler(options);
  return http.createServer(handleRequest);
}

module.exports = {
  createApp,
  createRequestHandler,
};
