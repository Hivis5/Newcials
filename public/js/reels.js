import { api, escapeHtml, safeUrl, formatRelativeTime } from './api.js';
import { ICONS } from './icons.js';
import { store, showToast } from './state.js';

let currentObserver = null;
let scrollController = null;

export function getReelScrollController() {
  return scrollController;
}

export function renderReelsView(stageEl, { onOpenWhySheet, onNavigateTab, onFeedUpdated }) {
  const user = store.user;
  const feed = store.feed;
  const articles = feed?.articles || [];

  const locationLabel = user?.state
    ? `${user.countryFlag || ''} ${user.state}`
    : `${user?.countryFlag || '🌍'} ${user?.countryName || 'Global'}`;

  const stateChipLabel = user?.state ? user.state : 'Local';

  const filterChips = [
    { id: 'all', label: 'For You' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'economy', label: 'Economy' },
    { id: 'state', label: stateChipLabel },
    { id: 'food_essentials', label: 'Food & Prices' },
    { id: 'weather_markets', label: 'Weather/Mkts' },
    { id: 'world_impact', label: 'World Impact' },
  ];

  const chipsHtml = filterChips
    .map(
      (c) => `
      <button type="button" class="pillar-chip ${store.activePillar === c.id ? 'active' : ''}" data-pillar="${escapeHtml(c.id)}">
        ${escapeHtml(c.label)}
      </button>`
    )
    .join('');

  let bodyHtml = '';
  if (store.loadingFeed && articles.length === 0) {
    bodyHtml = `
      <div class="reel-loading">
        <div class="pulse-ring"></div>
        <div style="font-family:var(--font-display);font-weight:800;font-size:17px;">Aggregating real-impact news…</div>
        <div style="font-size:12.5px;color:var(--text-secondary);max-width:260px;">
          Scanning economy, jobs, food prices, weather &amp; global feeds for ${escapeHtml(user?.state || user?.countryName || 'you')}. Blocking celebrity &amp; cinema fluff.
        </div>
      </div>`;
  } else if (articles.length === 0) {
    bodyHtml = `
      <div class="reel-empty">
        <div style="font-size:32px;">📡</div>
        <div style="font-family:var(--font-display);font-weight:800;font-size:17px;">No matching reels in this filter</div>
        <div style="font-size:12.5px;color:var(--text-secondary);max-width:250px;">
          Try switching back to <strong>For You</strong> or refresh to pull the latest stories.
        </div>
        <button type="button" class="more-article-link" id="empty-reset-filter">Show For You Feed</button>
      </div>`;
  } else {
    bodyHtml = `
      <div class="reels-scroll" id="reels-scroll">
        ${articles.map((article, idx) => renderReelCard(article, idx, articles.length)).join('')}
      </div>`;
  }

  stageEl.innerHTML = `
    <div class="reels-viewport">
      <div class="reels-top-overlay">
        <div class="reels-top-row">
          <div class="reels-brand-pill">
            <span class="live-dot" title="${feed?.sourceMode === 'live' ? 'Live Aggregated' : 'Offline Fallback'}"></span>
            <span>Newcials</span>
          </div>
          <div class="reels-top-actions">
            <button type="button" class="geo-chip" id="top-geo-chip" title="Edit location &amp; age">
              ${ICONS.pin}
              <span>${escapeHtml(locationLabel)}</span>
            </button>
            <button type="button" class="icon-circle-btn ${store.loadingFeed ? 'spinning' : ''}" id="refresh-feed-btn" title="Refresh live news">
              ${ICONS.refresh}
            </button>
          </div>
        </div>
        <div class="pillar-chips-bar" id="pillar-chips-bar">${chipsHtml}</div>
      </div>
      ${bodyHtml}
    </div>
  `;

  bindTopControls(stageEl, onNavigateTab, onFeedUpdated);

  if (articles.length > 0) {
    setupReelsInteractions(stageEl, articles, { onOpenWhySheet, onFeedUpdated });
  } else {
    const resetBtn = stageEl.querySelector('#empty-reset-filter');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        store.activePillar = 'all';
        onFeedUpdated({ reloadFromServer: true });
      });
    }
  }
}

