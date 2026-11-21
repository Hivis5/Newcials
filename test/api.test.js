'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { createDatabase } = require('../server/db');
const { createRequestHandler } = require('../server/app');

function invokeHandler(handler, { method = 'GET', url = '/', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const rawBody = body ? JSON.stringify(body) : '';
    const req = Readable.from(rawBody ? [Buffer.from(rawBody, 'utf8')] : []);
    req.method = method;
    req.url = url;
    req.headers = {
      host: 'localhost:3000',
      ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
    };

    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      headersSent: false,
      writeHead(code, hdrs = {}) {
        this.statusCode = code;
        for (const [k, v] of Object.entries(hdrs)) {
          this.headers[k.toLowerCase()] = v;
        }
        this.headersSent = true;
      },
      end(data) {
        if (data) chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(String(data)));
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {
          // non-json response (e.g. HTML)
        }
        resolve({ status: this.statusCode, headers: this.headers, text, json });
      },
    };

    Promise.resolve(handler(req, res)).catch(reject);
  });
}

function mockFetch(url) {
  const s = String(url);

  if (s === 'https://www.livemint.com/economy/india-jobs-story') {
    return Promise.resolve(
      new Response(
        '<html><head><meta property="og:image" content="https://cdn.livemint.com/jobs-hero.jpg" /></head><body>ok</body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    );
  }

  if (s.includes('livemint.com/rss/economy')) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <item>
            <title>Karnataka IT hiring jumps 20% in Bengaluru as RBI holds rates steady</title>
            <link>https://www.livemint.com/economy/india-jobs-story</link>
            <description>Strong demand for working professionals aged 25-30 in India tech hubs.</description>
            <pubDate>Wed, 11 Nov 2026 09:00:00 GMT</pubDate>
          </item>
          <item>
            <title>Onion and wheat prices surge amid monsoon shortage, rattling FMCG stocks</title>
            <link>https://www.livemint.com/economy/food-monsoon-stocks</link>
            <description>Food inflation and erratic weather pressure India stock market.</description>
            <pubDate>Wed, 11 Nov 2026 08:00:00 GMT</pubDate>
            <media:content url="https://cdn.livemint.com/food-stocks.jpg" width="1200" type="image/jpeg" />
          </item>
          <item>
            <title>Bollywood superstar trailer launch and box office clash excites fans</title>
            <link>https://www.livemint.com/bollywood/trailer-clash</link>
            <description>Celebrity couple steals the red carpet spotlight.</description>
            <pubDate>Wed, 11 Nov 2026 07:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;
    return Promise.resolve(new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml' } }));
  }

  return Promise.resolve(new Response('', { status: 404 }));
}

test('HTTP API creates user, filters live mocked RSS, enriches og:image, saves reels, and updates profile', async () => {
  const db = createDatabase(':memory:');
  const handler = createRequestHandler({ db, aggregatorOptions: { fetchImpl: mockFetch } });

  try {
    // 0. Static assets & metadata endpoints serve cleanly
    const indexRes = await invokeHandler(handler, { method: 'GET', url: '/' });
    assert.equal(indexRes.status, 200);
    assert.match(indexRes.text, /Newcials/);

    const cssRes = await invokeHandler(handler, { method: 'GET', url: '/styles/main.css' });
    assert.equal(cssRes.status, 200);
    assert.match(cssRes.headers['content-type'], /text\/css/);

    const jsRes = await invokeHandler(handler, { method: 'GET', url: '/js/main.js' });
    assert.equal(jsRes.status, 200);
    assert.match(jsRes.headers['content-type'], /javascript/);

    const svgRes = await invokeHandler(handler, { method: 'GET', url: '/assets/covers/economy.svg' });
    assert.equal(svgRes.status, 200);
    assert.match(svgRes.headers['content-type'], /image\/svg\+xml/);

    const metaRes = await invokeHandler(handler, { method: 'GET', url: '/api/meta' });
    assert.equal(metaRes.status, 200);
    assert.ok(metaRes.json.countries.some((c) => c.code === 'IN' && c.states.includes('Karnataka')));
    assert.ok(metaRes.json.ageGroups.some((g) => g.id === '25-30'));

    // 1. Create account: username, age 27 (25-30), India, Karnataka
    const signupRes = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/auth/account',
      body: {
        username: 'arjun_dev',
        age: 27,
        country: 'India',
        state: 'Karnataka',
      },
    });
    assert.equal(signupRes.status, 200);
    const { user } = signupRes.json;
    assert.equal(user.username, 'arjun_dev');
    assert.equal(user.ageGroup, '25-30');
    assert.equal(user.persona, 'Working Professional');
    assert.equal(user.countryCode, 'IN');
    assert.equal(user.state, 'Karnataka');

    const headers = { 'x-newcials-uid': user.id };

    // 2. Fetch live aggregated feed
    const feedRes = await invokeHandler(handler, { method: 'GET', url: '/api/feed', headers });
    assert.equal(feedRes.status, 200);
    const feed = feedRes.json;

    assert.equal(feed.sourceMode, 'live');
    assert.equal(feed.articles.length, 2);
    assert.ok(feed.filteredOutCount >= 1);
    assert.ok(feed.filteredOutSamples.some((s) => /Bollywood/i.test(s.title)));

    // Verify og:image enrichment worked on the item lacking media:content
    const jobsItem = feed.articles.find((a) => a.url.includes('india-jobs-story'));
    assert.ok(jobsItem);
    assert.equal(jobsItem.imageUrl, 'https://cdn.livemint.com/jobs-hero.jpg');
    assert.equal(jobsItem.matchedState, 'Karnataka');

    // 3. Like and Save an article
    const interactRes = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/interactions',
      headers,
      body: {
        articleId: jobsItem.id,
        liked: true,
        saved: true,
        article: jobsItem,
      },
    });
    assert.equal(interactRes.status, 200);

    // Verify self-improving adaptive learning updated affinities in SQLite
    const userAffinities = db.getUserTopicAffinities(user.id);
    assert.ok(Object.keys(userAffinities).length > 0, 'Expected learned topic affinities in database');
    assert.ok(userAffinities['jobs']?.positiveHits > 0 || Object.values(userAffinities).some((a) => a.weight > 1.0));

    // Next feed request applies learned user preference
    const adaptedFeedRes = await invokeHandler(handler, { method: 'GET', url: '/api/feed', headers });
    assert.equal(adaptedFeedRes.status, 200);
    const adaptedItem = adaptedFeedRes.json.articles.find((a) => a.id === jobsItem.id);
    assert.ok(adaptedItem);
    assert.equal(adaptedItem.saved, true);

    const savedRes = await invokeHandler(handler, { method: 'GET', url: '/api/saved', headers });
    assert.equal(savedRes.status, 200);
    assert.equal(savedRes.json.saved.length, 1);
    assert.equal(savedRes.json.saved[0].id, jobsItem.id);

    // 4. Update profile to US / California / age 65
    const profRes = await invokeHandler(handler, {
      method: 'PUT',
      url: '/api/profile',
      headers,
      body: { age: 65, country: 'United States', state: 'California' },
    });
    assert.equal(profRes.status, 200);
    assert.equal(profRes.json.user.ageGroup, '60+');
    assert.equal(profRes.json.user.countryCode, 'US');
    assert.equal(profRes.json.user.state, 'California');
  } finally {
    db.close();
  }
});

test('HTTP API gracefully falls back to curated offline feed when network returns nothing', async () => {
  const db = createDatabase(':memory:');
  const handler = createRequestHandler({ db, aggregatorOptions: { disableNetwork: true } });

  try {
    const res = await invokeHandler(handler, {
      method: 'GET',
      url: '/api/feed?age=28&country=India&state=Maharashtra',
    });
    assert.equal(res.status, 200);
    const data = res.json;
    assert.equal(data.sourceMode, 'offline-fallback');
    assert.ok(data.articles.length >= 6);
    assert.ok(data.filteredOutCount >= 2);
    assert.ok(data.articles.every((a) => !/bollywood|oscar/i.test(a.title)));
  } finally {
    db.close();
  }
});
