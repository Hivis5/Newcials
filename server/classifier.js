'use strict';

const { PILLAR_META, resolveAgeGroup, resolveCountry, getStateKeywords } = require('./profiles');

/**
 * In-depth hierarchical topic ontology.
 * Maps high-impact real-world domains into specialized sub-topics with
 * fine-grained discriminative terms, weights, and human-readable labels.
 */
const INDEPTH_TOPICS = {
  economy: [
    {
      id: 'macro_monetary',
      label: 'Monetary Policy & Rates',
      terms: [
        'rbi', 'reserve bank', 'monetary policy committee', 'mpc', 'repo rate', 'reverse repo',
        'crr', 'slr', 'liquidity adjustment facility', 'laf', 'yield curve', 'inflation targeting',
        'sovereign rating', 'treasury bill', 't-bill', 'g-sec', 'government securities', 'bond yield'
      ],
      weight: 34,
      urgencySignal: ['rate cut', 'rate hike', 'emergency meeting', 'repo hike', 'tightening']
    },
    {
      id: 'taxation_gst_budget',
      label: 'Taxes & Fiscal Budget',
      terms: [
        'income tax slab', 'new tax regime', 'old tax regime', 'section 80c', 'capital gains tax',
        'stcg', 'ltcg', 'advance tax', 'tds deduction', 'gst council', 'input tax credit', 'itc',
        'inverted duty structure', 'fiscal deficit', 'union budget', 'direct tax collections',
        'corporate tax', 'customs duty', 'excise tariff', 'tax exemption'
      ],
      weight: 32,
      urgencySignal: ['tax hike', 'gst increase', 'budget announcement', 'deduction scrap']
    },
    {
      id: 'banking_credit_fintech',
      label: 'Banking, Credit & EMIs',
      terms: [
        'personal loan', 'home loan emi', 'unsecured credit', 'credit card default', 'npa',
        'bad loans', 'net interest margin', 'nim', 'capital adequacy', 'basel iii', 'upi transaction',
        'rupay', 'interchange fee', 'deposit interest rate', 'fixed deposit', 'fd rates',
        'recurring deposit', 'small finance bank', 'lending rate', 'mclr'
      ],
      weight: 30,
      urgencySignal: ['emi surge', 'loan default', 'unsecured lending crackdown', 'fd rate hike']
    },
    {
      id: 'wealth_investments_retirement',
      label: 'Investments & Wealth',
      terms: [
        'mutual fund', 'sip inflow', 'nifty 50', 'sensex', 'systematic investment plan',
        'equity fund', 'debt fund', 'epfo interest rate', 'provident fund', 'nps',
        'national pension system', 'sovereign gold bond', 'sgb', 'sebi regulation',
        'demat account', 'index fund', 'portfolio rebalancing', 'ipo allotment'
      ],
      weight: 28,
      urgencySignal: ['market crash', 'sensex falls', 'nifty drops', 'sebi notice', 'all-time high']
    },
    {
      id: 'energy_fuel_utilities',
      label: 'Fuel & Utility Tariffs',
      terms: [
        'petrol price', 'diesel price', 'lpg cylinder', 'cooking gas price', 'cng price',
        'piped gas', 'brent crude', 'fuel surcharge', 'power tariff', 'electricity board',
        'discom debt', 'peak electricity demand', 'power cut', 'coal inventory'
      ],
      weight: 26,
      urgencySignal: ['fuel price hike', 'lpg hike', 'electricity tariff hike', 'power shortage']
    },
    {
      id: 'cost_of_living_inflation',
      label: 'Inflation & Living Cost',
      terms: [
        'cpi inflation', 'consumer price index', 'wholesale price index', 'wpi', 'headline inflation',
        'core inflation', 'purchasing power', 'household savings', 'consumer confidence',
        'cost of living', 'urban wage', 'living expenses', 'monthly budget'
      ],
      weight: 32,
      urgencySignal: ['inflation spikes', 'cpi surge', 'record high inflation', 'cost squeeze']
    }
  ],

  jobs: [
    {
      id: 'tech_software_ai',
      label: 'Tech & AI Careers',
      terms: [
        'gcc', 'global capability centre', 'it services', 'it sector', 'software engineer',
        'ai engineer', 'cloud architect', 'devops', 'full stack', 'tech talent', 'campus placement',
        'iit placement', 'tech hiring', 'fresher hiring', 'bench strength', 'attrition rate',
        'it exports', 'generative ai jobs', 'tech salaries'
      ],
      weight: 34,
      urgencySignal: ['mass hiring', 'tech hiring surge', 'package offer', 'salary hike']
    },
    {
      id: 'corporate_hiring_layoffs',
      label: 'Hiring & Job Cuts',
      terms: [
        'layoffs', 'laid off', 'job cuts', 'headcount reduction', 'retrenchment', 'pink slip',
        'severance pay', 'hiring freeze', 'recruitment drive', 'talent crunch', 'white collar jobs',
        'executive hiring', 'job market rebound', 'workforce downsizing'
      ],
      weight: 36,
      urgencySignal: ['mass layoffs', 'retrenchment', 'hiring freeze', 'job cuts', 'severance']
    },
    {
      id: 'compensation_appraisals',
      label: 'Salaries & Appraisals',
      terms: [
        'salary hike', 'appraisal cycle', 'variable pay', 'bonus payout', 'median salary',
        'wage growth', 'compensation review', 'esop vesting', 'joining bonus', 'pay disparity',
        'annual increment', 'salary deduction'
      ],
      weight: 30,
      urgencySignal: ['variable pay cut', 'salary freeze', 'record bonus', 'increment delayed']
    },
    {
      id: 'workplace_labour_policy',
      label: 'Workplace & Labour Law',
      terms: [
        'return to office', 'rto mandate', 'remote work', 'hybrid work', 'moonlighting',
        'work from home', 'wfh', 'labour codes', 'gig worker rights', 'social security for platform workers',
        'maternity benefit', '70-hour work week', 'working hours', 'minimum wage'
      ],
      weight: 28,
      urgencySignal: ['mandatory return', 'labour law reform', 'gig worker strike', 'wage rule']
    },
    {
      id: 'global_visas_mobility',
      label: 'Global Visas & Mobility',
      terms: [
        'h-1b visa', 'h1b lottery', 'l-1 visa', 'skilled worker visa', 'work permit',
        'canada express entry', 'pr visa', 'uscis', 'stem opt', 'eb-5', 'foreign employment',
        'cross-border hiring', 'visa fee hike'
      ],
      weight: 32,
      urgencySignal: ['visa denial surge', 'visa fee hike', 'lottery rules changed', 'cap reached']
    },
    {
      id: 'entry_level_vocational',
      label: 'Freshers & Entry-Level',
      terms: [
        'internship', 'apprentice', 'fresher job', 'upsc recruitment', 'ssc exam',
        'banking po', 'state psc', 'employment exchange', 'national career service', 'skill india',
        'entry level hiring', 'campus recruitment'
      ],
      weight: 26,
      urgencySignal: ['exam cancelled', 'recruitment notification', 'vacancy announcement']
    }
  ],

  food_essentials: [
    {
      id: 'vegetables_mandis',
      label: 'Vegetables & Mandi Prices',
      terms: [
        'onion price', 'tomato price', 'potato price', 'vegetable price', 'apmc mandi',
        'wholesale mandi', 'unseasonal rain spoilage', 'cold storage arrival', 'mandi arrival',
        'vegetable inflation', 'kitchen budget', 'green chilli price', 'ginger price'
      ],
      weight: 36,
      urgencySignal: ['prices double', 'supply shortage', 'mandi arrival drops', 'unseasonal rain damage']
    },
    {
      id: 'staples_cereals_pulses',
      label: 'Grains & Pulses',
      terms: [
        'wheat price', 'rice price', 'basmati export ban', 'minimum export price', 'mep',
        'tur dal', 'urad dal', 'chana dal', 'pulses price', 'grain shortage', 'fci buffer stock',
        'open market sale scheme', 'grain silo', 'atta price'
      ],
      weight: 34,
      urgencySignal: ['export ban', 'stock limit imposed', 'anti-hoarding order', 'buffer stock release']
    },
    {
      id: 'edible_oils_dairy',
      label: 'Edible Oils & Dairy',
      terms: [
        'edible oil', 'palm oil import duty', 'mustard oil', 'sunflower oil', 'milk price hike',
        'dairy cooperative', 'amul', 'nandini', 'mother dairy', 'poultry price', 'egg price',
        'animal feed cost'
      ],
      weight: 32,
      urgencySignal: ['milk price hike', 'edible oil duty hike', 'egg price surge']
    },
    {
      id: 'food_security_pds',
      label: 'Food Security & Ration',
      terms: [
        'food security', 'pmgkay', 'ration shop', 'fair price shop', 'pds rice', 'food subsidy',
        'antodaya', 'procurement at msp', 'minimum support price', 'grain procurement target'
      ],
      weight: 28,
      urgencySignal: ['free ration extended', 'msp hike', 'procurement deficit']
    },
    {
      id: 'healthcare_medicines',
      label: 'Essential Healthcare & Drugs',
      terms: [
        'medicine price', 'nlem', 'national list of essential medicines', 'nppa price cap',
        'cardiac stent', 'generic medicine', 'jan aushadhi', 'health insurance premium',
        'medical inflation', 'hospital treatment cost', 'essential drug'
      ],
      weight: 32,
      urgencySignal: ['price cap imposed', 'premium surge', 'medicine shortage', 'drug price hike']
    },
    {
      id: 'water_civic_scarcity',
      label: 'Water Supply & Shortage',
      terms: [
        'drinking water crisis', 'water tanker price', 'groundwater depletion', 'borewell dry',
        'reservoir level', 'water supply cut', 'cauvery water', 'drinking water rationing',
        'summer water crisis'
      ],
      weight: 34,
      urgencySignal: ['tanker price surge', 'reservoir dries', 'water rationing', 'emergency supply']
    }
  ],

  weather_markets: [
    {
      id: 'monsoon_agricultural_yield',
      label: 'Monsoon & Crop Acreage',
      terms: [
        'southwest monsoon', 'northeast monsoon', 'monsoon deficit', 'imd forecast',
        'rainfall deficit', 'kharif crop', 'rabi crop', 'sowing deficit', 'crop yield',
        'reservoir storage index', 'central water commission', 'monsoon progress'
      ],
      weight: 34,
      urgencySignal: ['monsoon fails', 'deficit widens', 'sowing declines', 'delayed monsoon']
    },
    {
      id: 'extreme_climate_events',
      label: 'Extreme Weather & Drought',
      terms: [
        'el nino', 'el niño', 'la nina', 'la niña', 'heatwave alert', 'unseasonal rain',
        'hailstorm damage', 'cyclone alert', 'drought declaration', 'flood inundation',
        'crop insurance claim', 'pmfby', 'climate shock'
      ],
      weight: 32,
      urgencySignal: ['heatwave red alert', 'cyclone landfall', 'drought declared', 'hailstorm destroys crops']
    },
    {
      id: 'market_stocks_spillover',
      label: 'Weather Impact on Stocks',
      terms: [
        'fmcg stocks', 'rural demand', 'fertilizer stocks', 'agri stocks', 'sugar stocks',
        'tractor sales', 'crop shortage stock market', 'commodity price shock', 'nifty agri',
        'rural consumption'
      ],
      weight: 36,
      urgencySignal: ['shares tumble on monsoon fear', 'agri stocks slide', 'fmcg volume warning']
    },
    {
      id: 'grid_power_disruptions',
      label: 'Power Grid & Climate Stress',
      terms: [
        'peak power demand', 'grid collapse', 'coal shortage power plant', 'hydroelectric power dip',
        'thermal plant stock', 'power rationing industry', 'summer load shedding'
      ],
      weight: 30,
      urgencySignal: ['record power demand', 'grid overload', 'coal shortage alert', 'blackout risk']
    }
  ],

  world_impact: [
    {
      id: 'trade_tariffs_agreements',
      label: 'Tariffs & Trade Deals',
      terms: [
        'tariff', 'tariffs', 'us tariffs', 'trade war', 'customs tariff', 'countervailing duty',
        'anti-dumping duty', 'fta negotiation', 'free trade agreement', 'bilateral trade',
        'india-uk fta', 'india-eu fta', 'protectionism', 'wto dispute', 'us trade policy',
        'import bill', 'export restrictions'
      ],
      weight: 34,
      urgencySignal: ['tariff imposed', 'duty hike', 'trade dispute escalates', 'fta signed', 'tariffs threaten']
    },
    {
      id: 'chokepoints_shipping',
      label: 'Global Shipping Chokepoints',
      terms: [
        'red sea', 'shipping route', 'houthi attack', 'suez canal', 'strait of hormuz',
        'malacca strait', 'container freight', 'shipping disruptions', 'shipping delay',
        'shipping insurance surcharge', 'maritime logistics', 'supply chain disruption'
      ],
      weight: 34,
      urgencySignal: ['tanker attacked', 'shipping rates soar', 'ships diverted', 'freight costs surge', 'shipping disruptions']
    },
    {
      id: 'geopolitics_crude_oil',
      label: 'Oil Geopolitics & OPEC',
      terms: [
        'opec', 'opec+', 'crude oil', 'crude rally', 'brent crude', 'russian oil',
        'oil prices', 'oil price', 'oil rally', 'sanctions enforcement', 'middle east tension',
        'strategic petroleum reserve', 'lng tanker', 'crude spike'
      ],
      weight: 34,
      urgencySignal: ['crude spikes', 'opec cuts', 'oil surges', 'supply embargo', 'crude oil rally']
    },
    {
      id: 'fed_rates_currency_spillover',
      label: 'US Fed & Currency Spillovers',
      terms: [
        'us fed', 'federal reserve', 'fed rate', 'jerome powell', 'fomc', 'us treasury yield',
        '10-year yield', 'dollar index', 'dxy', 'rupee', 'rupee depreciation', 'fpi outflow',
        'foreign capital flight', 'foreign exchange reserves'
      ],
      weight: 34,
      urgencySignal: ['rupee hits record low', 'fed hikes rates', 'treasury yields spike', 'capital outflows']
    },
    {
      id: 'tech_chip_supply_chains',
      label: 'Semiconductors & Global Tech',
      terms: [
        'semiconductor', 'chip export', 'chip sanctions', 'asml', 'tsmc', 'rare earth',
        'friendshoring', 'china plus one', 'electronics supply chain', 'chip manufacturing'
      ],
      weight: 32,
      urgencySignal: ['export ban imposed', 'chip shortage threatens', 'sanctions tightened']
    }
  ],

  state: [
    {
      id: 'industrial_manufacturing_parks',
      label: 'State Industrial & Tech Parks',
      terms: [
        'state industrial development', 'kiadb', 'midc', 'tidco', 'gidc', 'sipcot',
        'semiconductor fab subsidy', 'atmp plant', 'electronics manufacturing cluster', 'emc',
        'global investor summit', 'mou signed investment', 'industrial land allocation'
      ],
      weight: 34,
      urgencySignal: ['mega investment approved', 'fab unit cleared', 'thousands of jobs announced']
    },
    {
      id: 'regional_urban_transit',
      label: 'Regional Transit & Infra',
      terms: [
        'metro rail expansion', 'suburban rail project', 'expressway inauguration',
        'peripheral ring road', 'state road transport', 'electric bus fleet',
        'airport terminal expansion', 'traffic decongestion'
      ],
      weight: 30,
      urgencySignal: ['line opens', 'fare hike', 'bus strike', 'commute disruption']
    },
    {
      id: 'state_fiscal_utilities',
      label: 'State Policy & Municipal Costs',
      terms: [
        'state budget presentation', 'state electricity regulatory commission', 'kerc tariff',
        'merc tariff', 'tnerc tariff', 'industrial power subsidy', 'state gst collection',
        'municipal property tax', 'state deficit'
      ],
      weight: 30,
      urgencySignal: ['power tariff hike', 'property tax hike', 'budget announcement']
    }
  ]
};

