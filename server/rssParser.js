'use strict';

/**
 * Zero-dependency XML/RSS/Atom parser & OpenGraph image extractor.
 */

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  copy: '©',
  reg: '®',
  trade: '™',
  inr: '₹',
  euro: '€',
  pound: '£',
};

function decodeEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-zA-Z]+);/g, (full, name) => NAMED_ENTITIES[name.toLowerCase()] || full);
}

function stripHtml(html) {
  if (!html) return '';
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unwrapCdata(str) {
  if (!str) return '';
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function extractTagContent(block, tagNames) {
  for (const tag of tagNames) {
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i');
    const match = block.match(re);
    if (match && match[1]) {
      return unwrapCdata(match[1]);
    }
  }
  return '';
}

function extractAllTags(block, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escaped}(?:\\s+([^>]*?))?(?:\\/>|>([\\s\\S]*?)<\\/${escaped}>)`, 'gi');
  const results = [];
  let m;
  while ((m = re.exec(block)) !== null) {
    results.push({ attrs: m[1] || '', inner: unwrapCdata(m[2] || '') });
  }
  return results;
}

function parseAttributes(attrStr) {
  const attrs = {};
  if (!attrStr) return attrs;
  const re = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    const key = m[1].toLowerCase();
    const val = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
    attrs[key] = val;
  }
  return attrs;
}

function isSafeHttpUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const u = new URL(urlStr.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidArticleImageUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (trimmed.startsWith('/assets/')) return true;
  if (!isSafeHttpUrl(trimmed)) return false;

  const lower = trimmed.toLowerCase();
  const rejectPatterns = [
    '1x1',
    'pixel.',
    'spacer.',
    'blank.gif',
    'favicon',
    'sprite',
    'googleusercontent.com/s2/',
    'lh3.googleusercontent.com/j6_effect',
    'news.google.com',
    'gstatic.com/images/branding',
    'bing.com/sa/',
    'doubleclick.net',
    'scorecardresearch.com',
    'facebook.com/tr',
    '/ads/',
    'badge',
    'default-avatar',
    'site-logo',
  ];
  if (rejectPatterns.some((p) => lower.includes(p))) return false;
  if (lower.endsWith('.svg') && !lower.includes('cover')) return false;
  return true;
}

function resolveUrl(candidate, baseUrl) {
  if (!candidate) return '';
  try {
    const cleaned = decodeEntities(candidate).trim();
    if (!cleaned || cleaned.startsWith('data:')) return '';
    const resolved = new URL(cleaned, baseUrl).toString();
    return isSafeHttpUrl(resolved) ? resolved : '';
  } catch {
    return '';
  }
}

/**
 * Resolve redirect wrappers (e.g., Bing News apiclick, legacy Google News Base64)
 * into direct publisher URLs whenever possible.
 */
function resolvePublisherLink(rawLink) {
  if (!rawLink) return '';
  const cleaned = decodeEntities(rawLink).trim();
  if (!isSafeHttpUrl(cleaned)) return '';

  try {
    const u = new URL(cleaned);
    // Bing News redirect format: ...apiclick.aspx?...&url=https%3a%2f%2f...
    if (u.hostname.includes('bing.com') && u.searchParams.has('url')) {
      const target = u.searchParams.get('url');
      if (isSafeHttpUrl(target)) return target;
    }

    // Google News legacy CBMi... base64 article URL extraction
    if (u.hostname === 'news.google.com' && u.pathname.includes('/articles/')) {
      const token = u.pathname.split('/articles/')[1]?.split('?')[0] || '';
      if (token.startsWith('CBM')) {
        try {
          const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
          const buf = Buffer.from(b64, 'base64');
          const raw = buf.toString('latin1');
          const urlMatch = raw.match(/https?:\/\/[^\s\x00-\x1f"'<>\\]+/);
          if (urlMatch && isSafeHttpUrl(urlMatch[0]) && !urlMatch[0].includes('news.google.com')) {
            return urlMatch[0];
          }
        } catch {
          // Newer Google News encrypted tokens aren't plain base64; keep Google News URL so user click redirects cleanly
        }
      }
    }
  } catch {
    // ignore
  }
  return cleaned;
}

function extractImageFromItemBlock(block, rawHtmlDesc, baseUrl) {
  const candidates = [];

  // 1. media:content (choose highest width if multiple)
  const mediaContents = extractAllTags(block, 'media:content');
  let bestMedia = null;
  for (const mc of mediaContents) {
    const attrs = parseAttributes(mc.attrs);
    const url = attrs.url || attrs.href;
    if (!url) continue;
    const type = (attrs.type || '').toLowerCase();
    const medium = (attrs.medium || '').toLowerCase();
    if (type && !type.startsWith('image') && medium !== 'image') continue;
    const width = parseInt(attrs.width || '0', 10) || 0;
    if (!bestMedia || width > bestMedia.width) {
      bestMedia = { url, width };
    }
  }
  if (bestMedia) candidates.push(bestMedia.url);

  // 2. media:thumbnail
  for (const mt of extractAllTags(block, 'media:thumbnail')) {
    const attrs = parseAttributes(mt.attrs);
    if (attrs.url) candidates.push(attrs.url);
  }

  // 3. enclosure
  for (const enc of extractAllTags(block, 'enclosure')) {
    const attrs = parseAttributes(enc.attrs);
    const type = (attrs.type || '').toLowerCase();
    if (attrs.url && (!type || type.startsWith('image'))) {
      candidates.push(attrs.url);
    }
  }

  // 4. Bing News:Image or image tags
  const newsImage = extractTagContent(block, ['News:Image', 'image', 'thumb', 'thumbnail']);
  if (newsImage && !newsImage.includes('<')) {
    candidates.push(newsImage);
  } else if (newsImage) {
    const nestedUrl = extractTagContent(newsImage, ['url']);
    if (nestedUrl) candidates.push(nestedUrl);
  }

  // 5. <img src="..."> inside description / content:encoded
  const htmlSources = [
    rawHtmlDesc,
    extractTagContent(block, ['content:encoded', 'content']),
  ].filter(Boolean);

  for (const html of htmlSources) {
    const decoded = decodeEntities(html);
    const imgMatches = decoded.matchAll(/<img\b[^>]*>/gi);
    for (const m of imgMatches) {
      const attrs = parseAttributes(m[0]);
      const src = attrs['data-src'] || attrs['data-original'] || attrs.src;
      if (src) candidates.push(src);
    }
  }

  for (const cand of candidates) {
    const resolved = resolveUrl(cand, baseUrl);
    if (isValidArticleImageUrl(resolved)) {
      return resolved;
    }
  }
  return '';
}

function parseRssOrAtom(xmlText, feedMeta = {}) {
  if (!xmlText || typeof xmlText !== 'string') return [];
  const items = [];

  const isAtom = /<feed[\s>]/i.test(xmlText) && /<entry[\s>]/i.test(xmlText) && !/<item[\s>]/i.test(xmlText);
  const blockRegex = isAtom ? /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi : /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;

  let match;
  while ((match = blockRegex.exec(xmlText)) !== null) {
    const block = match[1];
    let title = decodeEntities(stripHtml(extractTagContent(block, ['title'])));
    if (!title) continue;

    // Extract link (RSS <link>text</link> or Atom <link href="..."/>)
    let rawLink = '';
    if (isAtom) {
      const links = extractAllTags(block, 'link');
      const alt = links.find((l) => {
        const a = parseAttributes(l.attrs);
        return !a.rel || a.rel === 'alternate';
      }) || links[0];
      if (alt) {
        const a = parseAttributes(alt.attrs);
        rawLink = a.href || alt.inner;
      }
    } else {
      rawLink = extractTagContent(block, ['link', 'guid']);
      if (!isSafeHttpUrl(rawLink)) {
        const guidTags = extractAllTags(block, 'guid');
        if (guidTags[0] && isSafeHttpUrl(guidTags[0].inner)) {
          rawLink = guidTags[0].inner;
        }
      }
    }

    const link = resolvePublisherLink(rawLink);
    if (!link) continue;

    const rawDesc = extractTagContent(block, ['description', 'summary', 'content:encoded', 'content']);
    let summary = stripHtml(rawDesc);

    // Google News appends " - Publisher Name" at the end of title; split cleanly if source is present
    let sourceName = '';
    const sourceTags = extractAllTags(block, 'source');
    if (sourceTags.length > 0 && sourceTags[0].inner) {
      sourceName = stripHtml(sourceTags[0].inner);
    }
    if (!sourceName) {
      sourceName = stripHtml(extractTagContent(block, ['News:Source', 'dc:creator', 'author']));
    }
    if (!sourceName && title.includes(' - ')) {
      const parts = title.split(' - ');
      const tail = parts[parts.length - 1].trim();
      if (tail.length >= 2 && tail.length <= 45) {
        sourceName = tail;
        title = parts.slice(0, -1).join(' - ').trim();
      }
    }
    if (!sourceName) {
      sourceName = feedMeta.sourceName || hostnameToPublisher(link);
    }

    // Remove redundant repeated title/publisher noise in Google News descriptions
    if (summary.toLowerCase().startsWith(title.toLowerCase())) {
      summary = summary.slice(title.length).replace(/^[\s\-–—:]+/, '').trim();
    }
    if (sourceName && summary.toLowerCase() === sourceName.toLowerCase()) {
      summary = '';
    }
    if (summary.length > 260) {
      summary = summary.slice(0, 257).replace(/\s+\S*$/, '') + '…';
    }

    const pubDateStr = extractTagContent(block, ['pubDate', 'published', 'updated', 'dc:date']);
    let publishedAt = Date.now();
    if (pubDateStr) {
      const parsed = Date.parse(pubDateStr);
      if (Number.isFinite(parsed)) publishedAt = parsed;
    }

    const categories = extractAllTags(block, 'category')
      .map((c) => stripHtml(c.inner || parseAttributes(c.attrs).term || ''))
      .filter(Boolean);

    const imageUrl = extractImageFromItemBlock(block, rawDesc, link);

    items.push({
      title,
      summary,
      url: link,
      source: sourceName,
      domain: extractDomain(link),
      publishedAt,
      imageUrl,
      categories,
      feedHint: feedMeta.hint || '',
    });
  }

  return items;
}

function extractDomain(urlStr) {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function hostnameToPublisher(urlStr) {
  const host = extractDomain(urlStr);
  if (!host) return 'News';
  const known = {
    'livemint.com': 'LiveMint',
    'economictimes.indiatimes.com': 'Economic Times',
    'thehindu.com': 'The Hindu',
    'indianexpress.com': 'Indian Express',
    'business-standard.com': 'Business Standard',
    'moneycontrol.com': 'Moneycontrol',
    'ndtv.com': 'NDTV',
    'bbci.co.uk': 'BBC News',
    'bbc.com': 'BBC News',
    'cnbc.com': 'CNBC',
    'aljazeera.com': 'Al Jazeera',
    'theguardian.com': 'The Guardian',
    'reuters.com': 'Reuters',
    'apnews.com': 'AP News',
    'bloomberg.com': 'Bloomberg',
    'ft.com': 'Financial Times',
    'deccanherald.com': 'Deccan Herald',
    'hindustantimes.com': 'Hindustan Times',
    'timesofindia.indiatimes.com': 'Times of India',
    'news.google.com': 'Google News',
  };
  if (known[host]) return known[host];
  const base = host.split('.')[0] || host;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Extract best OpenGraph / Twitter editorial image URL from an HTML head string.
 */
function extractOgImageFromHtml(html, baseUrl) {
  if (!html || typeof html !== 'string') return '';

  const candidates = [];

  // Parse <meta ...> tags regardless of attribute ordering
  const metaRegex = /<meta\b([^>]*?)>/gi;
  let m;
  while ((m = metaRegex.exec(html)) !== null) {
    const attrs = parseAttributes(m[1]);
    const key = (attrs.property || attrs.name || attrs.itemprop || '').toLowerCase();
    const content = attrs.content || attrs.value || '';
    if (!content) continue;

    if (key === 'og:image:secure_url' || key === 'og:image') {
      candidates.push({ priority: 1, url: content });
    } else if (key === 'twitter:image:src' || key === 'twitter:image') {
      candidates.push({ priority: 2, url: content });
    } else if (key === 'image' || key === 'thumbnail') {
      candidates.push({ priority: 3, url: content });
    }
  }

  // Fallback <link rel="image_src" href="...">
  const linkRegex = /<link\b([^>]*?)>/gi;
  while ((m = linkRegex.exec(html)) !== null) {
    const attrs = parseAttributes(m[1]);
    if ((attrs.rel || '').toLowerCase() === 'image_src' && attrs.href) {
      candidates.push({ priority: 4, url: attrs.href });
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  for (const c of candidates) {
    const resolved = resolveUrl(c.url, baseUrl);
    if (isValidArticleImageUrl(resolved)) {
      return resolved;
    }
  }
  return '';
}

module.exports = {
  decodeEntities,
  stripHtml,
  parseRssOrAtom,
  extractOgImageFromHtml,
  resolvePublisherLink,
  isValidArticleImageUrl,
  isSafeHttpUrl,
  extractDomain,
  hostnameToPublisher,
};

