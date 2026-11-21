'use strict';

const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { resolveAgeGroup, resolveCountry } = require('./profiles');

function createDatabase(dbPath = process.env.NEWCIALS_DB_PATH || path.join(__dirname, '..', 'newcials.db')) {
  const db = new DatabaseSync(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_username TEXT NOT NULL,
      age INTEGER NOT NULL,
      age_group TEXT NOT NULL,
      country_code TEXT NOT NULL,
      country_name TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_interactions (
      user_id TEXT NOT NULL,
      article_id TEXT NOT NULL,
      liked INTEGER NOT NULL DEFAULT 0,
      saved INTEGER NOT NULL DEFAULT 0,
      dismissed INTEGER NOT NULL DEFAULT 0,
      article_json TEXT,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, article_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feed_cache (
      cache_key TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS og_image_cache (
      url TEXT PRIMARY KEY,
      image_url TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_topic_affinities (
      user_id TEXT NOT NULL,
      topic_key TEXT NOT NULL,
      weight REAL NOT NULL DEFAULT 1.0,
      positive_hits INTEGER NOT NULL DEFAULT 0,
      negative_hits INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, topic_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS global_topic_signals (
      topic_key TEXT PRIMARY KEY,
      positive_hits INTEGER NOT NULL DEFAULT 0,
      negative_hits INTEGER NOT NULL DEFAULT 0,
      weight_multiplier REAL NOT NULL DEFAULT 1.0,
      updated_at INTEGER NOT NULL
    );
  `);

  function formatUser(row) {
    if (!row) return null;
    const ageGroup = resolveAgeGroup(row.age_group || row.age);
    const country = resolveCountry(row.country_code || row.country_name);
    return {
      id: row.id,
      username: row.display_username,
      handle: row.username,
      age: row.age,
      ageGroup: ageGroup.id,
      ageLabel: ageGroup.label,
      persona: ageGroup.persona,
      personaTagline: ageGroup.tagline,
      countryCode: country.code,
      countryName: row.country_name || country.name,
      countryFlag: country.flag,
      state: row.state || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function normalizeUsername(raw) {
    return String(raw || '')
      .trim()
      .replace(/^@+/, '')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .slice(0, 32);
  }

  function createOrSignInUser({ username, age, country, state = '', mode = 'auto' }) {
    const cleanDisplay = normalizeUsername(username);
    if (!cleanDisplay || cleanDisplay.length < 2) {
      throw new Error('Username must be at least 2 characters (letters, numbers, ., _, -).');
    }
    const handle = cleanDisplay.toLowerCase();

    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(handle);
    if (mode === 'signin') {
      if (!existing) throw new Error(`Account @${handle} not found.`);
      return formatUser(existing);
    }

    const numericAge = Number(age);
    if (!Number.isFinite(numericAge) || numericAge < 13 || numericAge > 110) {
      throw new Error('Please enter a valid age between 13 and 110.');
    }

    const ageGroup = resolveAgeGroup(numericAge);
    const resolvedCountry = resolveCountry(country);
    const cleanState = String(state || '').trim().slice(0, 60);
    const now = Date.now();

    if (existing) {
      // Update profile if user creates/logs in with updated age/country/state
      db.prepare(`
        UPDATE users
        SET display_username = ?, age = ?, age_group = ?, country_code = ?, country_name = ?, state = ?, updated_at = ?
        WHERE id = ?
      `).run(cleanDisplay, Math.round(numericAge), ageGroup.id, resolvedCountry.code, resolvedCountry.name, cleanState, now, existing.id);
      return getUserById(existing.id);
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, username, display_username, age, age_group, country_code, country_name, state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, handle, cleanDisplay, Math.round(numericAge), ageGroup.id, resolvedCountry.code, resolvedCountry.name, cleanState, now, now);

    return getUserById(id);
  }

  function getUserById(id) {
    if (!id) return null;
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return formatUser(row);
  }

  function getUserByUsername(username) {
    const handle = normalizeUsername(username).toLowerCase();
    if (!handle) return null;
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(handle);
    return formatUser(row);
  }

  function updateUserProfile(userId, { username, age, country, state }) {
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existing) throw new Error('User not found.');

    const cleanDisplay = username ? normalizeUsername(username) : existing.display_username;
    if (!cleanDisplay || cleanDisplay.length < 2) {
      throw new Error('Username must be at least 2 characters.');
    }
    const handle = cleanDisplay.toLowerCase();
    if (handle !== existing.username) {
      const collision = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(handle, userId);
      if (collision) throw new Error(`Username @${handle} is already taken.`);
    }

    const numericAge = age !== undefined ? Number(age) : existing.age;
    if (!Number.isFinite(numericAge) || numericAge < 13 || numericAge > 110) {
      throw new Error('Please enter a valid age between 13 and 110.');
    }

    const ageGroup = resolveAgeGroup(numericAge);
    const resolvedCountry = country ? resolveCountry(country) : resolveCountry(existing.country_code);
    const cleanState = state !== undefined ? String(state || '').trim().slice(0, 60) : existing.state;
    const now = Date.now();

    db.prepare(`
      UPDATE users
      SET username = ?, display_username = ?, age = ?, age_group = ?, country_code = ?, country_name = ?, state = ?, updated_at = ?
      WHERE id = ?
    `).run(handle, cleanDisplay, Math.round(numericAge), ageGroup.id, resolvedCountry.code, resolvedCountry.name, cleanState, now, userId);

    return getUserById(userId);
  }

  function listUsers(limit = 10) {
    const rows = db.prepare('SELECT * FROM users ORDER BY updated_at DESC LIMIT ?').all(limit);
    return rows.map(formatUser);
  }

  function setInteraction(userId, articleId, { liked, saved, dismissed, article }) {
    const existing = db
      .prepare('SELECT * FROM user_interactions WHERE user_id = ? AND article_id = ?')
      .get(userId, articleId);

    const nextLiked = liked !== undefined ? (liked ? 1 : 0) : existing ? existing.liked : 0;
    const nextSaved = saved !== undefined ? (saved ? 1 : 0) : existing ? existing.saved : 0;
    const nextDismissed = dismissed !== undefined ? (dismissed ? 1 : 0) : existing ? existing.dismissed : 0;
    const nextJson = article ? JSON.stringify(article) : existing?.article_json || null;
    const now = Date.now();

    db.prepare(`
      INSERT INTO user_interactions (user_id, article_id, liked, saved, dismissed, article_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, article_id) DO UPDATE SET
        liked = excluded.liked,
        saved = excluded.saved,
        dismissed = excluded.dismissed,
        article_json = COALESCE(excluded.article_json, user_interactions.article_json),
        updated_at = excluded.updated_at
    `).run(userId, articleId, nextLiked, nextSaved, nextDismissed, nextJson, now);

    // Online learning: update user topic affinity & global signals
    let targetType = null;
    if (dismissed === true) targetType = 'dismiss';
    else if (saved === true) targetType = 'save';
    else if (liked === true) targetType = 'like';

    if (targetType && article) {
      const topicKeys = [];
      if (Array.isArray(article.subTopics)) topicKeys.push(...article.subTopics);
      if (article.pillar) topicKeys.push(article.pillar);
      if (Array.isArray(article.keyEntities)) topicKeys.push(...article.keyEntities);
      if (topicKeys.length > 0) {
        recordTopicFeedback(userId, topicKeys, targetType);
      }
    }

    return {
      articleId,
      liked: Boolean(nextLiked),
      saved: Boolean(nextSaved),
      dismissed: Boolean(nextDismissed),
    };
  }

  function recordTopicFeedback(userId, topicKeys = [], interactionType = 'like') {
    if (!userId || !Array.isArray(topicKeys) || topicKeys.length === 0) return;
    const isPositive = interactionType === 'like' || interactionType === 'save' || interactionType === 'read';
    const isNegative = interactionType === 'dismiss' || interactionType === 'hide';
    if (!isPositive && !isNegative) return;

    const deltaPos = interactionType === 'save' ? 2 : isPositive ? 1 : 0;
    const deltaNeg = isNegative ? 2 : 0;
    const now = Date.now();

    for (const rawKey of topicKeys) {
      if (!rawKey || typeof rawKey !== 'string') continue;
      const key = rawKey.trim().toLowerCase().slice(0, 80);
      if (key.length < 2) continue;

      try {
        const userRow = db
          .prepare('SELECT positive_hits, negative_hits, weight FROM user_topic_affinities WHERE user_id = ? AND topic_key = ?')
          .get(userId, key);

        const pUser = (userRow?.positive_hits || 0) + deltaPos;
        const nUser = (userRow?.negative_hits || 0) + deltaNeg;
        // Adaptive sigmoid-like weight curve: neutral 1.0, scales from 0.15 to 3.5
        const newWeight = Math.max(0.15, Math.min(3.5, 1.0 + (pUser * 0.35) - (nUser * 0.5)));

        db.prepare(`
          INSERT INTO user_topic_affinities (user_id, topic_key, weight, positive_hits, negative_hits, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, topic_key) DO UPDATE SET
            weight = excluded.weight,
            positive_hits = excluded.positive_hits,
            negative_hits = excluded.negative_hits,
            updated_at = excluded.updated_at
        `).run(userId, key, newWeight, pUser, nUser, now);

        const globalRow = db
          .prepare('SELECT positive_hits, negative_hits, weight_multiplier FROM global_topic_signals WHERE topic_key = ?')
          .get(key);

        const pGlob = (globalRow?.positive_hits || 0) + deltaPos;
        const nGlob = (globalRow?.negative_hits || 0) + deltaNeg;
        const totalGlob = pGlob + nGlob;
        const ratio = (pGlob + 2) / (totalGlob + 4);
        const globMultiplier = Math.max(0.4, Math.min(2.0, ratio * 2));

        db.prepare(`
          INSERT INTO global_topic_signals (topic_key, positive_hits, negative_hits, weight_multiplier, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(topic_key) DO UPDATE SET
            positive_hits = excluded.positive_hits,
            negative_hits = excluded.negative_hits,
            weight_multiplier = excluded.weight_multiplier,
            updated_at = excluded.updated_at
        `).run(key, pGlob, nGlob, globMultiplier, now);
      } catch {
        // non-fatal
      }
    }
  }

  function getUserTopicAffinities(userId) {
    if (!userId) return {};
    try {
      const rows = db.prepare('SELECT topic_key, weight, positive_hits, negative_hits FROM user_topic_affinities WHERE user_id = ?').all(userId);
      const map = {};
      for (const r of rows) {
        map[r.topic_key] = {
          weight: r.weight,
          positiveHits: r.positive_hits,
          negativeHits: r.negative_hits,
        };
      }
      return map;
    } catch {
      return {};
    }
  }

  function getGlobalTopicSignals() {
    try {
      const rows = db.prepare('SELECT topic_key, weight_multiplier FROM global_topic_signals').all();
      const map = {};
      for (const r of rows) {
        map[r.topic_key] = r.weight_multiplier;
      }
      return map;
    } catch {
      return {};
    }
  }

  function getUserInteractionsMap(userId) {
    const rows = db.prepare('SELECT * FROM user_interactions WHERE user_id = ?').all(userId);
    const map = new Map();
    for (const r of rows) {
      map.set(r.article_id, {
        liked: Boolean(r.liked),
        saved: Boolean(r.saved),
        dismissed: Boolean(r.dismissed),
      });
    }
    return map;
  }

  function getSavedArticles(userId) {
    const rows = db
      .prepare('SELECT * FROM user_interactions WHERE user_id = ? AND saved = 1 AND article_json IS NOT NULL ORDER BY updated_at DESC')
      .all(userId);
    const saved = [];
    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.article_json);
        saved.push({
          ...parsed,
          liked: Boolean(r.liked),
          saved: true,
        });
      } catch {
        // skip corrupted json
      }
    }
    return saved;
  }

  function getCachedFeed(cacheKey, maxAgeMs = 20 * 60 * 1000) {
    const row = db.prepare('SELECT payload_json, fetched_at FROM feed_cache WHERE cache_key = ?').get(cacheKey);
    if (!row) return null;
    if (Date.now() - row.fetched_at > maxAgeMs) return null;
    try {
      return JSON.parse(row.payload_json);
    } catch {
      return null;
    }
  }

  function setCachedFeed(cacheKey, payload) {
    db.prepare(`
      INSERT INTO feed_cache (cache_key, payload_json, fetched_at)
      VALUES (?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        payload_json = excluded.payload_json,
        fetched_at = excluded.fetched_at
    `).run(cacheKey, JSON.stringify(payload), Date.now());
  }

  function getCachedOgImage(url, maxAgeMs = 24 * 60 * 60 * 1000) {
    const row = db.prepare('SELECT image_url, fetched_at FROM og_image_cache WHERE url = ?').get(url);
    if (!row) return null;
    if (Date.now() - row.fetched_at > maxAgeMs) return null;
    return row.image_url;
  }

  function setCachedOgImage(url, imageUrl) {
    db.prepare(`
      INSERT INTO og_image_cache (url, image_url, fetched_at)
      VALUES (?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        image_url = excluded.image_url,
        fetched_at = excluded.fetched_at
    `).run(url, imageUrl || '', Date.now());
  }

  function close() {
    db.close();
  }

  return {
    createOrSignInUser,
    getUserById,
    getUserByUsername,
    updateUserProfile,
    listUsers,
    setInteraction,
    getUserInteractionsMap,
    getSavedArticles,
    getCachedFeed,
    setCachedFeed,
    getCachedOgImage,
    setCachedOgImage,
    recordTopicFeedback,
    getUserTopicAffinities,
    getGlobalTopicSignals,
    close,
  };
}

module.exports = {
  createDatabase,
};