// Pure entertainment, cinema, celebrity gossip, reality TV, lifestyle fluff
const HARD_FLUFF_PATTERNS = [
  /\b(bollywood|hollywood|tollywood|kollywood|sandalwood|mollywood)\b/i,
  /\b(box office|movie review|film review|trailer launch|teaser drop|ott release|box-office)\b/i,
  /\b(bigg boss|koffee with karan|kapil sharma|reality show|reality tv|indian idol|masterchef)\b/i,
  /\b(oscar|oscars|grammy|grammys|emmy|emmys|filmfare|iifa|met gala|cannes|golden globe|bafta)\b/i,
  /\b(paparazzi|airport look|red carpet|fashion week|ootd|wardrobe malfunction|makeup tutorial)\b/i,
  /\b(rumoured dating|dating rumours|breakup|divorce rumours|wedding bells|maternity shoot|baby bump|spotted together)\b/i,
  /\b(k-pop|bts|blackpink|taylor swift|kardashian|jenner|salman khan|shah rukh|srk|deepika|alia bhatt|ranbir|katrina|vijay deverakonda|rashmika|allu arjun|prabhas)\b/i,
  /\b(netflix series|amazon prime series|web series|season finale|episode recap|spoiler alert|binge-watch|cast announcement)\b/i,
  /\b(horoscope|zodiac|astrology|rashifal|tarot|numerology|wordle|optical illusion)\b/i,
  /\b(viral video|viral dance|reel star|tiktok star|influencer feud|youtube drama|instagram model)\b/i,
];

