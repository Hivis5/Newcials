'use strict';

const { resolveAgeGroup, resolveCountry } = require('./profiles');

/**
 * Builds a tailored set of multi-website RSS & JSON news sources
 * for the user's age group, country, and optional state.
 *
 * Three layers:
 *   1. GLOBAL always-on feeds (world news, economics, tech & security, global regional monitors)
 *   2. Regional & Country-specific curated editorial feeds
 *      (China, Australia, Europe, North America, Latin America, Africa, Southeast Asia, India, etc.)
 *   3. Dynamic search-based discovery (Bing News RSS + Google News RSS + GDELT)
 *      — automatically searches the internet for ANY country when changed or added
 */

// ═══════════════════════════════════════════════════════════════════
//  LAYER 1: GLOBAL ALWAYS-ON FEEDS
//  Included for every user regardless of country
// ═══════════════════════════════════════════════════════════════════

// ─── Global & World News ────────────────────────────────────────

const GLOBAL_WORLD_INDEPENDENT = [
  { url: 'https://www.propublica.org/feeds/propublica/main', sourceName: 'ProPublica', hint: 'world_impact', tier: 'independent' },
  { url: 'https://theintercept.com/feed/?rss', sourceName: 'The Intercept', hint: 'world_impact', tier: 'independent' },
  { url: 'https://www.semafor.com/rss.xml', sourceName: 'Semafor', hint: 'world_impact', tier: 'independent' },
  { url: 'https://globalpressjournal.com/feed/', sourceName: 'Global Press Journal', hint: 'world_impact', tier: 'independent' },
  { url: 'https://warontherocks.com/feed/', sourceName: 'War on the Rocks', hint: 'world_impact', tier: 'independent' },
  { url: 'https://www.dropsitenews.com/feed', sourceName: 'Drop Site News', hint: 'world_impact', tier: 'independent' },
];

const GLOBAL_WORLD_MAJOR = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', sourceName: 'BBC World', hint: 'world_impact', tier: 'major' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', sourceName: 'Al Jazeera', hint: 'world_impact', tier: 'major' },
  { url: 'https://rss.dw.com/rdf/rss-en-top', sourceName: 'Deutsche Welle', hint: 'world_impact', tier: 'major' },
  { url: 'https://www.france24.com/en/rss', sourceName: 'France 24', hint: 'world_impact', tier: 'major' },
  { url: 'https://www.theguardian.com/world/rss', sourceName: 'The Guardian', hint: 'world_impact', tier: 'major' },
  { url: 'https://feeds.npr.org/1001/rss.xml', sourceName: 'NPR News', hint: 'world_impact', tier: 'major' },
];

// ─── Global Economic & Financial ────────────────────────────────

const GLOBAL_ECONOMICS_INDEPENDENT = [
  { url: 'https://mostlyeconomics.wordpress.com/feed/', sourceName: 'Mostly Economics', hint: 'economy', tier: 'independent' },
  { url: 'https://marginalrevolution.com/feed', sourceName: 'Marginal Revolution', hint: 'economy', tier: 'independent' },
  { url: 'https://www.nakedcapitalism.com/feed', sourceName: 'Naked Capitalism', hint: 'economy', tier: 'independent' },
  { url: 'https://wolfstreet.com/feed/', sourceName: 'Wolf Street', hint: 'economy', tier: 'independent' },
];

const GLOBAL_ECONOMICS_MAJOR = [
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', sourceName: 'BBC Business', hint: 'economy', tier: 'major' },
  { url: 'https://www.theguardian.com/business/economics/rss', sourceName: 'The Guardian Economics', hint: 'economy', tier: 'major' },
  { url: 'https://www.ft.com/world?format=rss', sourceName: 'Financial Times', hint: 'economy', tier: 'major' },
  { url: 'https://www.economist.com/the-world-this-week/rss.xml', sourceName: 'The Economist', hint: 'economy', tier: 'major' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258', sourceName: 'CNBC Economy', hint: 'economy', tier: 'major' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362', sourceName: 'CNBC World', hint: 'world_impact', tier: 'major' },
];

// ─── Technology & Software ──────────────────────────────────────

