'use strict';

/**
 * Country, state, and age-group persona definitions for Newcials.
 * Used both for onboarding metadata and for tailoring RSS/API queries & scoring.
 */

const AGE_GROUPS = [
  {
    id: '18-24',
    label: '18–24',
    minAge: 18,
    maxAge: 24,
    persona: 'Student & Early Career',
    tagline: 'Entry-level jobs, AI skills, rent & daily cost of living',
    weights: {
      jobs: 1.45,
      economy: 1.15,
      food_essentials: 1.2,
      state: 1.15,
      weather_markets: 0.95,
      world_impact: 1.1,
    },
    queryFocus: 'hiring OR internship OR "entry level" OR tech skills OR rent OR tuition OR startup',
  },
  {
    id: '25-30',
    label: '25–30',
    minAge: 25,
    maxAge: 30,
    persona: 'Working Professional',
    tagline: 'Job market, salaries, tax, EMIs, inflation, food prices & global shifts',
    weights: {
      jobs: 1.5,
      economy: 1.45,
      state: 1.35,
      food_essentials: 1.3,
      weather_markets: 1.25,
      world_impact: 1.3,
    },
    queryFocus: 'jobs OR hiring OR layoffs OR salary OR tax OR inflation OR "interest rate" OR market',
  },
  {
    id: '31-45',
    label: '31–45',
    minAge: 31,
    maxAge: 45,
    persona: 'Mid-Career & Household',
    tagline: 'Career growth, home loans, grocery inflation, healthcare & state policy',
    weights: {
      economy: 1.45,
      food_essentials: 1.4,
      jobs: 1.3,
      state: 1.35,
      weather_markets: 1.2,
      world_impact: 1.2,
    },
    queryFocus: 'economy OR "home loan" OR mortgage OR tax OR grocery OR healthcare OR jobs',
  },
  {
    id: '46-60',
    label: '46–60',
    minAge: 46,
    maxAge: 60,
    persona: 'Senior Career & Wealth',
    tagline: 'Markets, policy, corporate tax, trade, commodities & retirement planning',
    weights: {
      economy: 1.5,
      weather_markets: 1.35,
      world_impact: 1.35,
      food_essentials: 1.25,
      state: 1.2,
      jobs: 1.1,
    },
    queryFocus: 'markets OR stocks OR policy OR trade OR tariff OR tax OR pension OR commodities',
  },
  {
    id: '60+',
    label: '60+',
    minAge: 60,
    maxAge: 120,
    persona: 'Retiree & Fixed Income',
    tagline: 'Interest rates, pensions, food prices, healthcare costs & local utilities',
    weights: {
      food_essentials: 1.5,
      economy: 1.4,
      state: 1.3,
      weather_markets: 1.25,
      world_impact: 1.15,
      jobs: 0.75,
    },
    queryFocus: 'pension OR "interest rate" OR "fixed deposit" OR healthcare OR "food prices" OR inflation',
  },
];

const COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    gl: 'IN',
    ceid: 'IN:en',
    bingMkt: 'en-IN',
    gdeltCountry: 'India',
    centralBank: 'RBI',
    currency: 'rupee',
    stockIndex: 'Sensex Nifty',
    states: [
      'Karnataka',
      'Maharashtra',
      'Delhi NCR',
      'Tamil Nadu',
      'Telangana',
      'Gujarat',
      'West Bengal',
      'Uttar Pradesh',
      'Kerala',
      'Rajasthan',
      'Andhra Pradesh',
      'Punjab',
      'Haryana',
      'Madhya Pradesh',
      'Bihar',
      'Odisha',
      'Assam',
      'Chandigarh',
      'Goa',
    ],
    stateCities: {
      Karnataka: ['Bengaluru', 'Bangalore', 'Mysuru', 'Mangaluru', 'Hubballi'],
      Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai'],
      'Delhi NCR': ['Delhi', 'New Delhi', 'Noida', 'Gurugram', 'Gurgaon', 'Faridabad', 'Ghaziabad'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Hosur'],
      Telangana: ['Hyderabad', 'Warangal', 'Secunderabad', 'HITEC City'],
      Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'GIFT City', 'Rajkot'],
      'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur'],
      'Uttar Pradesh': ['Lucknow', 'Noida', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj'],
      Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
      Rajasthan: ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota'],
      'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Amaravati', 'Tirupati'],
      Punjab: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Mohali'],
      Haryana: ['Gurugram', 'Gurgaon', 'Faridabad', 'Panipat'],
      'Madhya Pradesh': ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur'],
      Bihar: ['Patna', 'Gaya', 'Muzaffarpur'],
      Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela'],
      Assam: ['Guwahati', 'Dibrugarh'],
    },
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    gl: 'US',
    ceid: 'US:en',
    bingMkt: 'en-US',
    gdeltCountry: 'United States',
    centralBank: 'Federal Reserve',
    currency: 'dollar',
    stockIndex: 'S&P 500 Nasdaq Dow',
    states: [
      'California',
      'New York',
      'Texas',
      'Florida',
      'Washington',
      'Illinois',
      'Massachusetts',
      'Georgia',
      'New Jersey',
      'North Carolina',
      'Virginia',
      'Colorado',
      'Pennsylvania',
      'Arizona',
    ],
    stateCities: {
      California: ['San Francisco', 'Silicon Valley', 'Los Angeles', 'San Jose', 'San Diego'],
      'New York': ['New York City', 'NYC', 'Manhattan', 'Brooklyn', 'Buffalo'],
      Texas: ['Austin', 'Dallas', 'Houston', 'San Antonio'],
      Washington: ['Seattle', 'Bellevue', 'Redmond'],
      Massachusetts: ['Boston', 'Cambridge'],
      Illinois: ['Chicago'],
      Florida: ['Miami', 'Tampa', 'Orlando'],
    },
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    gl: 'GB',
    ceid: 'GB:en',
    bingMkt: 'en-GB',
    gdeltCountry: 'United Kingdom',
    centralBank: 'Bank of England',
    currency: 'pound',
    stockIndex: 'FTSE 100',
    states: ['London', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Manchester', 'Birmingham'],
    stateCities: {
      London: ['London', 'Canary Wharf', 'City of London'],
      Scotland: ['Edinburgh', 'Glasgow', 'Aberdeen'],
      Wales: ['Cardiff', 'Swansea'],
    },
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    gl: 'CA',
    ceid: 'CA:en',
    bingMkt: 'en-CA',
    gdeltCountry: 'Canada',
    centralBank: 'Bank of Canada',
    currency: 'Canadian dollar',
    stockIndex: 'TSX',
    states: ['Ontario', 'British Columbia', 'Quebec', 'Alberta', 'Manitoba', 'Nova Scotia'],
    stateCities: {
      Ontario: ['Toronto', 'Ottawa', 'Waterloo'],
      'British Columbia': ['Vancouver', 'Victoria'],
      Quebec: ['Montreal', 'Quebec City'],
      Alberta: ['Calgary', 'Edmonton'],
    },
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    gl: 'AU',
    ceid: 'AU:en',
    bingMkt: 'en-AU',
    gdeltCountry: 'Australia',
    centralBank: 'RBA',
    currency: 'Australian dollar',
    stockIndex: 'ASX 200',
    states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
    stateCities: {
      'New South Wales': ['Sydney', 'Newcastle'],
      Victoria: ['Melbourne'],
      Queensland: ['Brisbane'],
      'Western Australia': ['Perth'],
    },
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    gl: 'SG',
    ceid: 'SG:en',
    bingMkt: 'en-SG',
    gdeltCountry: 'Singapore',
    centralBank: 'MAS',
    currency: 'Singapore dollar',
    stockIndex: 'STI',
    states: ['Central Region', 'East Region', 'North Region', 'West Region'],
    stateCities: {},
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    gl: 'AE',
    ceid: 'AE:en',
    bingMkt: 'en-AE',
    gdeltCountry: 'United Arab Emirates',
    centralBank: 'UAE Central Bank',
    currency: 'dirham',
    stockIndex: 'ADX DFM',
    states: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
    stateCities: {},
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    gl: 'DE',
    ceid: 'DE:en',
    bingMkt: 'en-DE',
    gdeltCountry: 'Germany',
    centralBank: 'ECB Bundesbank',
    currency: 'euro',
    stockIndex: 'DAX',
    states: ['Berlin', 'Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Hesse'],
    stateCities: {
      Bavaria: ['Munich', 'Nuremberg'],
      Hesse: ['Frankfurt'],
    },
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    gl: 'JP',
    ceid: 'JP:en',
    bingMkt: 'en-JP',
    gdeltCountry: 'Japan',
    centralBank: 'Bank of Japan',
    currency: 'yen',
    stockIndex: 'Nikkei 225',
    states: ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Fukuoka'],
    stateCities: {},
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    gl: 'FR',
    ceid: 'FR:en',
    bingMkt: 'en-FR',
    gdeltCountry: 'France',
    centralBank: 'ECB Banque de France',
    currency: 'euro',
    stockIndex: 'CAC 40',
    states: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Provence-Alpes-Côte d’Azur'],
    stateCities: {
      'Île-de-France': ['Paris'],
    },
  },
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    gl: 'CN',
    ceid: 'CN:en',
    bingMkt: 'en-US',
    gdeltCountry: 'China',
    centralBank: 'PBOC',
    currency: 'yuan',
    stockIndex: 'CSI 300 Shanghai Hang Seng',
    states: ['Guangdong', 'Beijing', 'Shanghai', 'Zhejiang', 'Jiangsu', 'Sichuan', 'Shandong'],
    stateCities: {
      Guangdong: ['Shenzhen', 'Guangzhou', 'Dongguan'],
      Beijing: ['Beijing', 'Chaoyang', 'Haidian'],
      Shanghai: ['Shanghai', 'Pudong'],
      Zhejiang: ['Hangzhou', 'Ningbo'],
    },
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    gl: 'BR',
    ceid: 'BR:pt',
    bingMkt: 'pt-BR',
    gdeltCountry: 'Brazil',
    centralBank: 'BCB',
    currency: 'real',
    stockIndex: 'Ibovespa',
    states: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul'],
    stateCities: {
      'São Paulo': ['São Paulo', 'Campinas'],
      'Rio de Janeiro': ['Rio de Janeiro'],
    },
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    gl: 'ZA',
    ceid: 'ZA:en',
    bingMkt: 'en-ZA',
    gdeltCountry: 'South Africa',
    centralBank: 'SARB',
    currency: 'rand',
    stockIndex: 'JSE Top 40',
    states: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
    stateCities: {
      Gauteng: ['Johannesburg', 'Pretoria'],
      'Western Cape': ['Cape Town'],
      'KwaZulu-Natal': ['Durban'],
    },
  },
];