// Sports entertainment (match recaps, player hype) — blocked unless major economic/policy story
const SPORTS_ENTERTAINMENT_PATTERNS = [
  /\b(ipl \d*|match highlights|man of the match|player of the match|hat-trick|bowling spell|batting order|playing xi|fantasy xi|dream11)\b/i,
  /\b(champions league|premier league|la liga|serie a|nba playoffs|nfl draft|wwe|ufc fight|grand slam|wimbledon|t20 world cup|odi series|test match)\b/i,
  /\b(virat kohli|rohit sharma|ms dhoni|messi|ronaldo|mbappe)\b/i,
];

// Material day-to-day / economic impact overrides (only overrides soft/borderline entertainment or hospitality)
const MATERIAL_IMPACT_OVERRIDE_PATTERNS = [
  /\b(food crisis|food shortage|food inflation|food prices|grocery prices|vegetable prices|onion|tomato|wheat|rice|grain|edible oil|milk prices|sugar prices)\b/i,
  /\b(inflation|cpi|recession|layoff|layoffs|strike|worker protest|minimum wage|unemployment|gst|tax hike|tariff|supply chain|antitrust|bankruptcy)\b/i,
  /\b(stock market|share price|shares fall|shares surge|nifty|sensex|s&p 500|nasdaq|ipo)\b/i,
];