const GLOBAL_TECH_INDEPENDENT = [
  { url: 'https://www.404media.co/rss/', sourceName: '404 Media', hint: 'world_impact', tier: 'independent' },
  { url: 'https://themarkup.org/feeds/rss.xml', sourceName: 'The Markup', hint: 'world_impact', tier: 'independent' },
  { url: 'https://stratechery.com/feed/', sourceName: 'Stratechery', hint: 'economy', tier: 'independent' },
  { url: 'https://pluralistic.net/feed/', sourceName: 'Pluralistic', hint: 'world_impact', tier: 'independent' },
  { url: 'https://www.wheresyoured.at/rss/', sourceName: "Where's Your Ed At", hint: 'economy', tier: 'independent' },
  { url: 'https://krebsonsecurity.com/feed/', sourceName: 'Krebs on Security', hint: 'world_impact', tier: 'independent' },
  { url: 'https://daringfireball.net/feeds/main', sourceName: 'Daring Fireball', hint: 'economy', tier: 'independent' },
];

const GLOBAL_TECH_AGGREGATORS = [
  { url: 'https://news.ycombinator.com/rss', sourceName: 'Hacker News', hint: 'jobs', tier: 'aggregator' },
  { url: 'https://lobste.rs/rss', sourceName: 'Lobsters', hint: 'jobs', tier: 'aggregator' },
  { url: 'https://www.techmeme.com/feed.xml', sourceName: 'Techmeme', hint: 'economy', tier: 'aggregator' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', sourceName: 'Ars Technica', hint: 'world_impact', tier: 'major' },
  { url: 'https://www.technologyreview.com/topnews.rss', sourceName: 'MIT Technology Review', hint: 'world_impact', tier: 'major' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', sourceName: 'The Hacker News', hint: 'world_impact', tier: 'major' },
];


// ═══════════════════════════════════════════════════════════════════
//  LAYER 2: REGIONAL SPECIALIST FEEDS
// ═══════════════════════════════════════════════════════════════════

// ─── 1. China Feeds ─────────────────────────────────────────────
const CHINA_FEEDS = [
  { url: 'https://chinadigitaltimes.net/feed', sourceName: 'China Digital Times', hint: 'world_impact', tier: 'independent' },
  { url: 'https://chinamediaproject.org/feed', sourceName: 'China Media Project', hint: 'world_impact', tier: 'independent' },
  { url: 'https://pandaily.com/feed', sourceName: 'Pandaily', hint: 'economy', tier: 'independent' },
  { url: 'https://www.whatsonweibo.com/feed/', sourceName: "What's on Weibo", hint: 'world_impact', tier: 'independent' },
  { url: 'https://www.scmp.com/rss/91/feed', sourceName: 'South China Morning Post', hint: 'economy', tier: 'major' },
];

// ─── 2. Australia Feeds ─────────────────────────────────────────
const AUSTRALIA_FEEDS = [
  { url: 'https://www.crikey.com.au/feed/', sourceName: 'Crikey', hint: 'economy', tier: 'independent' },
  { url: 'https://feeds.feedburner.com/IndependentAustralia', sourceName: 'Independent Australia', hint: 'economy', tier: 'independent' },
  { url: 'https://michaelwest.com.au/feed/', sourceName: 'Michael West Media', hint: 'economy', tier: 'independent' },
  { url: 'https://www.abc.net.au/news/feed/2942460/rss.xml', sourceName: 'ABC News Australia', hint: 'state', tier: 'major' },
  { url: 'https://www.smh.com.au/rss/feed.xml', sourceName: 'The Sydney Morning Herald', hint: 'economy', tier: 'major' },
];

// ─── 3. Europe Feeds ────────────────────────────────────────────
const EUROPE_FEEDS = [
  { url: 'https://euobserver.com/rss.xml', sourceName: 'EUobserver', hint: 'world_impact', tier: 'independent' },
  { url: 'https://www.euractiv.com/feed/', sourceName: 'Euractiv', hint: 'economy', tier: 'independent' },
  { url: 'https://voxeurop.eu/en/feed/', sourceName: 'VoxEurop', hint: 'world_impact', tier: 'independent' },
  { url: 'https://feeds.feedburner.com/TheBalticTimesNews', sourceName: 'The Baltic Times', hint: 'economy', tier: 'independent' },
  { url: 'https://feeds.feedburner.com/euronews/en/home', sourceName: 'Euronews', hint: 'world_impact', tier: 'major' },
];

// ─── 4. North America (USA & Canada) ───────────────────────────
const NORTH_AMERICA_FEEDS = [
  { url: 'https://www.levernews.com/rss/', sourceName: 'The Lever', hint: 'economy', tier: 'independent' },
  { url: 'https://thetyee.ca/rss2.xml', sourceName: 'The Tyee', hint: 'economy', tier: 'independent' },
  { url: 'https://www.pbs.org/newshour/feeds/rss/headlines', sourceName: 'PBS NewsHour', hint: 'world_impact', tier: 'major' },
  { url: 'https://www.cbc.ca/webfeed/rss/rss-topstories', sourceName: 'CBC News (Canada)', hint: 'state', tier: 'major' },
  { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', sourceName: 'MarketWatch', hint: 'economy', tier: 'major' },
];

// ─── 5. South America & Latin America ───────────────────────────
const LATIN_AMERICA_FEEDS = [
  { url: 'https://latinamericareports.com/feed/', sourceName: 'Latin America Reports', hint: 'world_impact', tier: 'independent' },
  { url: 'https://en.mercopress.com/rss/', sourceName: 'MercoPress', hint: 'economy', tier: 'independent' },
  { url: 'https://www.brasildefato.com.br/rss2.xml', sourceName: 'Brasil de Fato', hint: 'state', tier: 'independent' },
  { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/america/portada', sourceName: 'El País (América)', hint: 'world_impact', tier: 'major' },
  { url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', sourceName: 'Folha de S.Paulo', hint: 'economy', tier: 'major' },
];

// ─── 6. Africa Feeds ────────────────────────────────────────────
const AFRICA_FEEDS = [
  { url: 'https://www.dailymaverick.co.za/dmrss/', sourceName: 'Daily Maverick', hint: 'economy', tier: 'independent' },
  { url: 'https://www.howwemadeitinafrica.com/feed/', sourceName: 'How We Made It In Africa', hint: 'economy', tier: 'independent' },
  { url: 'https://www.theafricareport.com/feed/', sourceName: 'The Africa Report', hint: 'economy', tier: 'major' },
  { url: 'https://www.africanews.com/feed/rss', sourceName: 'Africanews', hint: 'world_impact', tier: 'major' },
  { url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', sourceName: 'AllAfrica', hint: 'world_impact', tier: 'aggregator' },
];

// ─── 7. Southeast Asia Feeds ────────────────────────────────────
const SOUTHEAST_ASIA_FEEDS = [
  { url: 'https://newnaratif.com/feed/', sourceName: 'New Naratif', hint: 'world_impact', tier: 'independent' },
  { url: 'https://www.irrawaddy.com/feed', sourceName: 'The Irrawaddy', hint: 'world_impact', tier: 'independent' },
  { url: 'https://mekongreview.com/feed/', sourceName: 'Mekong Review', hint: 'world_impact', tier: 'independent' },
  { url: 'https://www.rappler.com/feed/', sourceName: 'Rappler', hint: 'world_impact', tier: 'independent' },
  { url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml', sourceName: 'Channel NewsAsia (CNA)', hint: 'economy', tier: 'major' },
];


// ═══════════════════════════════════════════════════════════════════
//  COUNTRY-SPECIFIC CURATED EDITORIAL FEEDS MAPPING
// ═══════════════════════════════════════════════════════════════════

const COUNTRY_FEEDS = {
  IN: [
    // ── India: Economy & Markets ──
    { url: 'https://www.livemint.com/rss/economy', sourceName: 'LiveMint', hint: 'economy' },
    { url: 'https://www.livemint.com/rss/companies', sourceName: 'LiveMint', hint: 'jobs' },
    { url: 'https://www.livemint.com/rss/markets', sourceName: 'LiveMint Markets', hint: 'economy' },
    { url: 'https://www.livemint.com/rss/money', sourceName: 'LiveMint Money', hint: 'economy' },
    { url: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms', sourceName: 'Economic Times', hint: 'economy' },
    { url: 'https://economictimes.indiatimes.com/jobs/rssfeeds/1071159349.cms', sourceName: 'Economic Times', hint: 'jobs' },
    { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', sourceName: 'Economic Times', hint: 'economy' },
    { url: 'https://www.business-standard.com/rss/economy-policy-102.rss', sourceName: 'Business Standard', hint: 'economy' },
    { url: 'https://b2b.economictimes.indiatimes.com/rss/topstories', sourceName: 'ET B2B', hint: 'jobs' },

    // ── India: Independent & Research ──
    { url: 'https://the-ken.com/feed/', sourceName: 'The Ken', hint: 'economy', tier: 'independent' },
    { url: 'https://theprint.in/category/economy/feed/', sourceName: 'ThePrint Economy', hint: 'economy', tier: 'independent' },

    // ── India: National & Policy ──
    { url: 'https://www.thehindu.com/business/Economy/feeder/default.rss', sourceName: 'The Hindu', hint: 'economy' },
    { url: 'https://www.thehindu.com/business/feeder/default.rss', sourceName: 'The Hindu', hint: 'economy' },
    { url: 'https://www.thehindu.com/news/national/feeder/default.rss', sourceName: 'The Hindu', hint: 'state' },
    { url: 'https://indianexpress.com/section/business/feed/', sourceName: 'Indian Express', hint: 'economy' },
    { url: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', sourceName: 'BBC India', hint: 'world_impact' },
  ],

  CN: [
    ...CHINA_FEEDS,
  ],

  AU: [
    ...AUSTRALIA_FEEDS,
    { url: 'https://www.theguardian.com/australia-news/rss', sourceName: 'The Guardian AU', hint: 'state' },
  ],

  US: [
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', sourceName: 'MarketWatch', hint: 'economy' },
    { url: 'https://www.levernews.com/rss/', sourceName: 'The Lever', hint: 'economy', tier: 'independent' },
    { url: 'https://www.pbs.org/newshour/feeds/rss/headlines', sourceName: 'PBS NewsHour', hint: 'world_impact' },
    { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', sourceName: 'CNBC', hint: 'economy' },
    { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', sourceName: 'BBC US & Canada', hint: 'world_impact' },
    { url: 'https://www.theguardian.com/us-news/us-economy/rss', sourceName: 'The Guardian US', hint: 'economy' },
    { url: 'https://feeds.npr.org/1014/rss.xml', sourceName: 'NPR Politics', hint: 'state' },
    { url: 'https://feeds.npr.org/1006/rss.xml', sourceName: 'NPR Business', hint: 'economy' },
  ],

  CA: [
    { url: 'https://thetyee.ca/rss2.xml', sourceName: 'The Tyee', hint: 'economy', tier: 'independent' },
    { url: 'https://www.cbc.ca/webfeed/rss/rss-topstories', sourceName: 'CBC News (Canada)', hint: 'state' },
    { url: 'https://www.cbc.ca/cmlink/rss-business', sourceName: 'CBC Business', hint: 'economy' },
    { url: 'https://www.cbc.ca/cmlink/rss-canada', sourceName: 'CBC Canada', hint: 'state' },
    { url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/', sourceName: 'Globe and Mail', hint: 'economy' },
  ],

  GB: [
    { url: 'https://feeds.bbci.co.uk/news/uk/rss.xml', sourceName: 'BBC UK', hint: 'state' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', sourceName: 'BBC Business', hint: 'economy' },
    { url: 'https://www.theguardian.com/uk/business/rss', sourceName: 'The Guardian UK', hint: 'economy' },
    { url: 'https://www.theguardian.com/uk-news/rss', sourceName: 'The Guardian UK News', hint: 'state' },
    ...EUROPE_FEEDS.slice(0, 3),
  ],

  SG: [
    { url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml', sourceName: 'CNA', hint: 'economy' },
    { url: 'https://www.straitstimes.com/news/business/rss.xml', sourceName: 'Straits Times', hint: 'economy' },
    ...SOUTHEAST_ASIA_FEEDS,
  ],

  AE: [
    { url: 'https://www.thenationalnews.com/rss/business', sourceName: 'The National', hint: 'economy' },
    { url: 'https://gulfnews.com/rss/business', sourceName: 'Gulf News', hint: 'economy' },
  ],

  DE: [
    { url: 'https://rss.dw.com/rdf/rss-en-bus', sourceName: 'DW Business', hint: 'economy' },
    { url: 'https://www.reuters.com/rssfeed/worldnews', sourceName: 'Reuters World', hint: 'world_impact' },
    ...EUROPE_FEEDS,
  ],

  JP: [
    { url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', sourceName: 'NHK World', hint: 'economy' },
    { url: 'https://asia.nikkei.com/rss', sourceName: 'Nikkei Asia', hint: 'economy' },
  ],

  FR: [
    { url: 'https://www.france24.com/en/rss', sourceName: 'France 24', hint: 'world_impact' },
    { url: 'https://www.connexionfrance.com/rss', sourceName: 'The Connexion', hint: 'state' },
    ...EUROPE_FEEDS,
  ],

  BR: [
    ...LATIN_AMERICA_FEEDS,
  ],

  ZA: [
    ...AFRICA_FEEDS,
  ],
};


// ── India-specific state-level feeds ────────────────────────────

const THE_HINDU_STATE_SLUGS = {
  Karnataka: 'karnataka',
  'Tamil Nadu': 'tamil-nadu',
  Kerala: 'kerala',
  Telangana: 'telangana',
  'Andhra Pradesh': 'andhra-pradesh',
};


// ═══════════════════════════════════════════════════════════════════
//  REGIONAL MAPPING HELPER
//  Matches any country in the world to its regional specialist outlets
// ═══════════════════════════════════════════════════════════════════

const EUROPEAN_COUNTRY_CODES = new Set([
  'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'PL', 'CH', 'BE', 'AT',
  'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'EE', 'LV', 'LT', 'UA'
]);

const LATIN_AMERICA_CODES = new Set([
  'BR', 'AR', 'CL', 'CO', 'PE', 'MX', 'UY', 'VE', 'EC', 'BO', 'PY', 'CR', 'PA', 'GT'
]);

const AFRICA_CODES = new Set([
  'ZA', 'NG', 'KE', 'EG', 'GH', 'ET', 'TZ', 'UG', 'MA', 'DZ', 'SN', 'RW', 'ZW'
]);

const SOUTHEAST_ASIA_CODES = new Set([
  'SG', 'MY', 'ID', 'PH', 'TH', 'VN', 'MM', 'KH', 'LA', 'BN'
]);

function getRegionalFeedsForCountry(country) {
  const code = (country.code || '').toUpperCase();
  const name = (country.name || '').toLowerCase();

  const extraFeeds = [];

  if (EUROPEAN_COUNTRY_CODES.has(code) || name.includes('europe') || name.includes('spain') || name.includes('italy') || name.includes('poland') || name.includes('netherlands')) {
    extraFeeds.push(...EUROPE_FEEDS);
  } else if (LATIN_AMERICA_CODES.has(code) || name.includes('brazil') || name.includes('argentina') || name.includes('chile') || name.includes('colombia') || name.includes('mexico')) {
    extraFeeds.push(...LATIN_AMERICA_FEEDS);
  } else if (AFRICA_CODES.has(code) || name.includes('africa') || name.includes('nigeria') || name.includes('kenya') || name.includes('ghana') || name.includes('egypt')) {
    extraFeeds.push(...AFRICA_FEEDS);
  } else if (SOUTHEAST_ASIA_CODES.has(code) || name.includes('indonesia') || name.includes('malaysia') || name.includes('philippines') || name.includes('vietnam') || name.includes('thailand')) {
    extraFeeds.push(...SOUTHEAST_ASIA_FEEDS);
  } else if (code === 'CN' || name.includes('china') || name.includes('hong kong') || name.includes('taiwan')) {
    extraFeeds.push(...CHINA_FEEDS);
  } else if (code === 'AU' || code === 'NZ' || name.includes('australia') || name.includes('new zealand')) {
    extraFeeds.push(...AUSTRALIA_FEEDS);
  } else if (code === 'US' || code === 'CA' || name.includes('united states') || name.includes('canada')) {
    extraFeeds.push(...NORTH_AMERICA_FEEDS);
  }

  return extraFeeds;
}


// ═══════════════════════════════════════════════════════════════════
//  LAYER 3: DYNAMIC SEARCH-BASED DISCOVERY
//  Bing News RSS + Google News RSS + GDELT DOC 2.0
//  Works for ANY country — automatically searches internet when country is changed
// ═══════════════════════════════════════════════════════════════════

function googleNewsSearchUrl(query, country) {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=en&gl=${encodeURIComponent(country.gl)}&ceid=${encodeURIComponent(country.ceid)}`;
}

function bingNewsSearchUrl(query, country) {
  const q = encodeURIComponent(query);
  return `https://www.bing.com/news/search?q=${q}&format=rss&mkt=${encodeURIComponent(country.bingMkt)}`;
}

function gdeltSearchUrl(query) {
  const fullQuery = `${query} sourcelang:english`;
  const q = encodeURIComponent(fullQuery);
  return `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&maxrecords=20&format=json&sort=HybridRel&timespan=72h`;
}

/**
 * For any country, generate dynamic search-based discovery queries
 * that find the best local news sources via Bing + Google News RSS.
 * This dynamically searches the web when the user changes country.
 */
function buildDynamicCountryDiscoveryQueries(country) {
  const name = country.name;
  return [
    { query: `${name} economy news today`, hint: 'economy' },
    { query: `${name} business financial news`, hint: 'economy' },
    { query: `${name} jobs hiring employment news`, hint: 'jobs' },
    { query: `${name} food prices inflation cost of living`, hint: 'food_essentials' },
    { query: `${name} government policy news`, hint: 'state' },
    { query: `${name} trade tariff import export`, hint: 'world_impact' },
    { query: `${name} ${country.stockIndex || 'stock market'} ${country.centralBank || 'central bank'} interest rate`, hint: 'economy' },
  ];
}


// ═══════════════════════════════════════════════════════════════════
//  MAIN BUILDER — orchestrates all 3 layers
// ═══════════════════════════════════════════════════════════════════

function buildSourcesForProfile(profile) {
  const ageGroup = resolveAgeGroup(profile?.ageGroup || profile?.age);
  const country = resolveCountry(profile?.countryCode || profile?.countryName || profile?.country);
  const state = (profile?.state || '').trim();
  const hasState = state && !state.toLowerCase().startsWith('all');

  const rssFeeds = [];
  const seenUrls = new Set();

  function addFeed(feed) {
    if (!feed || !feed.url) return;
    if (seenUrls.has(feed.url)) return;
    seenUrls.add(feed.url);
    rssFeeds.push(feed);
  }

  // ── Layer 1: Global always-on feeds ───────────────────────────
  GLOBAL_WORLD_MAJOR.forEach(addFeed);
  GLOBAL_ECONOMICS_MAJOR.forEach(addFeed);
  GLOBAL_WORLD_INDEPENDENT.forEach(addFeed);
  GLOBAL_ECONOMICS_INDEPENDENT.forEach(addFeed);
  GLOBAL_TECH_INDEPENDENT.forEach(addFeed);
  GLOBAL_TECH_AGGREGATORS.forEach(addFeed);

  // ── Layer 2: Country-specific & Regional curated feeds ─────────
  const countryFeeds = COUNTRY_FEEDS[country.code];
  if (countryFeeds) {
    countryFeeds.forEach(addFeed);
  }

  // Also include regional feeds matching the country's region
  const regionalFeeds = getRegionalFeedsForCountry(country);
  regionalFeeds.forEach(addFeed);

  // India state-level feeds
  if (country.code === 'IN' && hasState && THE_HINDU_STATE_SLUGS[state]) {
    addFeed({
      url: `https://www.thehindu.com/news/national/${THE_HINDU_STATE_SLUGS[state]}/feeder/default.rss`,
      sourceName: `The Hindu · ${state}`,
      hint: 'state',
    });
  }

  // ── Layer 3: Dynamic search-based discovery ───────────────────
  // Always build targeted search queries for the user's country
  const searchTopics = [
    {
      query: `${country.name} economy OR ${country.centralBank || 'central bank'} OR inflation OR ${country.stockIndex || 'stocks'}`,
      hint: 'economy',
    },
    {
      query: `${country.name} ${ageGroup.queryFocus}`,
      hint: 'jobs',
    },
    {
      query: `${country.name} "food prices" OR "food shortage" OR "food crisis" OR crop OR "edible oil" OR wheat OR rice OR onion`,
      hint: 'food_essentials',
    },
    {
      query: `${country.name} monsoon OR drought OR heatwave OR flood "stock market" OR crops OR power OR commodity`,
      hint: 'weather_markets',
    },
    {
      query: `global tariff OR "oil prices" OR OPEC OR "US Fed" OR trade ${country.name}`,
      hint: 'world_impact',
    },
  ];

  if (hasState) {
    searchTopics.push({
      query: `${state} ${country.name} jobs OR economy OR infrastructure OR investment OR power OR water OR policy`,
      hint: 'state',
    });
  }

  // When the country is not directly in COUNTRY_FEEDS, add extra dynamic discovery queries
  // This automatically searches the internet for new resources when a country is changed
  if (!countryFeeds) {
    const discoveryQueries = buildDynamicCountryDiscoveryQueries(country);
    searchTopics.push(...discoveryQueries);
  }

  for (const topic of searchTopics) {
    addFeed({
      url: bingNewsSearchUrl(topic.query, country),
      sourceName: '',
      hint: topic.hint,
      isSearch: true,
    });
    addFeed({
      url: googleNewsSearchUrl(topic.query, country),
      sourceName: '',
      hint: topic.hint,
      isSearch: true,
    });
  }

  // ── GDELT DOC 2.0 JSON queries ───────────────────────────────
  const gdeltQueries = [
    {
      url: gdeltSearchUrl(`(${country.name} economy OR inflation OR jobs OR hiring OR layoffs)`),
      hint: 'economy',
    },
    {
      url: gdeltSearchUrl(`(${country.name} food prices OR shortage OR monsoon OR crops OR stock market)`),
      hint: 'food_essentials',
    },
  ];
  if (hasState) {
    gdeltQueries.push({
      url: gdeltSearchUrl(`("${state}" ${country.name} economy OR jobs OR policy OR infrastructure)`),
      hint: 'state',
    });
  }
  if (country.gdeltCountry) {
    gdeltQueries.push({
      url: gdeltSearchUrl(`(economy OR jobs OR inflation OR food OR weather) sourcecountry:${country.gdeltCountry.replace(/\s+/g, '')}`),
      hint: 'economy',
    });
  }

  // For unknown countries, add broader GDELT discovery
  if (!countryFeeds) {
    gdeltQueries.push({
      url: gdeltSearchUrl(`(${country.name} business OR trade OR employment OR government OR policy)`),
      hint: 'world_impact',
    });
    gdeltQueries.push({
      url: gdeltSearchUrl(`(${country.name} technology OR startup OR digital OR AI OR infrastructure)`),
      hint: 'jobs',
    });
  }

  return {
    ageGroup,
    country,
    state: hasState ? state : '',
    rssFeeds,
    gdeltQueries,
  };
}

module.exports = {
  buildSourcesForProfile,
  // Exported for tests & external inspection
  GLOBAL_WORLD_INDEPENDENT,
  GLOBAL_WORLD_MAJOR,
  GLOBAL_ECONOMICS_INDEPENDENT,
  GLOBAL_ECONOMICS_MAJOR,
  GLOBAL_TECH_INDEPENDENT,
  GLOBAL_TECH_AGGREGATORS,
  CHINA_FEEDS,
  AUSTRALIA_FEEDS,
  EUROPE_FEEDS,
  NORTH_AMERICA_FEEDS,
  LATIN_AMERICA_FEEDS,
  AFRICA_FEEDS,
  SOUTHEAST_ASIA_FEEDS,
  COUNTRY_FEEDS,
  getRegionalFeedsForCountry,
};
