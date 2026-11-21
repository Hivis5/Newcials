'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyAndScoreArticle, deduplicateAndRank } = require('../server/classifier');

const india27Profile = {
  age: 27,
  ageGroup: '25-30',
  countryCode: 'IN',
  countryName: 'India',
  state: 'Karnataka',
};

test('blocks Bollywood cinema, celebrity gossip, Oscars, and pure sports match highlights', () => {
  const fluffCases = [
    {
      title: 'Bollywood star spotted at airport ahead of blockbuster trailer launch and box office clash',
      summary: 'Celebrity couple wins hearts with red carpet fashion look.',
      url: 'https://example.com/bollywood/trailer',
    },
    {
      title: 'Oscars 2026 red carpet: Best dressed Hollywood actors and Netflix series winners',
      summary: 'A full recap of reality TV stars and awards night glamour.',
      url: 'https://example.com/entertainment/oscars',
    },
    {
      title: 'IPL 2026 match highlights: Kohli hits century as RCB win thriller',
      summary: 'Complete batting order scorecard and player of the match interview.',
      url: 'https://example.com/sports/ipl-highlights',
    },
  ];

  for (const item of fluffCases) {
    const res = classifyAndScoreArticle(item, india27Profile);
    assert.equal(res.rejected, true, `Expected rejection for: ${item.title}`);
  }
});

test('accepts and scores high on jobs, India economy, state policy, food prices, weather->stock market, and global impact', () => {
  const realCases = [
    {
      title: 'IT & GCC hiring jumps 18% in Bengaluru as global firms expand tech workforce',
      summary: 'Salary growth improves for software engineers across Karnataka.',
      url: 'https://economictimes.indiatimes.com/jobs/1',
      imageUrl: 'https://img.et.com/1.jpg',
    },
    {
      title: 'Tomato and onion prices spike 35% amid unseasonal rain and supply shortage',
      summary: 'Food inflation pushes household grocery bills higher across India.',
      url: 'https://www.livemint.com/economy/food-1',
      imageUrl: 'https://img.mint.com/2.jpg',
    },
    {
      title: 'El Niño monsoon deficit weighs on FMCG and agri stocks as Sensex dips',
      summary: 'Weak rainfall threatens kharif crop yields and rural demand.',
      url: 'https://www.business-standard.com/markets/weather-1',
      imageUrl: 'https://img.bs.com/3.jpg',
    },
    {
      title: 'OPEC crude oil rally and US tariffs threaten India import bill and rupee',
      summary: 'Global shipping disruptions lift energy costs for domestic manufacturers.',
      url: 'https://www.bbc.com/news/business/oil-1',
      imageUrl: 'https://img.bbc.com/4.jpg',
    },
  ];

  for (const item of realCases) {
    const res = classifyAndScoreArticle(item, india27Profile);
    assert.equal(res.rejected, false, `Expected acceptance for: ${item.title} (reason: ${res.reason})`);
    assert.ok(res.impactScore >= 70);
  }

  const bengaluruRes = classifyAndScoreArticle(realCases[0], india27Profile);
  assert.equal(bengaluruRes.matchedState, 'Karnataka');

  const weatherRes = classifyAndScoreArticle(realCases[2], india27Profile);
  assert.equal(weatherRes.pillar, 'weather_markets');
});

test('deduplicateAndRank removes near-duplicate headlines and preserves image-first priority', () => {
  const a1 = {
    title: 'RBI holds repo rate steady at 6.5% amid food inflation risks',
    url: 'https://a.com/1',
    domain: 'a.com',
    pillar: 'economy',
    rawScore: 100,
    imageUrl: 'https://a.com/img.jpg',
  };
  const a2 = {
    title: 'RBI holds repo rate steady at 6.5% on food inflation concerns',
    url: 'https://b.com/2',
    domain: 'b.com',
    pillar: 'economy',
    rawScore: 95,
    imageUrl: '',
  };
  const a3 = {
    title: 'Karnataka semiconductor hub creates 20,000 engineering jobs',
    url: 'https://c.com/3',
    domain: 'c.com',
    pillar: 'jobs',
    rawScore: 90,
    imageUrl: 'https://c.com/img.jpg',
  };

  const ranked = deduplicateAndRank([a1, a2, a3]);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].url, 'https://a.com/1');
  assert.equal(ranked[1].url, 'https://c.com/3');
});