function renderReelCard(article, idx, total) {
  const articleUrl = safeUrl(article.url, 'https://news.google.com');
  const imgUrl = safeUrl(article.imageUrl || article.fallbackCoverUrl, article.fallbackCoverUrl || '/assets/covers/economy.svg');
  const fallbackImg = safeUrl(article.fallbackCoverUrl, '/assets/covers/economy.svg');
  const initial = (article.source || 'N').trim().charAt(0).toUpperCase();
  const relTime = formatRelativeTime(article.publishedAt);
  const accent = article.pillarAccent || '#38bdf8';

  return `
    <article class="reel-card ${idx === 0 ? 'is-active' : ''}" data-reel-idx="${idx}" data-article-id="${escapeHtml(article.id)}" data-accent="${escapeHtml(accent)}">
      <div class="reel-media">
        <img
          class="reel-image"
          src="${escapeHtml(imgUrl)}"
          alt="${escapeHtml(article.title)}"
          referrerpolicy="no-referrer"
          loading="${idx < 3 ? 'eager' : 'lazy'}"
          data-fallback="${escapeHtml(fallbackImg)}"
        />
      </div>
      <div class="reel-scrim"></div>

      <div class="reel-index-pill">${idx + 1} / ${total}</div>

      <div class="reel-rail">
        <button type="button" class="rail-btn ${article.liked ? 'liked' : ''}" data-action="like" aria-label="Like story">
          <span class="rail-icon-wrap">${article.liked ? ICONS.heartFilled : ICONS.heart}</span>
          <span class="rail-label">${article.liked ? 'Liked' : 'Like'}</span>
        </button>

        <button type="button" class="rail-btn ${article.saved ? 'saved' : ''}" data-action="save" aria-label="Save story">
          <span class="rail-icon-wrap">${article.saved ? ICONS.bookmarkFilled : ICONS.bookmark}</span>
          <span class="rail-label">${article.saved ? 'Saved' : 'Save'}</span>
        </button>

        <button type="button" class="rail-btn" data-action="why" aria-label="Why this matters">
          <span class="rail-icon-wrap">${ICONS.zap}</span>
          <span class="rail-label">${escapeHtml(article.impactScore || 88)}%</span>
        </button>

        <button type="button" class="rail-btn" data-action="share" aria-label="Share story">
          <span class="rail-icon-wrap">${ICONS.share}</span>
          <span class="rail-label">Share</span>
        </button>

        <button type="button" class="rail-btn" data-action="dismiss" aria-label="Hide story">
          <span class="rail-icon-wrap">${ICONS.x}</span>
          <span class="rail-label">Hide</span>
        </button>
      </div>

      <div class="reel-content">
        <div class="reel-source-row">
          <span class="source-avatar">${escapeHtml(initial)}</span>
          <span class="source-name">${escapeHtml(article.source)}</span>
          <span class="source-time">• ${escapeHtml(relTime)}</span>
          <span class="pillar-badge" style="--badge-accent:${escapeHtml(accent)}">${escapeHtml(article.pillarShortLabel || article.pillarLabel)}</span>
          ${article.subTopicLabels && article.subTopicLabels[0] ? `<span class="subtopic-badge">${escapeHtml(article.subTopicLabels[0])}</span>` : ''}
          ${article.learnedBoost ? `<span class="learned-pill">🎯 For You</span>` : ''}
          ${article.urgency ? `<span class="urgency-pill">⚡ Alert</span>` : ''}
        </div>

        <h2 class="reel-heading">${escapeHtml(article.title)}</h2>

        ${
          article.summary
            ? `<div class="reel-summary-row"><p class="reel-summary-text">${escapeHtml(article.summary)}</p></div>`
            : ''
        }

        <div class="reel-footer-actions">
          <a
            class="more-article-link"
            href="${escapeHtml(articleUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            data-action="more-link"
          >
            <span>... more</span>
            ${ICONS.external}
          </a>
          <button type="button" class="why-pill" data-action="why">
            <span>${escapeHtml(article.whyItMatters)}</span>
          </button>
        </div>
      </div>

      ${idx === 0 ? `<div class="swipe-hint">Swipe up for next reel ↑</div>` : ''}
    </article>
  `;
}

