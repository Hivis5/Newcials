'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildSourcesForProfile,
  CHINA_FEEDS,
  AUSTRALIA_FEEDS,
  EUROPE_FEEDS,
  NORTH_AMERICA_FEEDS,
  LATIN_AMERICA_FEEDS,
  AFRICA_FEEDS,
  SOUTHEAST_ASIA_FEEDS,
  getRegionalFeedsForCountry,
} = require('../server/sources');

test('all regional specialist feeds contain valid publication definitions and https RSS URLs', () => {
  const collections = [
    { name: 'China', feeds: CHINA_FEEDS, expectedMin: 5 },
    { name: 'Australia', feeds: AUSTRALIA_FEEDS, expectedMin: 5 },
    { name: 'Europe', feeds: EUROPE_FEEDS, expectedMin: 5 },
    { name: 'North America', feeds: NORTH_AMERICA_FEEDS, expectedMin: 5 },
    { name: 'Latin America', feeds: LATIN_AMERICA_FEEDS, expectedMin: 5 },
    { name: 'Africa', feeds: AFRICA_FEEDS, expectedMin: 5 },
    { name: 'Southeast Asia', feeds: SOUTHEAST_ASIA_FEEDS, expectedMin: 5 },
  ];

  for (const group of collections) {
    assert.ok(
      group.feeds.length >= group.expectedMin,
      `${group.name} should have at least ${group.expectedMin} feeds, found ${group.feeds.length}`
    );

    for (const f of group.feeds) {
      assert.ok(f.url.startsWith('https://') || f.url.startsWith('http://'), `${f.sourceName} URL must be valid`);
      assert.ok(f.sourceName && f.sourceName.trim().length > 0, 'sourceName must be present');
      assert.ok(f.hint, `${f.sourceName} must have a pillar hint`);
    }
  }

  // Spot-check requested publications
  const allUrls = collections.flatMap((c) => c.feeds.map((f) => f.url));
  assert.ok(allUrls.includes('https://chinadigitaltimes.net/feed'));
  assert.ok(allUrls.includes('https://pandaily.com/feed'));
  assert.ok(allUrls.includes('https://www.crikey.com.au/feed/'));
  assert.ok(allUrls.includes('https://michaelwest.com.au/feed/'));
  assert.ok(allUrls.includes('https://euobserver.com/rss.xml'));
  assert.ok(allUrls.includes('https://www.euractiv.com/feed/'));
  assert.ok(allUrls.includes('https://www.levernews.com/rss/'));
  assert.ok(allUrls.includes('https://thetyee.ca/rss2.xml'));
  assert.ok(allUrls.includes('https://latinamericareports.com/feed/'));
  assert.ok(allUrls.includes('https://en.mercopress.com/rss/'));
  assert.ok(allUrls.includes('https://www.dailymaverick.co.za/dmrss/'));
  assert.ok(allUrls.includes('https://www.howwemadeitinafrica.com/feed/'));
  assert.ok(allUrls.includes('https://newnaratif.com/feed/'));
  assert.ok(allUrls.includes('https://www.rappler.com/feed/'));
});

test('buildSourcesForProfile includes region-specific feeds for China, Australia, Europe, Americas, Africa, and SEA', () => {
  // 1. China
  const cn = buildSourcesForProfile({ age: 28, country: 'China' });
  const cnUrls = cn.rssFeeds.map((f) => f.url);
  assert.ok(cnUrls.includes('https://chinadigitaltimes.net/feed'));
  assert.ok(cnUrls.includes('https://www.scmp.com/rss/91/feed'));

  // 2. Australia
  const au = buildSourcesForProfile({ age: 29, country: 'Australia' });
  const auUrls = au.rssFeeds.map((f) => f.url);
  assert.ok(auUrls.includes('https://www.crikey.com.au/feed/'));
  assert.ok(auUrls.includes('https://michaelwest.com.au/feed/'));

  // 3. Germany (European country)
  const de = buildSourcesForProfile({ age: 35, country: 'Germany' });
  const deUrls = de.rssFeeds.map((f) => f.url);
  assert.ok(deUrls.includes('https://www.euractiv.com/feed/'));
  assert.ok(deUrls.includes('https://euobserver.com/rss.xml'));

  // 4. Brazil (South America)
  const br = buildSourcesForProfile({ age: 26, country: 'Brazil' });
  const brUrls = br.rssFeeds.map((f) => f.url);
  assert.ok(brUrls.includes('https://latinamericareports.com/feed/'));
  assert.ok(brUrls.includes('https://en.mercopress.com/rss/'));

  // 5. South Africa (Africa)
  const za = buildSourcesForProfile({ age: 31, country: 'South Africa' });
  const zaUrls = za.rssFeeds.map((f) => f.url);
  assert.ok(zaUrls.includes('https://www.dailymaverick.co.za/dmrss/'));
  assert.ok(zaUrls.includes('https://www.howwemadeitinafrica.com/feed/'));

  // 6. Singapore (Southeast Asia)
  const sg = buildSourcesForProfile({ age: 27, country: 'Singapore' });
  const sgUrls = sg.rssFeeds.map((f) => f.url);
  assert.ok(sgUrls.includes('https://newnaratif.com/feed/'));
  assert.ok(sgUrls.includes('https://www.rappler.com/feed/'));
});

test('changing to an unlisted country dynamically triggers web discovery and regional matching', () => {
  // Test when user changes country to Colombia (Latin America, not directly in COUNTRY_FEEDS)
  const co = buildSourcesForProfile({ age: 28, country: 'Colombia' });
  assert.equal(co.country.name, 'Colombia');

  // Should have Latin America regional feeds
  const coUrls = co.rssFeeds.map((f) => f.url);
  assert.ok(coUrls.includes('https://latinamericareports.com/feed/'));

  // Should have dynamic search discovery feeds for Colombia via Bing and Google
  const searchFeeds = co.rssFeeds.filter((f) => f.isSearch);
  assert.ok(searchFeeds.length >= 10, 'Expected extensive search discovery feeds for unlisted country');
  assert.ok(searchFeeds.some((f) => f.url.includes('Colombia') || f.url.includes('colombia')));

  // Should have broader GDELT queries for Colombia
  assert.ok(co.gdeltQueries.length >= 4);
  assert.ok(co.gdeltQueries.some((g) => g.url.includes('Colombia')));
});

test('feed list deduplicates duplicate URLs across layers', () => {
  const profile = { age: 27, country: 'United States', state: 'California' };
  const result = buildSourcesForProfile(profile);

  const urls = result.rssFeeds.map((f) => f.url);
  const uniqueUrls = new Set(urls);
  assert.equal(urls.length, uniqueUrls.size, 'No duplicate RSS URLs should exist in feed list');
});

