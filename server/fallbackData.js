'use strict';

/**
 * Curated offline fallback dataset used ONLY when live external news feeds
 * cannot be reached (e.g., offline environment or isolated test sandbox).
 * Includes real editorial URLs and local SVG cover artwork so every reel
 * renders crisply with zero broken images.
 */

function getFallbackArticles(country, state) {
  const now = Date.now();
  const h = (hrs) => now - hrs * 3600 * 1000;
  const countryName = country?.name || 'India';
  const stateLabel = state && !state.toLowerCase().startsWith('all') ? state : '';

  const baseIndia = [
    {
      title: 'IT & GCC hiring rebounds 18% across Bengaluru, Pune, and Hyderabad for mid-level cloud and AI engineers',
      summary: 'Global capability centres accelerate India expansion for 3–8 year experienced professionals, lifting median salary offers across fintech and enterprise software.',
      url: 'https://economictimes.indiatimes.com/jobs',
      source: 'Economic Times',
      domain: 'economictimes.indiatimes.com',
      publishedAt: h(1.5),
      imageUrl: '/assets/covers/jobs.svg',
      feedHint: 'jobs',
    },
    {
      title: 'RBI holds repo rate steady while signaling tighter watch on food inflation and household EMI burdens',
      summary: 'Borrowers waiting for home and auto loan relief face a longer pause as vegetable and pulse prices keep headline CPI above comfort zones.',
      url: 'https://www.livemint.com/economy',
      source: 'LiveMint',
      domain: 'livemint.com',
      publishedAt: h(2.2),
      imageUrl: '/assets/covers/economy.svg',
      feedHint: 'economy',
    },
    {
      title: 'Onion, tomato, and edible oil prices climb 22% after unseasonal rain hits wholesale mandis',
      summary: 'Retail food inflation squeezes urban monthly grocery budgets as transport delays and crop moisture cut fresh arrivals across major Indian cities.',
      url: 'https://www.thehindu.com/business/Economy/',
      source: 'The Hindu',
      domain: 'thehindu.com',
      publishedAt: h(3.1),
      imageUrl: '/assets/covers/food_essentials.svg',
      feedHint: 'food_essentials',
    },
    {
      title: 'El Niño weather shift and erratic monsoon forecast drag FMCG, sugar, and fertilizer stocks lower on Sensex and Nifty',
      summary: 'Analysts warn weak reservoir replenishment could curb rural demand and pressure agricultural supply chains over the next two quarters.',
      url: 'https://www.business-standard.com/markets',
      source: 'Business Standard',
      domain: 'business-standard.com',
      publishedAt: h(4.0),
      imageUrl: '/assets/covers/weather_markets.svg',
      feedHint: 'weather_markets',
    },
    {
      title: 'Global crude oil spike and Red Sea shipping delays threaten India import bill, rupee stability, and fuel prices',
      summary: 'Higher Brent crude and container freight costs raise logistics expenses for Indian exporters and put pressure on the rupee against the US dollar.',
      url: 'https://www.bbc.com/news/world/asia/india',
      source: 'BBC News',
      domain: 'bbc.com',
      publishedAt: h(5.2),
      imageUrl: '/assets/covers/world_impact.svg',
      feedHint: 'world_impact',
    },
    {
      title: 'US tariff changes and H-1B visa fee rules reshape Indian tech exports and cross-border hiring plans',
      summary: 'Indian IT services and electronics exporters recalibrate US staffing and domestic delivery hubs in response to shifting Washington trade policy.',
      url: 'https://indianexpress.com/section/business/',
      source: 'Indian Express',
      domain: 'indianexpress.com',
      publishedAt: h(6.5),
      imageUrl: '/assets/covers/world_impact.svg',
      feedHint: 'world_impact',
    },
    {
      title: 'New income tax regime deductions and EPFO withdrawal rule tweaks take focus ahead of payroll cycle',
      summary: 'Salaried professionals evaluate take-home pay vs NPS and mutual fund tax planning as employers finalize annual investment declarations.',
      url: 'https://www.livemint.com/money',
      source: 'LiveMint',
      domain: 'livemint.com',
      publishedAt: h(7.8),
      imageUrl: '/assets/covers/economy.svg',
      feedHint: 'economy',
    },
    {
      title: 'Heatwave drives record peak electricity demand across industrial corridors, lifting power and coal stocks',
      summary: 'Grid operators boost thermal and solar dispatch to avoid commercial outages as cooling load hits seasonal highs.',
      url: 'https://www.thehindu.com/business/',
      source: 'The Hindu',
      domain: 'thehindu.com',
      publishedAt: h(9.0),
      imageUrl: '/assets/covers/weather_markets.svg',
      feedHint: 'weather_markets',
    },
    {
      title: 'Pulses and wheat stock limits tightened to prevent hoarding amid global grain shortage concerns',
      summary: 'Food ministry mandates weekly inventory disclosures by traders and millers to stabilize staple dal and atta prices before peak demand.',
      url: 'https://www.business-standard.com/economy',
      source: 'Business Standard',
      domain: 'business-standard.com',
      publishedAt: h(11.0),
      imageUrl: '/assets/covers/food_essentials.svg',
      feedHint: 'food_essentials',
    },
  ];

  const baseGlobal = [
    {
      title: `${countryName} job market tightens in tech and finance as employers prioritize AI automation and cost discipline`,
      summary: 'Hiring trends show steady wage growth for specialized engineering and healthcare roles while entry-level corporate openings stay selective.',
      url: 'https://www.cnbc.com/economy/',
      source: 'CNBC',
      domain: 'cnbc.com',
      publishedAt: h(1.8),
      imageUrl: '/assets/covers/jobs.svg',
      feedHint: 'jobs',
    },
    {
      title: `Central bank interest rate outlook shifts as sticky services inflation keeps ${countryName} borrowing costs elevated`,
      summary: 'Bond yields tick higher after inflation data surprises markets, delaying relief on mortgages, auto loans, and business credit.',
      url: 'https://www.bbc.com/news/business',
      source: 'BBC Business',
      domain: 'bbc.com',
      publishedAt: h(2.9),
      imageUrl: '/assets/covers/economy.svg',
      feedHint: 'economy',
    },
    {
      title: `Food prices and global cocoa, coffee, and grain shortages squeeze ${countryName} grocery bills`,
      summary: 'Climate-hit harvests and higher shipping rates push supermarket food inflation higher for everyday household staples.',
      url: 'https://www.theguardian.com/business/economics',
      source: 'The Guardian',
      domain: 'theguardian.com',
      publishedAt: h(4.1),
      imageUrl: '/assets/covers/food_essentials.svg',
      feedHint: 'food_essentials',
    },
    {
      title: `Severe storms and drought hit commodity supply chains, rattling agricultural futures and ${countryName} stock market`,
      summary: 'Energy, insurance, and food producers lead market volatility as extreme weather disrupts ports and crop yields.',
      url: 'https://www.cnbc.com/world/',
      source: 'CNBC World',
      domain: 'cnbc.com',
      publishedAt: h(5.4),
      imageUrl: '/assets/covers/weather_markets.svg',
      feedHint: 'weather_markets',
    },
    {
      title: `New trade tariffs and OPEC crude supply cuts ripple into ${countryName} fuel costs and export competitiveness`,
      summary: 'Geopolitical friction along key shipping lanes pushes energy and manufacturing input prices higher worldwide.',
      url: 'https://www.aljazeera.com/economy/',
      source: 'Al Jazeera',
      domain: 'aljazeera.com',
      publishedAt: h(7.0),
      imageUrl: '/assets/covers/world_impact.svg',
      feedHint: 'world_impact',
    },
  ];

  const items = country?.code === 'IN' ? [...baseIndia] : [...baseGlobal];

  if (stateLabel) {
    items.unshift(
      {
        title: `${stateLabel} state budget approves new tech & manufacturing industrial corridor, targeting 45,000 skilled jobs`,
        summary: `New infrastructure spending and industrial land incentives in ${stateLabel} aim to attract semiconductor, EV, and global capability centre investments.`,
        url: country?.code === 'IN' ? 'https://www.thehindu.com/news/national/' : 'https://www.bbc.com/news',
        source: country?.code === 'IN' ? 'The Hindu' : 'Regional Desk',
        domain: country?.code === 'IN' ? 'thehindu.com' : 'bbc.com',
        publishedAt: h(1.0),
        imageUrl: '/assets/covers/state.svg',
        feedHint: 'state',
      },
      {
        title: `${stateLabel} urban transit expansion, power tariff review, and water reservoir alert impact commuters and living costs`,
        summary: `State utilities and municipal authorities issue summer power and water supply advisories alongside metro connectivity updates across ${stateLabel}.`,
        url: country?.code === 'IN' ? 'https://indianexpress.com/section/india/' : 'https://www.bbc.com/news',
        source: country?.code === 'IN' ? 'Indian Express' : 'Local Policy',
        domain: country?.code === 'IN' ? 'indianexpress.com' : 'bbc.com',
        publishedAt: h(2.5),
        imageUrl: '/assets/covers/state.svg',
        feedHint: 'state',
      }
    );
  }

  // Deliberate entertainment/celebrity samples included in raw pool so classifier filters & tracks them cleanly
  items.push(
    {
      title: 'Bollywood mega-star spotted at airport ahead of blockbuster trailer launch and box office clash',
      summary: 'Fans gather as celebrity couple unveils teaser and red carpet fashion look.',
      url: 'https://example.com/entertainment/bollywood-trailer',
      source: 'Showbiz Daily',
      domain: 'example.com',
      publishedAt: h(1.2),
      imageUrl: '/assets/covers/economy.svg',
      feedHint: '',
    },
    {
      title: 'Oscars 2026 red carpet: Hollywood celebrity couples and Netflix series winners',
      summary: 'Full list of best dressed celebrities and reality TV moments from the awards night.',
      url: 'https://example.com/celebrity/oscars',
      source: 'Glam Weekly',
      domain: 'example.com',
      publishedAt: h(2.0),
      imageUrl: '/assets/covers/economy.svg',
      feedHint: '',
    }
  );

  return items;
}

module.exports = {
  getFallbackArticles,
};