const PILLAR_META = {
  jobs: {
    id: 'jobs',
    label: 'Job Market',
    shortLabel: 'Jobs',
    accent: '#38bdf8',
    icon: 'briefcase',
  },
  economy: {
    id: 'economy',
    label: 'Economy & Finance',
    shortLabel: 'Economy',
    accent: '#34d399',
    icon: 'trending-up',
  },
  state: {
    id: 'state',
    label: 'State & Local',
    shortLabel: 'Local',
    accent: '#a78bfa',
    icon: 'map-pin',
  },
  food_essentials: {
    id: 'food_essentials',
    label: 'Food & Essentials',
    shortLabel: 'Food & Prices',
    accent: '#fb923c',
    icon: 'shopping-bag',
  },
  weather_markets: {
    id: 'weather_markets',
    label: 'Weather & Markets',
    shortLabel: 'Weather/Mkts',
    accent: '#facc15',
    icon: 'cloud-lightning',
  },
  world_impact: {
    id: 'world_impact',
    label: 'World Impact',
    shortLabel: 'World Impact',
    accent: '#f472b6',
    icon: 'globe',
  },
};

function resolveAgeGroup(ageInput) {
  if (typeof ageInput === 'string') {
    const foundById = AGE_GROUPS.find((g) => g.id === ageInput.trim());
    if (foundById) return foundById;
  }
  const num = Number(ageInput);
  if (!Number.isFinite(num) || num < 13) {
    return AGE_GROUPS[1]; // default 25-30 Working Professional
  }
  if (num <= 24) return AGE_GROUPS[0];
  if (num <= 30) return AGE_GROUPS[1];
  if (num <= 45) return AGE_GROUPS[2];
  if (num <= 60) return AGE_GROUPS[3];
  return AGE_GROUPS[4];
}

function resolveCountry(countryInput) {
  if (!countryInput) return COUNTRIES[0];
  const raw = String(countryInput).trim();
  const upper = raw.toUpperCase();
  const byCode = COUNTRIES.find((c) => c.code === upper);
  if (byCode) return byCode;
  const byName = COUNTRIES.find((c) => c.name.toLowerCase() === raw.toLowerCase());
  if (byName) return byName;

  // Dynamic fallback for any custom country name entered by user
  return {
    code: upper.slice(0, 2).replace(/[^A-Z]/g, '') || 'US',
    name: raw,
    flag: '🌍',
    gl: 'US',
    ceid: 'US:en',
    bingMkt: 'en-US',
    gdeltCountry: raw,
    centralBank: 'central bank',
    currency: 'currency',
    stockIndex: 'stock market',
    states: [],
    stateCities: {},
  };
}

function getStateKeywords(country, stateName) {
  if (!stateName) return [];
  const trimmed = stateName.trim();
  if (!trimmed || trimmed.toLowerCase() === 'all' || trimmed.toLowerCase().startsWith('all ')) {
    return [];
  }
  const cities = country?.stateCities?.[trimmed] || [];
  return [trimmed, ...cities];
}

module.exports = {
  AGE_GROUPS,
  COUNTRIES,
  PILLAR_META,
  resolveAgeGroup,
  resolveCountry,
  getStateKeywords,
};