function matchesAny(text, patterns) {
  return patterns.some((re) => re.test(text));
}

/**
 * Advanced multi-term phrase & subtopic extractor.
 * Computes fine-grained topic matches, entity densities, and urgency signals.
 */
function extractInDepthTopics(combinedText, titleText) {
  const lowerCombined = combinedText.toLowerCase();
  const lowerTitle = titleText.toLowerCase();

  const matchedSubTopics = [];
  const subTopicLabels = [];
  const keyEntities = new Set();
  const pillarScores = {
    jobs: 0,
    economy: 0,
    state: 0,
    food_essentials: 0,
    weather_markets: 0,
    world_impact: 0,
  };

  let maxUrgencyBonus = 0;

  for (const [pillar, subTopicsList] of Object.entries(INDEPTH_TOPICS)) {
    for (const sub of subTopicsList) {
      let subScore = 0;
      let matchedTermsCount = 0;

      for (const term of sub.terms) {
        let matched = false;
        if (term.includes(' ') || term.includes('-') || term.includes('.')) {
          matched = lowerCombined.includes(term);
        } else {
          matched = new RegExp(`\\b${term}\\b`, 'i').test(lowerCombined);
        }

        if (matched) {
          matchedTermsCount++;
          const inTitle = term.includes(' ') || term.includes('-') || term.includes('.')
            ? lowerTitle.includes(term)
            : new RegExp(`\\b${term}\\b`, 'i').test(lowerTitle);
          const termScore = inTitle ? sub.weight * 1.4 : sub.weight;
          subScore += termScore;
          keyEntities.add(term);
        }
      }

      if (matchedTermsCount > 0) {
        // Check urgency signals for this subtopic
        if (sub.urgencySignal) {
          for (const urg of sub.urgencySignal) {
            if (lowerCombined.includes(urg)) {
              subScore += 16;
              maxUrgencyBonus = Math.max(maxUrgencyBonus, 18);
              break;
            }
          }
        }

        matchedSubTopics.push(`${pillar}.${sub.id}`);
        subTopicLabels.push(sub.label);
        pillarScores[pillar] += subScore;
      }
    }
  }

  return {
    matchedSubTopics,
    subTopicLabels: [...new Set(subTopicLabels)],
    keyEntities: Array.from(keyEntities).slice(0, 8),
    pillarScores,
    urgencyBonus: maxUrgencyBonus,
  };
}

