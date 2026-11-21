'use strict';

const crypto = require('node:crypto');
const { buildSourcesForProfile } = require('./sources');
const { parseRssOrAtom, extractOgImageFromHtml, hostnameToPublisher, extractDomain, isValidArticleImageUrl } = require('./rssParser');
const { classifyAndScoreArticle, deduplicateAndRank } = require('./classifier');
const { getFallbackArticles } = require('./fallbackData');

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function articleIdForUrl(url) {
  return crypto.createHash('sha1').update(String(url)).digest('hex').slice(0, 16);
}

async function runWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIdx = 0;

  async function worker() {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchTextHead(url, fetchImpl, timeoutMs = 3000, maxBytes = 80 * 1024) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return { ok: false, text: '', finalUrl: url };

    if (!res.body || typeof res.body.getReader !== 'function') {
      const text = await res.text();
      return { ok: true, text: text.slice(0, maxBytes), finalUrl: res.url || url };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = '';
    while (text.length < maxBytes) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (text.includes('</head>')) break;
    }
    try {
      await reader.cancel();
    } catch {
      // ignore cancel errors
    }
    return { ok: true, text, finalUrl: res.url || url };
  } catch {
    return { ok: false, text: '', finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFullText(url, fetchImpl, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/rss+xml, application/xml, application/atom+xml, application/json, text/xml;q=0.9, */*;q=0.8',
      },
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

function parseGdeltTimestamp(seenDate) {
  if (!seenDate || typeof seenDate !== 'string') return Date.now();
  // Format: YYYYMMDDTHHMMSSZ
  const m = seenDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return Date.now();
  const ts = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
  return Number.isFinite(ts) ? ts : Date.now();
}

async function fetchGdeltFeed(queryObj, fetchImpl) {
  const raw = await fetchFullText(queryObj.url, fetchImpl, 4200);
  if (!raw || !raw.trim().startsWith('{')) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data.articles)) return [];
    return data.articles
      .filter((a) => a && a.url && a.title)
      .map((a) => ({
        title: String(a.title).trim(),
        summary: '',
        url: String(a.url).trim(),
        source: hostnameToPublisher(a.url),
        domain: a.domain || extractDomain(a.url),
        publishedAt: parseGdeltTimestamp(a.seendate),
        imageUrl: isValidArticleImageUrl(a.socialimage) ? a.socialimage : '',
        categories: [],
        feedHint: queryObj.hint,
      }));
  } catch {
    return [];
  }
}

async function enrichArticleImage(article, db, fetchImpl) {
  if (article.imageUrl && isValidArticleImageUrl(article.imageUrl)) {
    return article.imageUrl;
  }
  // Google News encrypted URLs redirect via JS/consent; skip server-side HTML fetch on news.google.com
  if (!article.url || article.domain === 'news.google.com') {
    return '';
  }

  const cached = db.getCachedOgImage(article.url);
  if (cached !== null) {
    return cached;
  }

  const head = await fetchTextHead(article.url, fetchImpl, 2400, 75 * 1024);
  if (!head.ok || !head.text) {
    db.setCachedOgImage(article.url, '');
    return '';
  }

  const og = extractOgImageFromHtml(head.text, head.finalUrl || article.url);
  db.setCachedOgImage(article.url, og || '');
  return og || '';
}

async function aggregateFeedForProfile(profile, db, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const forceRefresh = Boolean(options.forceRefresh);
  const disableNetwork = Boolean(options.disableNetwork);

  const { ageGroup, country, state, rssFeeds, gdeltQueries } = buildSourcesForProfile(profile);
  const cacheKey = `${ageGroup.id}:${country.code}:${state.toLowerCase()}`;

  let basePayload = !forceRefresh ? db.getCachedFeed(cacheKey) : null;

  if (!basePayload) {
    let rawArticles = [];
    let reachableSources = 0;

    if (!disableNetwork && typeof fetchImpl === 'function') {
      const feedJobs = [
        ...rssFeeds.map((f) => async () => {
          const xml = await fetchFullText(f.url, fetchImpl, 4500);
          if (!xml) return [];
          const parsed = parseRssOrAtom(xml, { sourceName: f.sourceName, hint: f.hint });
          if (parsed.length > 0) reachableSources++;
          return parsed;
        }),
        ...gdeltQueries.map((g) => async () => {
          const parsed = await fetchGdeltFeed(g, fetchImpl);
          if (parsed.length > 0) reachableSources++;
          return parsed;
        }),
      ];

      const batches = await runWithConcurrency(feedJobs, 10, (fn) => fn());
      for (const batch of batches) {
        if (Array.isArray(batch)) rawArticles.push(...batch);
      }
    }

    let sourceMode = 'live';
    if (rawArticles.length === 0) {
      rawArticles = getFallbackArticles(country, state);
      sourceMode = 'offline-fallback';
    }

    // Filter out cinema, celebrities, fluff & compute personalized impact scores
    const accepted = [];
    const filteredOutSamples = [];
    let filteredOutCount = 0;
    const filterBreakdown = {
      cinema_or_celebrity_fluff: 0,
      sports_entertainment_fluff: 0,
      entertainment_section: 0,
      low_life_impact_signal: 0,
      non_impacting_foreign_news: 0,
    };

    for (const raw of rawArticles) {
      const analysis = classifyAndScoreArticle(raw, {
        ageGroup: ageGroup.id,
        countryCode: country.code,
        countryName: country.name,
        state,
      });

      if (analysis.rejected) {
        filteredOutCount++;
        filterBreakdown[analysis.reason] = (filterBreakdown[analysis.reason] || 0) + 1;
        if (
          filteredOutSamples.length < 6 &&
          (analysis.reason === 'cinema_or_celebrity_fluff' || analysis.reason === 'sports_entertainment_fluff' || analysis.reason === 'entertainment_section')
        ) {
          filteredOutSamples.push({
            title: raw.title,
            source: raw.source,
            reason: analysis.reason,
          });
        }
        continue;
      }

      accepted.push({
        id: articleIdForUrl(raw.url),
        title: raw.title,
        summary: raw.summary,
        url: raw.url,
        source: raw.source,
        domain: raw.domain,
        publishedAt: raw.publishedAt,
        imageUrl: raw.imageUrl || '',
        fallbackCoverUrl: `/assets/covers/${analysis.pillar}.svg`,
        ...analysis,
      });
    }

    let ranked = deduplicateAndRank(accepted, 60);

    // Enrich top ranked articles missing an image via <meta property="og:image">
    if (sourceMode === 'live' && !disableNetwork && typeof fetchImpl === 'function') {
      const needOg = ranked.slice(0, 42).filter((a) => !a.imageUrl && a.domain !== 'news.google.com');
      await runWithConcurrency(needOg, 8, async (item) => {
        const ogUrl = await enrichArticleImage(item, db, fetchImpl);
        if (ogUrl) {
          item.imageUrl = ogUrl;
          item.rawScore += 22;
        }
      });

      // Re-rank and interleave now that og:images have been populated
      ranked = deduplicateAndRank(ranked, 48);
    } else {
      ranked = ranked.slice(0, 48);
    }

    const pillarCounts = {};
    const uniqueSources = new Set();
    for (const item of ranked) {
      pillarCounts[item.pillar] = (pillarCounts[item.pillar] || 0) + 1;
      if (item.source) uniqueSources.add(item.source);
    }

    basePayload = {
      sourceMode,
      fetchedAt: Date.now(),
      sourcesChecked: rssFeeds.length + gdeltQueries.length,
      reachableSources,
      uniquePublisherCount: uniqueSources.size,
      totalScanned: rawArticles.length,
      filteredOutCount,
      filterBreakdown,
      filteredOutSamples,
      pillarCounts,
      articles: ranked,
    };

    // Only cache live feeds so offline mode never sticks once connectivity returns
    if (sourceMode === 'live' && ranked.length > 0) {
      db.setCachedFeed(cacheKey, basePayload);
    }
  }

  // Merge user-specific interaction state & re-rank with learned adaptive affinities
  const interactions = profile?.id ? db.getUserInteractionsMap(profile.id) : new Map();
  const userAffinities = profile?.id && db.getUserTopicAffinities ? db.getUserTopicAffinities(profile.id) : {};
  const globalSignals = db.getGlobalTopicSignals ? db.getGlobalTopicSignals() : {};
  const userHasAffinities = Object.keys(userAffinities).length > 0;

  let userScoredArticles = basePayload.articles
    .filter((item) => !interactions.get(item.id)?.dismissed)
    .map((item) => {
      const stateFlags = interactions.get(item.id);
      let updated = item;

      // When the user has learned affinities, re-score dynamically so the feed adapts
      if (userHasAffinities) {
        const fresh = classifyAndScoreArticle(
          item,
          {
            ageGroup: ageGroup.id,
            countryCode: country.code,
            countryName: country.name,
            state,
          },
          { userAffinities, globalSignals }
        );

        if (!fresh.rejected) {
          updated = {
            ...item,
            ...fresh,
          };
        }
      }

      return {
        ...updated,
        liked: Boolean(stateFlags?.liked),
        saved: Boolean(stateFlags?.saved),
      };
    });

  if (userHasAffinities) {
    userScoredArticles = deduplicateAndRank(userScoredArticles, 48, { userAffinities });
  }

  return {
    ...basePayload,
    persona: {
      ageGroup: ageGroup.id,
      ageLabel: ageGroup.label,
      personaTitle: ageGroup.persona,
      personaTagline: ageGroup.tagline,
      countryCode: country.code,
      countryName: country.name,
      countryFlag: country.flag,
      state,
    },
    articles: userScoredArticles,
  };
}

module.exports = {
  aggregateFeedForProfile,
  articleIdForUrl,
};

