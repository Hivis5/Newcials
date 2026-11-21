# Newcials 📱🗞️

> **Newcials is an addictive, Instagram Reels-like news aggregator built for real-life impact. Zero cinema or celebrity fluff—just the economy, jobs, food prices, weather shocks, and policy tailored to your age, country, and state. Features an adaptive learning algorithm, global RSS and GDELT ingestion, and a mobile-first UI with zero npm dependencies.**

---

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.5.0-68a063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Node%20Built--ins)-brightgreen)]()
[![Database](https://img.shields.io/badge/Database-SQLite%20(node:sqlite)-003B57?logo=sqlite&logoColor=white)]()
[![Tests](https://img.shields.io/badge/Tests-16%2F16%20Passing-success)]()
[![PWA](https://img.shields.io/badge/PWA-Ready-orange)]()

---

## 💡 The Problem & The Idea

Traditional social media platforms like Instagram Reels and TikTok have mastered high-dopamine vertical swipe feeds, but their algorithms optimize for celebrity gossip, cinema drama, influencer trends, and sensationalist fluff. Meanwhile, critical information that actually shapes your life—inflation rates, job hiring surges or layoffs, food shortages, local state infrastructure budgets, crop weather spillovers into commodity prices, and geopolitical trade tariffs—is buried in dense, dry newspaper websites.

**Newcials** flips this on its head:
1. **Swipe like Reels**: High-engagement vertical snap-scroll cards, image-first presentation, dynamic Ken Burns motion, double-tap heart animations, and smooth touch gestures.
2. **Zero Fluff**: A strict multi-stage classifier actively discards cinema, Bollywood/Hollywood rumors, celebrity divorces, red-carpet fashion, reality TV, and pure sports scorecards.
3. **Only Real-Life Impact**: Aggregates news that directly affects your wallet, career, and dinner table, tailored to your exact demographic persona (age group, country, and state).
4. **Self-Improving Suggestions**: An adaptive learning algorithm observes your likes, saves, and dismissals to refine topic weights and provide transparent "Why This Matters" explanations.

---

## ✨ Key Features

### 1. 📱 Mobile Studio UI & Reels Experience
- **Desktop Studio Frame**: On desktop screens, Newcials renders within an ultra-realistic iPhone frame featuring dynamic ambient lighting, status bar, notch, and desktop side rails with real-time radar stats.
- **Full-Bleed Mobile PWA**: On mobile devices, the app seamlessly expands to an edge-to-edge native app experience with PWA manifest support.
- **Image-First Cards**: Prioritizes lead editorial photography with fallback SVG artwork per pillar. Bold headline typography sits cleanly in the lower third with an expandable `... more ↗` link opening the original source.
- **Fluid Gestures & Double-Tap**: Mouse drag-to-swipe, touch snap-scroll, keyboard navigation (`J`/`K` or `↑`/`↓`), and double-tap heart burst animations.

### 2. 🌐 Multi-Layer News Ingestion (100+ Feeds & Global Discovery)
Newcials operates a 3-layer feed aggregation engine:
- **Layer 1: Global Always-On Feeds**: Major broadcasters (BBC, The Guardian, NPR, DW, France 24, Al Jazeera) and independent/reader-funded investigative publications (ProPublica, The Intercept, Semafor, War on the Rocks, Drop Site News, Naked Capitalism, Wolf Street, Marginal Revolution, 404 Media, The Markup, Stratechery, Krebs on Security, Ars Technica, MIT Tech Review, Hacker News, Lobsters).
- **Layer 2: Regional Specialist Feeds**: Curated direct RSS feeds across 7 world regions:
  - **China**: *China Digital Times, China Media Project, Pandaily, What's on Weibo, South China Morning Post*
  - **Australia**: *Crikey, Independent Australia, Michael West Media, ABC News Australia, The Sydney Morning Herald*
  - **Europe**: *EUobserver, Euractiv, VoxEurop, The Baltic Times, Euronews*
  - **North America**: *The Lever, The Tyee, PBS NewsHour, CBC News, MarketWatch*
  - **Latin America**: *Latin America Reports, MercoPress, Brasil de Fato, El País (América), Folha de S.Paulo*
  - **Africa**: *Daily Maverick, How We Made It In Africa, The Africa Report, Africanews, AllAfrica*
  - **Southeast Asia**: *New Naratif, The Irrawaddy, Mekong Review, Rappler, Channel NewsAsia (CNA)*
  - **India**: *LiveMint, Economic Times, Business Standard, The Hindu (national + state feeds), The Ken, ThePrint*
- **Layer 3: Dynamic Internet Search Discovery**: When a user selects or switches to any country in the world, the server automatically queries **Bing News RSS**, **Google News RSS**, and **GDELT DOC 2.0** with country-specific economic, employment, food price, and policy queries.

### 3. 🎯 6 Impact Pillars & Hierarchical Ontology
Every story is mapped into one of six actionable pillars:
| Pillar | Focus & Examples | Accent |
| :--- | :--- | :--- |
| **💼 Job Market** | Hiring drives, tech & AI careers, layoffs, appraisals, labor law, return-to-office, visa mobility | `#38bdf8` |
| **📈 Economy & Finance** | Central bank rates (RBI/Fed/ECB), income tax slabs, GST, inflation, EMIs, personal finance | `#34d399` |
| **🏛️ State & Local** | Regional infrastructure, metro lines, state industrial parks, utility tariffs, municipal costs | `#a78bfa` |
| **🛒 Food & Essentials** | Mandi prices, tomato/onion surges, staple crops, edible oils, medicine price caps, water crises | `#fb923c` |
| **⚡ Weather & Markets** | Monsoon deficits, droughts, heatwaves, cyclones affecting agricultural stocks and power grids | `#facc15` |
| **🌍 World Impact** | Global trade tariffs, shipping chokepoints (Red Sea), OPEC crude rallies, foreign currency shifts | `#f472b6` |

### 4. 🧠 Self-Improving Adaptive Learning Algorithm
- **Online Topic Affinities**: As you interact with reels (Double-tap/Like, Bookmark/Save, or Dismiss), Newcials records multi-term affinities in SQLite.
- **Dynamic Re-Ranking**: Liked/saved subtopics receive score boosts (up to +60%), while dismissed topics are dampened.
- **Collaborative Global Signals**: Aggregates interaction signals across users to surface high-relevance emerging stories.
- **Explainable AI**: The "Why This Matters" sheet transparently displays badges such as `🎯 For You (+35% affinity)` or `⚡ Breaking Price Movement` with matched subtopic tags.

### 5. 🛡️ Strict Anti-Fluff Engine with Material Overrides
- **Fluff Filter**: Regex patterns reject entertainment gossip, movie reviews, box office numbers, red-carpet looks, dating rumors, reality shows (*Bigg Boss*, *Koffee with Karan*), and routine sports recaps (*IPL*, match highlights).
- **Material Impact Exception**: If an entertainment or hospitality story involves genuine macroeconomic or daily-life consequences (e.g., GST changes on restaurant dining, cinema worker strikes, or food supply shortages), it is preserved.

---

## 🏗️ Architecture & Tech Stack

Newcials is built with **zero external npm dependencies**, using the modern Node.js standard library:

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (Vanilla ES)                 │
│   Snap-Scroll Reels • Ken Burns • Modals • SVG Icons   │
└───────────────────────────▲────────────────────────────┘
                            │ REST JSON & Cookies
┌───────────────────────────▼────────────────────────────┐
│                  Server (node:http)                    │
│   Router • Static File Server • API Request Handlers   │
├───────────────────────────┬────────────────────────────┤
│   Aggregator & Pipeline   │    Hierarchical Classifier │
│   • Multi-RSS Concurrency │    • 6 Impact Pillars      │
│   • GDELT DOC 2.0 Ingest  │    • Anti-Fluff Blocker    │
│   • <meta og:image> Fetch │    • Topic Sub-Ontology    │
├───────────────────────────┴────────────────────────────┤
│                   Database (node:sqlite)               │
│   Users • Interactions • Feed Cache • Image Cache       │
│   User Topic Affinities • Global Topic Signals         │
└────────────────────────────────────────────────────────┘
```

- **Runtime**: Node.js `>= 22.5.0`
- **Database**: Built-in `node:sqlite` (`DatabaseSync`) operating in WAL (Write-Ahead Logging) mode
- **Network Ingestion**: Native global `fetch` with streaming response headers for ultra-fast `og:image` extraction
- **Frontend**: Vanilla ES2022 JavaScript, responsive CSS3 variables, CSS scroll-snap, IntersectionObserver, and SVG icons

---

## 📁 Project Structure

```
newcials/
├── server/
│   ├── index.js          # Server entry point (starts HTTP server on port 3000)
│   ├── app.js            # Request router, static asset server, API route handlers
│   ├── db.js             # SQLite schema, user profiles, interactions, and topic affinities
│   ├── profiles.js       # Demographic definitions (age groups, country metadata, state maps)
│   ├── sources.js        # 3-layer RSS & GDELT feed catalog across 7 world regions
│   ├── rssParser.js      # Zero-dependency XML/RSS/Atom parser & <meta og:image> extractor
│   ├── classifier.js     # Hierarchical topic ontology, anti-fluff filter & adaptive scoring
│   ├── aggregator.js     # Concurrency pipeline, feed caching, and og:image enrichment
│   └── fallbackData.js   # Curated offline fallback articles with local SVG covers
├── public/
│   ├── index.html        # Mobile phone studio frame, notch, rails, and reel container
│   ├── manifest.json     # PWA manifest for standalone home screen installation
│   ├── styles/
│   │   └── main.css      # Complete responsive layout, Reels animations, and modals
│   ├── js/
│   │   ├── main.js       # Application bootstrapper, keyboard listeners, rail syncing
│   │   ├── api.js        # Fetch API client with automatic session header management
│   │   ├── state.js      # Reactive client store and toast notifications
│   │   ├── reels.js      # Reels swipe engine, double-tap heart animation, action buttons
│   │   ├── modals.js     # "Why This Matters" sheet, Radar view, and Saved reels modal
│   │   ├── onboarding.js # Onboarding modal, age-group chips, country & state selector
│   │   └── icons.js      # Embedded SVG icon registry
│   └── assets/
│       └── covers/       # Vector SVG artwork for offline mode & fallback pillar art
├── test/
│   ├── api.test.js        # In-process mock HTTP integration tests (auth, feed, profile)
│   ├── classifier.test.js # Fluff rejection, material overrides, and adaptive learning tests
│   ├── rssParser.test.js  # XML, Atom, CDATA, Bing unwrapping, and og:image tests
│   └── sources.test.js    # Regional feeds validation and dynamic search discovery tests
├── package.json          # Project scripts (zero dependencies)
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 22.5.0` (Verify with `node -v`)

### Installation & Run

1. Clone or navigate to the repository:
   ```bash
   cd newcials
   ```

2. Start the server (no `npm install` needed—zero external dependencies!):
   ```bash
   npm start
   ```

3. Open your browser and visit:
   ```
   http://127.0.0.1:3000
   ```

---

## 🧪 Testing

Newcials includes a test suite covering RSS parsing, classifier accuracy, fluff filtering, adaptive learning weights, and end-to-end API flows:

```bash
npm test
```

### Test Coverage Highlights
- ✅ **Fluff Blocking**: Rejects Bollywood/Hollywood gossip, reality TV, Oscars, and routine match recaps.
- ✅ **Material Impact Overrides**: Accepts stories involving food inflation or tax impacts even if set in entertainment contexts.
- ✅ **Adaptive Affinity Learning**: Verifies that liking/saving boosts topic suggestions and dismissing suppresses them.
- ✅ **Regional Feed Catalog**: Confirms valid endpoints for China, Australia, Europe, North America, Latin America, Africa, and Southeast Asia.
- ✅ **Dynamic Search Discovery**: Verifies that changing to an unlisted country automatically generates targeted Bing and Google News discovery feeds.

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check and current timestamp |
| `GET` | `/api/meta` | Supported age groups, countries, states, and pillar metadata |
| `GET` | `/api/auth/me` | Current authenticated user profile and recent local accounts |
| `POST` | `/api/auth/account` | Create a new user or sign in (`username`, `age`, `country`, `state`) |
| `POST` | `/api/auth/logout` | Clears user session cookie |
| `PUT` | `/api/profile` | Updates age, country, or state and recalibrates feed persona |
| `GET` | `/api/feed` | Returns aggregated, filtered, and personalized reels (`refresh=1` forces fresh fetch) |
| `POST` | `/api/interactions` | Records `liked`, `saved`, or `dismissed` flags and updates topic affinities |
| `GET` | `/api/saved` | Retrieves all saved bookmarked reels for the authenticated user |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `J` / `↓` | Swipe to next reel |
| `K` / `↑` | Swipe to previous reel |
| `L` | Like / Unlike active reel |
| `S` | Save / Bookmark active reel |
| `W` | Open "Why This Matters" explanation sheet |
| `R` | Refresh feed with latest articles |
| `O` | Open original article website in a new tab |

---

## 📄 License

MIT © Newcials Contributors. Built for high-signal, zero-fluff news literacy.