/**
 * Strict anti-fluff & personalized impact-scoring classifier.
 * Leverages deep in-depth topics + user learned affinities + global signals.
 */
function classifyAndScoreArticle(article, profile, options = {}) {
  const ageGroup = resolveAgeGroup(profile?.ageGroup || profile?.age);
  const country = resolveCountry(profile?.countryCode || profile?.countryName || profile?.country);
  const state = (profile?.state || '').trim();
  const stateKeywords = getStateKeywords(country, state);

  const userAffinities = options.userAffinities || profile?.userAffinities || {};
  const globalSignals = options.globalSignals || profile?.globalSignals || {};

  const title = String(article.title || '').trim();
  const summary = String(article.summary || '').trim();
  const categories = Array.isArray(article.categories) ? article.categories.join(' ') : '';
  const combined = `${title}. ${summary}. ${categories}`.trim();
  const lower = combined.toLowerCase();

  // 1. Check hard cinema/celebrity/entertainment rejection
  const isHardFluff = matchesAny(combined, HARD_FLUFF_PATTERNS);
  const isSportsFluff = matchesAny(combined, SPORTS_ENTERTAINMENT_PATTERNS);
  const hasMaterialOverride = matchesAny(combined, MATERIAL_IMPACT_OVERRIDE_PATTERNS);

  if (isHardFluff) {
    const strictlyCinemaGossip =
      /\b(box office|movie review|film review|trailer|teaser|bigg boss|dating|breakup|wedding|airport look|red carpet|oscar|filmfare|ott release|actor|actress|celebrity|bollywood|hollywood)\b/i.test(
        combined
      );
    if (strictlyCinemaGossip || !hasMaterialOverride) {
      return { rejected: true, reason: 'cinema_or_celebrity_fluff' };
    }
  }

  if (isSportsFluff && !hasMaterialOverride) {
    return { rejected: true, reason: 'sports_entertainment_fluff' };
  }

  const urlLower = String(article.url || '').toLowerCase();
  if (/\/(entertainment|celebrity|bollywood|hollywood|movies|lifestyle|horoscope|astrology|fashion|gossip)\b/.test(urlLower) && !hasMaterialOverride) {
    return { rejected: true, reason: 'entertainment_section' };
  }

  // 2. Extract in-depth hierarchical topics & score across all 6 impact pillars
  const topicAnalysis = extractInDepthTopics(combined, title);
  const { matchedSubTopics, subTopicLabels, keyEntities, pillarScores, urgencyBonus } = topicAnalysis;

  // Weather + Market/Food synergy boost (user rule: weather affecting stock market or food crisis)
  const hasWeatherSignal = /\b(monsoon|rain|flood|drought|heatwave|heat wave|cyclone|el nino|el niño|weather|storm|climate)\b/i.test(combined);
  const hasMarketOrFoodSignal = /\b(stock|market|nifty|sensex|s&p|crop|harvest|food|price|inflation|fmcg|power|grid|supply|commodity|agri)\b/i.test(combined);
  if (hasWeatherSignal && hasMarketOrFoodSignal) {
    pillarScores.weather_markets += 36;
  } else if (hasWeatherSignal && !hasMarketOrFoodSignal) {
    pillarScores.weather_markets = Math.min(pillarScores.weather_markets, 6);
  }

  // 3. Country & State relevance boost
  const countryNameLower = country.name.toLowerCase();
  const countryMentions =
    lower.includes(countryNameLower) ||
    (country.code === 'IN' && /\b(india|indian|rupee|rbi|sebi|nifty|sensex|delhi|mumbai|bengaluru|bangalore|chennai|hyderabad|kolkata|pune)\b/i.test(combined)) ||
    (country.code === 'US' && /\b(u\.s\.|usa|united states|american|fed|wall street|washington|dollar)\b/i.test(combined)) ||
    (country.code === 'GB' && /\b(uk|u\.k\.|britain|british|bank of england|london|ftse)\b/i.test(combined)) ||
    (country.centralBank && lower.includes(country.centralBank.toLowerCase()));

  let matchedStateTerm = '';
  for (const kw of stateKeywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(combined)) {
      matchedStateTerm = kw;
      break;
    }
  }

  if (matchedStateTerm) {
    pillarScores.state += 48;
    keyEntities.push(matchedStateTerm.toLowerCase());
  }

  if (article.feedHint && pillarScores[article.feedHint] !== undefined) {
    pillarScores[article.feedHint] += 12;
  }

  // 4. Adaptive Online Learning: Apply user topic affinities & global signals
  const userAffinityMatches = [];
  let topAffinitySubTopic = null;
  let topAffinityScore = 0;

  for (const subKey of matchedSubTopics) {
    const userPref = userAffinities[subKey];
    if (userPref && typeof userPref.weight === 'number') {
      userAffinityMatches.push(userPref.weight);
      if (userPref.weight > topAffinityScore) {
        topAffinityScore = userPref.weight;
        topAffinitySubTopic = subKey;
      }
    }
  }

  // Check pillar-level user affinities as well
  for (const pillar of Object.keys(pillarScores)) {
    const pPref = userAffinities[pillar];
    if (pPref && typeof pPref.weight === 'number') {
      userAffinityMatches.push(pPref.weight);
    }
  }

  let totalUserAffinityMultiplier = 1.0;
  if (userAffinityMatches.length > 0) {
    const minWeight = Math.min(...userAffinityMatches);
    const maxWeight = Math.max(...userAffinityMatches);
    // If user explicitly dismissed/suppressed this topic, suppress it
    if (minWeight < 0.85) {
      totalUserAffinityMultiplier = minWeight;
    } else {
      totalUserAffinityMultiplier = maxWeight;
    }
  }

  // 5. Apply age-group persona multipliers & determine dominant pillar
  let bestPillar = 'economy';
  let bestPillarScore = -1;
  let totalSignal = 0;

  for (const [pillar, rawScore] of Object.entries(pillarScores)) {
    const ageMult = ageGroup.weights[pillar] || 1.0;
    const weighted = rawScore * ageMult;
    totalSignal += weighted;
    if (weighted > bestPillarScore) {
      bestPillarScore = weighted;
      bestPillar = pillar;
    }
  }

  // Require minimum life-impact threshold
  if (bestPillarScore < 14 && totalSignal < 18) {
    return { rejected: true, reason: 'low_life_impact_signal' };
  }

  if (!countryMentions && !matchedStateTerm && pillarScores.world_impact < 20 && pillarScores.food_essentials < 22 && pillarScores.economy < 22) {
    return { rejected: true, reason: 'non_impacting_foreign_news' };
  }

  // 6. Compute final adaptive suggestion score
  let score = bestPillarScore + totalSignal * 0.25;
  if (countryMentions) score += 24;
  if (matchedStateTerm) score += 34;
  if (article.imageUrl) score += 22; // Prioritize reels with real editorial photography
  score += urgencyBonus;

  // Apply learned user affinity multiplier (boosts up to +60% or dampens dismissed topics)
  score *= totalUserAffinityMultiplier;

  // Freshness factor
  const ageHours = Math.max(0, (Date.now() - (article.publishedAt || Date.now())) / 3600000);
  const freshnessBonus = Math.max(0, 20 - ageHours * 0.35);
  score += freshnessBonus;

  // 7. Human-readable explainability
  const impactReasons = buildInDepthImpactReasons({
    bestPillar,
    subTopicLabels,
    ageGroup,
    country,
    state,
    matchedStateTerm,
    countryMentions,
    topAffinitySubTopic,
    totalUserAffinityMultiplier,
    urgencyBonus,
  });

  const pillarInfo = PILLAR_META[bestPillar] || PILLAR_META.economy;
  const normalizedScore = Math.min(99, Math.max(62, Math.round(52 + score * 0.35)));

  return {
    rejected: false,
    pillar: bestPillar,
    pillarLabel: pillarInfo.label,
    pillarShortLabel: pillarInfo.shortLabel,
    pillarAccent: pillarInfo.accent,
    subTopics: matchedSubTopics,
    subTopicLabels,
    keyEntities,
    impactScore: normalizedScore,
    rawScore: Math.round(score),
    matchedState: matchedStateTerm ? state || matchedStateTerm : '',
    countryRelevant: Boolean(countryMentions),
    impactReasons,
    whyItMatters: impactReasons[0] || `${ageGroup.persona} · ${country.name}`,
    urgency: urgencyBonus > 0,
    learnedBoost: totalUserAffinityMultiplier > 1.15,
  };
}

