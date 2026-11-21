'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseRssOrAtom,
  extractOgImageFromHtml,
  resolvePublisherLink,
  isValidArticleImageUrl,
} = require('../server/rssParser');

test('parseRssOrAtom parses RSS 2.0 CDATA, media:content largest width, and publisher split', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
    <channel>
      <item>
        <title><![CDATA[RBI keeps repo rate steady at 6.5% amid food inflation watch - LiveMint]]></title>
        <link>https://www.livemint.com/economy/rbi-repo-rate-123.html</link>
        <description><![CDATA[<p>Borrowers await EMI relief as vegetable inflation stays elevated.</p>]]></description>
        <pubDate>Wed, 11 Nov 2026 10:00:00 GMT</pubDate>
        <media:content url="https://images.livemint.com/thumb-sm.jpg" width="300" type="image/jpeg" />
        <media:content url="https://images.livemint.com/hero-lg.jpg" width="1200" type="image/jpeg" />
      </item>
    </channel>
  </rss>`;

  const items = parseRssOrAtom(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'RBI keeps repo rate steady at 6.5% amid food inflation watch');
  assert.equal(items[0].source, 'LiveMint');
  assert.equal(items[0].imageUrl, 'https://images.livemint.com/hero-lg.jpg');
  assert.match(items[0].summary, /Borrowers await EMI relief/);
});

test('parseRssOrAtom parses Atom entries and img inside content', () => {
  const atom = `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <entry>
      <title>Tech hiring surges in Bengaluru GCC hubs</title>
      <link rel="alternate" href="https://example.org/tech-jobs" />
      <summary>&lt;img src="https://example.org/photo.jpg" /&gt;Hiring jumps 18%.</summary>
      <updated>2026-11-11T08:00:00Z</updated>
    </entry>
  </feed>`;

  const items = parseRssOrAtom(atom, { sourceName: 'TechWire' });
  assert.equal(items.length, 1);
  assert.equal(items[0].url, 'https://example.org/tech-jobs');
  assert.equal(items[0].imageUrl, 'https://example.org/photo.jpg');
  assert.equal(items[0].source, 'TechWire');
});

test('resolvePublisherLink unwraps Bing News apiclick URLs', () => {
  const bingUrl =
    'https://www.bing.com/news/apiclick.aspx?ref=FexRss&aid=&tid=123&url=https%3a%2f%2fwww.thehindu.com%2fbusiness%2feconomy.ece&c=1';
  assert.equal(resolvePublisherLink(bingUrl), 'https://www.thehindu.com/business/economy.ece');
});

test('extractOgImageFromHtml extracts og:image regardless of attribute order and rejects tracking pixels', () => {
  const html = `
    <html><head>
      <meta content="https://cdn.news.com/1x1-pixel.gif" property="twitter:image" />
      <meta content="https://cdn.news.com/hero-photo.jpg?w=1200&amp;q=85" property="og:image" />
    </head></html>`;

  const img = extractOgImageFromHtml(html, 'https://www.news.com/article');
  assert.equal(img, 'https://cdn.news.com/hero-photo.jpg?w=1200&q=85');
  assert.equal(isValidArticleImageUrl('https://news.google.com/logo.png'), false);
});