function bindTopControls(stageEl, onNavigateTab, onFeedUpdated) {
  const geoBtn = stageEl.querySelector('#top-geo-chip');
  if (geoBtn) {
    geoBtn.addEventListener('click', () => onNavigateTab('profile'));
  }

  const refreshBtn = stageEl.querySelector('#refresh-feed-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      onFeedUpdated({ reloadFromServer: true, forceRefresh: true });
    });
  }

  stageEl.querySelectorAll('.pillar-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const nextPillar = chip.getAttribute('data-pillar') || 'all';
      if (nextPillar === store.activePillar) return;
      store.activePillar = nextPillar;
      store.activeReelIndex = 0;
      onFeedUpdated({ reloadFromServer: true, forceRefresh: false });
    });
  });
}

function setupReelsInteractions(stageEl, articles, { onOpenWhySheet, onFeedUpdated }) {
  const scroller = stageEl.querySelector('#reels-scroll');
  if (!scroller) return;

  // Image error fallback
  scroller.querySelectorAll('.reel-image').forEach((img) => {
    img.addEventListener('error', () => {
      const fb = img.getAttribute('data-fallback');
      if (fb && img.src !== new URL(fb, window.location.origin).href) {
        img.src = fb;
      }
    });
  });

  // Restore scroll index if returning to Reels tab
  if (store.activeReelIndex > 0 && store.activeReelIndex < articles.length) {
    const targetCard = scroller.children[store.activeReelIndex];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'instant' });
    }
  }

  // Active reel IntersectionObserver (controls Ken Burns + Ambient Glow + Counter)
  if (currentObserver) currentObserver.disconnect();
  const cards = Array.from(scroller.querySelectorAll('.reel-card'));

  function setActiveIndex(idx) {
    store.activeReelIndex = idx;
    cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    const activeArticle = articles[idx];
    if (activeArticle?.pillarAccent) {
      document.documentElement.style.setProperty('--reel-accent', activeArticle.pillarAccent);
    }
    const counterEl = document.getElementById('desktop-reel-counter');
    if (counterEl) {
      counterEl.textContent = `${idx + 1} / ${articles.length}`;
    }
  }

  setActiveIndex(Math.min(store.activeReelIndex, Math.max(0, articles.length - 1)));

  currentObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          const idx = Number(entry.target.getAttribute('data-reel-idx'));
          if (Number.isFinite(idx)) setActiveIndex(idx);
        }
      }
    },
    { root: scroller, threshold: [0.6] }
  );

  cards.forEach((card) => currentObserver.observe(card));

  // Mouse vertical drag-to-swipe for desktop browsers
  let dragStartY = 0;
  let dragStartScrollTop = 0;
  let isDragging = false;
  let didDrag = false;

  scroller.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (e.target.closest('a, button, input, select')) return;
    isDragging = true;
    didDrag = false;
    dragStartY = e.clientY;
    dragStartScrollTop = scroller.scrollTop;
    scroller.classList.add('dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartY;
    if (Math.abs(delta) > 5) didDrag = true;
    scroller.scrollTop = dragStartScrollTop - delta;
  });

  window.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    scroller.classList.remove('dragging');
    if (didDrag) {
      const h = scroller.clientHeight || 1;
      const targetIdx = Math.max(0, Math.min(articles.length - 1, Math.round(scroller.scrollTop / h)));
      scroller.scrollTo({ top: targetIdx * h, behavior: 'smooth' });
    }
  });

  // Expose imperative scroll controller for keyboard & desktop buttons
  scrollController = {
    next() {
      const nextIdx = Math.min(articles.length - 1, store.activeReelIndex + 1);
      scroller.scrollTo({ top: nextIdx * scroller.clientHeight, behavior: 'smooth' });
    },
    prev() {
      const prevIdx = Math.max(0, store.activeReelIndex - 1);
      scroller.scrollTo({ top: prevIdx * scroller.clientHeight, behavior: 'smooth' });
    },
    toggleLikeActive() {
      const card = cards[store.activeReelIndex];
      const article = articles[store.activeReelIndex];
      if (card && article) toggleLike(card, article, !article.liked);
    },
    toggleSaveActive() {
      const card = cards[store.activeReelIndex];
      const article = articles[store.activeReelIndex];
      if (card && article) toggleSave(card, article);
    },
    openActiveArticle() {
      const article = articles[store.activeReelIndex];
      if (article?.url) {
        window.open(safeUrl(article.url), '_blank', 'noopener,noreferrer');
      }
    },
  };

  // Double-tap / double-click on reel card to like with heart burst
  let lastTapTime = 0;
  scroller.addEventListener('click', (e) => {
    if (didDrag) return;
    const card = e.target.closest('.reel-card');
    if (!card) return;

    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.getAttribute('data-action');
      const idx = Number(card.getAttribute('data-reel-idx'));
      const article = articles[idx];
      if (!article) return;

      if (action === 'like') {
        toggleLike(card, article, !article.liked);
      } else if (action === 'save') {
        toggleSave(card, article);
      } else if (action === 'why') {
        onOpenWhySheet(article);
      } else if (action === 'share') {
        shareArticle(article);
      } else if (action === 'dismiss') {
        dismissArticle(card, idx, article, articles, scroller, onFeedUpdated);
      }
      return;
    }

    // Double-tap anywhere on the media/backdrop likes the reel
    const now = Date.now();
    if (now - lastTapTime < 290) {
      const idx = Number(card.getAttribute('data-reel-idx'));
      const article = articles[idx];
      if (article) {
        const rect = card.getBoundingClientRect();
        spawnHeartBurst(card, e.clientX - rect.left, e.clientY - rect.top);
        if (!article.liked) {
          toggleLike(card, article, true);
        }
      }
      lastTapTime = 0;
    } else {
      lastTapTime = now;
    }
  });
}