function buildInDepthImpactReasons({
  bestPillar,
  subTopicLabels,
  ageGroup,
  country,
  state,
  matchedStateTerm,
  countryMentions,
  topAffinitySubTopic,
  totalUserAffinityMultiplier,
  urgencyBonus,
}) {
  const reasons = [];

  // 1. If learned user affinity boosted this reel, highlight it transparently!
  if (totalUserAffinityMultiplier >= 1.25 && subTopicLabels.length > 0) {
    const boostPct = Math.round((totalUserAffinityMultiplier - 1.0) * 100);
    reasons.push(`Tailored to your focus on ${subTopicLabels[0]} (+${boostPct}% affinity)`);
  }

  // 2. Local state impact
  if (matchedStateTerm) {
    const spec = subTopicLabels.length > 0 ? ` (${subTopicLabels[0]})` : '';
    reasons.push(`Local impact · ${state || matchedStateTerm}${spec}`);
  }

  // 3. Urgency / Breaking price / rate change
  if (urgencyBonus > 0) {
    reasons.push('High Urgency · Breaking price or policy movement');
  }

  // 4. Subtopic & Persona match
  if (subTopicLabels.length > 0 && reasons.length < 3) {
    reasons.push(`${subTopicLabels[0]} · ${ageGroup.persona}`);
  }

  if (bestPillar === 'jobs' && reasons.length < 3) {
    reasons.push(`Career & Jobs · ${ageGroup.label} (${ageGroup.persona})`);
  }
  if (bestPillar === 'food_essentials' && reasons.length < 3) {
    reasons.push('Daily food prices & household budget');
  }
  if (bestPillar === 'weather_markets' && reasons.length < 3) {
    reasons.push('Weather impact on markets & agricultural supply');
  }
  if (bestPillar === 'economy' && reasons.length < 3) {
    reasons.push(`${country.name} macroeconomy & personal finance`);
  }
  if (bestPillar === 'world_impact' && reasons.length < 3) {
    reasons.push(`Global geopolitical shift affecting ${country.name}`);
  }

  if (reasons.length === 0) {
    reasons.push(countryMentions ? `${country.name} · ${ageGroup.persona}` : `Macro impact · ${ageGroup.label}`);
  }

  return reasons.slice(0, 3);
}