test('allows entertainment/hospitality stories only when tied to real-life food inflation or tax/cost impact', () => {
  const foodOverride = classifyAndScoreArticle(
    {
      title: 'Restaurant and dining prices jump 18% amid severe tomato and edible oil shortages',
      summary: 'Food crisis and staple shortages push everyday meal costs higher across India.',
      url: 'https://www.livemint.com/food-cost-hike',
      imageUrl: 'https://img.mint.com/food.jpg',
    },
    india27Profile
  );
  assert.equal(foodOverride.rejected, false);
  assert.equal(foodOverride.pillar, 'food_essentials');

  const gstDiningOverride = classifyAndScoreArticle(
    {
      title: 'Restaurant and streaming bundle prices jump 18% amid edible oil inflation and GST changes',
      summary: 'Food prices and consumer taxes push everyday dining bills higher in India.',
      url: 'https://www.livemint.com/food-gst-hike',
      imageUrl: 'https://img.mint.com/food2.jpg',
    },
    india27Profile
  );
  assert.equal(gstDiningOverride.rejected, false);
  assert.ok(['food_essentials', 'economy'].includes(gstDiningOverride.pillar));

  const pureCinema = classifyAndScoreArticle(
    {
      title: 'Shah Rukh Khan movie review: blockbuster box office hit breaks records',
      summary: 'Fans celebrate weekend cinema collection.',
      url: 'https://www.example.com/entertainment/srk',
    },
    india27Profile
  );
  assert.equal(pureCinema.rejected, true);
});

test('extractInDepthTopics accurately identifies deep subtopics and urgency', () => {
  const { extractInDepthTopics } = require('../server/classifier');

  const gccStory = extractInDepthTopics(
    'Global capability centre expansion drives 25% salary hike for cloud architects in Bengaluru',
    'GCC expansion drives 25% salary hike for cloud architects in Bengaluru'
  );
  assert.ok(gccStory.matchedSubTopics.includes('jobs.tech_software_ai'));
  assert.ok(gccStory.subTopicLabels.includes('Tech & AI Careers'));

  const onionCrisis = extractInDepthTopics(
    'Onion and tomato prices double across APMC mandis after unseasonal rain damage',
    'Onion and tomato prices double across APMC mandis'
  );
  assert.ok(onionCrisis.matchedSubTopics.includes('food_essentials.vegetables_mandis'));
  assert.ok(onionCrisis.urgencyBonus > 0);

  const shippingStory = extractInDepthTopics(
    'Red Sea shipping disruptions and crude oil surge increase container freight rates',
    'Red Sea shipping disruptions and crude oil surge'
  );
  assert.ok(shippingStory.matchedSubTopics.includes('world_impact.chokepoints_shipping'));
});

test('adaptive learning algorithm boosts suggestions and updates explainability based on user interaction history', () => {
  const baseArticle = {
    title: 'GCC hiring surges across Bengaluru and Hyderabad as global fintech firms expand',
    summary: 'Cloud architects and AI engineers receive higher variable compensation.',
    url: 'https://economictimes.indiatimes.com/tech-gcc',
    imageUrl: 'https://img.et.com/gcc.jpg',
  };

  // 1. Initial baseline score (no interaction history)
  const baseline = classifyAndScoreArticle(baseArticle, india27Profile);
  assert.equal(baseline.rejected, false);
  assert.equal(baseline.learnedBoost, false);

  // 2. Score with learned user affinity (simulating user who saved multiple GCC/tech stories)
  const learnedProfile = {
    ...india27Profile,
    userAffinities: {
      'jobs.tech_software_ai': { weight: 1.6, positiveHits: 3, negativeHits: 0 },
    },
  };

  const adapted = classifyAndScoreArticle(baseArticle, learnedProfile);
  assert.equal(adapted.rejected, false);
  assert.equal(adapted.learnedBoost, true);
  assert.ok(adapted.rawScore > baseline.rawScore, 'Expected score to increase with positive affinity');
  assert.ok(
    adapted.impactReasons.some((r) => r.includes('Tailored to your focus on Tech & AI Careers')),
    'Expected personalized explainability reason'
  );

  // 3. User with negative affinity (dismissed this topic)
  const suppressedProfile = {
    ...india27Profile,
    userAffinities: {
      'jobs.tech_software_ai': { weight: 0.35, positiveHits: 0, negativeHits: 3 },
    },
  };
  const suppressed = classifyAndScoreArticle(baseArticle, suppressedProfile);
  assert.ok(suppressed.rawScore < baseline.rawScore, 'Expected score to decrease with negative affinity');
});