function spawnHeartBurst(card, x, y) {
  const burst = document.createElement('div');
  burst.className = 'heart-burst';
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  burst.innerHTML = ICONS.heartBig;
  card.appendChild(burst);
  setTimeout(() => burst.remove(), 750);
}

async function toggleLike(card, article, nextLiked) {
  article.liked = nextLiked;
  const btn = card.querySelector('[data-action="like"]');
  if (btn) {
    btn.classList.toggle('liked', nextLiked);
    btn.querySelector('.rail-icon-wrap').innerHTML = nextLiked ? ICONS.heartFilled : ICONS.heart;
    btn.querySelector('.rail-label').textContent = nextLiked ? 'Liked' : 'Like';
  }
  try {
    await api.setInteraction({ articleId: article.id, liked: nextLiked, article });
  } catch {
    // non-fatal
  }
}

async function toggleSave(card, article) {
  const nextSaved = !article.saved;
  article.saved = nextSaved;
  const btn = card.querySelector('[data-action="save"]');
  if (btn) {
    btn.classList.toggle('saved', nextSaved);
    btn.querySelector('.rail-icon-wrap').innerHTML = nextSaved ? ICONS.bookmarkFilled : ICONS.bookmark;
    btn.querySelector('.rail-label').textContent = nextSaved ? 'Saved' : 'Save';
  }
  showToast(nextSaved ? 'Saved to your collection' : 'Removed from saved');
  try {
    await api.setInteraction({ articleId: article.id, saved: nextSaved, article });
  } catch {
    // non-fatal
  }
}

async function shareArticle(article) {
  const shareUrl = safeUrl(article.url);
  try {
    if (navigator.share) {
      await navigator.share({ title: article.title, url: shareUrl });
      return;
    }
  } catch {
    // fallback to clipboard
  }
  try {
    await navigator.clipboard.writeText(`${article.title}\n${shareUrl}`);
    showToast('Article link copied');
  } catch {
    showToast('Tap More ↗ to open article');
  }
}

async function dismissArticle(card, idx, article, articles, scroller, onFeedUpdated) {
  showToast('Hidden from your feed');
  try {
    await api.setInteraction({ articleId: article.id, dismissed: true });
  } catch {
    // ignore
  }
  const nextIdx = Math.min(articles.length - 1, idx + 1);
  if (nextIdx !== idx) {
    scroller.scrollTo({ top: nextIdx * scroller.clientHeight, behavior: 'smooth' });
  }
  setTimeout(() => {
    if (store.feed?.articles) {
      store.feed.articles = store.feed.articles.filter((a) => a.id !== article.id);
      onFeedUpdated({ reloadFromServer: false });
    }
  }, 260);
}