/**
 * Deduplicate near-identical headlines using token Jaccard similarity.
 */
function normalizeHeadlineTokens(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !['the', 'and', 'for', 'with', 'from', 'that', 'this', 'amid', 'over', 'into', 'after', 'says', 'india'].includes(w)
    );
}

function jaccardSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

/**
 * Adaptive suggestion ranker with topic diversity interleaving.
 * Prioritizes high-scoring and image-rich reels, while ensuring healthy
 * diversity across pillars, subtopics, and news domains.
 */
function deduplicateAndRank(scoredArticles, maxItems = 45, options = {}) {
  const sorted = [...scoredArticles].sort((a, b) => {
    // Lead images get top priority
    const imgDiff = (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
    if (imgDiff !== 0) return imgDiff;
    return b.rawScore - a.rawScore;
  });

  const unique = [];
  const tokenLists = [];
  const seenUrls = new Set();

  for (const item of sorted) {
    if (seenUrls.has(item.url)) continue;
    const tokens = normalizeHeadlineTokens(item.title);
    const isDuplicate = tokenLists.some((existingTokens) => jaccardSimilarity(tokens, existingTokens) >= 0.52);
    if (isDuplicate) continue;
    seenUrls.add(item.url);
    tokenLists.push(tokens);
    unique.push(item);
  }

  // Diversity interleaving: prevent 3+ items of the same pillar, subtopic, or domain back-to-back
  const result = [];
  const pool = [...unique];

  while (pool.length > 0 && result.length < maxItems) {
    const last = result[result.length - 1];
    const secondLast = result[result.length - 2];

    let chosenIdx = pool.findIndex((cand) => {
      const samePillarTwice = last && secondLast && last.pillar === cand.pillar && secondLast.pillar === cand.pillar;
      const sameDomainBackToBack = last && last.domain && cand.domain && last.domain === cand.domain;
      const sameSubTopic =
        last &&
        cand.subTopics &&
        last.subTopics &&
        cand.subTopics.length > 0 &&
        last.subTopics.some((st) => cand.subTopics.includes(st));

      return !samePillarTwice && !sameDomainBackToBack && !sameSubTopic;
    });

    if (chosenIdx === -1) {
      chosenIdx = pool.findIndex((cand) => {
        const samePillarTwice = last && secondLast && last.pillar === cand.pillar && secondLast.pillar === cand.pillar;
        return !samePillarTwice;
      });
    }

    if (chosenIdx === -1) chosenIdx = 0;
    result.push(pool.splice(chosenIdx, 1)[0]);
  }

  return result;
}

module.exports = {
  INDEPTH_TOPICS,
  extractInDepthTopics,
  classifyAndScoreArticle,
  deduplicateAndRank,
};
