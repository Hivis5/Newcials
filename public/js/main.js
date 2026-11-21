import { api } from './api.js';
import { ICONS } from './icons.js';
import { store, showToast } from './state.js';
import { renderOnboarding } from './onboarding.js';
import { renderReelsView, getReelScrollController } from './reels.js';
import { openWhySheet, closeSheet, renderRadarView, renderSavedView, renderProfileView } from './modals.js';

const rootEl = document.getElementById('app-root');

function updateDesktopRails() {
  const personaName = document.getElementById('desktop-persona-name');
  const personaMeta = document.getElementById('desktop-persona-meta');
  const shieldStat = document.getElementById('desktop-shield-stat');
  const shieldSub = document.getElementById('desktop-shield-sub');
  const counterEl = document.getElementById('desktop-reel-counter');

  if (!store.user) {
    if (personaName) personaName.textContent = 'Create Your Profile';
    if (personaMeta) personaMeta.textContent = 'Enter username, age, country & optional state inside the phone.';
    if (shieldStat) shieldStat.textContent = 'Cinema & celeb gossip blocked';
    if (shieldSub) shieldSub.textContent = 'Only economy, jobs, food prices, weather & global impact.';
    if (counterEl) counterEl.textContent = '—';
    return;
  }

  if (personaName) {
    personaName.textContent = `@${store.user.username} · ${store.user.persona}`;
  }
  if (personaMeta) {
    const loc = store.user.state ? `${store.user.state}, ${store.user.countryName}` : store.user.countryName;
    personaMeta.textContent = `Age ${store.user.age} (${store.user.ageLabel}) · ${store.user.countryFlag} ${loc}`;
  }

  if (store.feed) {
    const blocked = store.feed.filteredOutCount || 0;
    const total = store.feed.totalScanned || 0;
    if (shieldStat) {
      shieldStat.textContent = `${blocked} fluff stories blocked`;
    }
    if (shieldSub) {
      shieldSub.textContent = `Kept ${store.feed.articles?.length || 0} high-impact reels from ${store.feed.uniquePublisherCount || 0} outlets (${total} scanned).`;
    }
  }
}

async function loadFeed({ forceRefresh = false } = {}) {
  store.loadingFeed = true;
  if (store.activeTab === 'reels') renderActiveView();
  try {
    const data = await api.getFeed({
      pillar: store.activePillar,
      refresh: forceRefresh,
    });
    store.feed = data;
    if (forceRefresh) {
      showToast(
        data.sourceMode === 'live'
          ? `Aggregated ${data.articles.length} live impact reels`
          : `Loaded ${data.articles.length} curated reels (offline preview)`
      );
    }
  } catch (err) {
    showToast(err.message || 'Could not load feed');
  } finally {
    store.loadingFeed = false;
    updateDesktopRails();
    if (store.activeTab === 'reels' || store.activeTab === 'radar') {
      renderActiveView();
    }
  }
}

function renderShell() {
  if (!store.user) {
    updateDesktopRails();
    renderOnboarding(rootEl, async () => {
      store.activeTab = 'reels';
      store.activePillar = 'all';
      store.activeReelIndex = 0;
      renderShell();
      await loadFeed({ forceRefresh: false });
    });
    return;
  }

  rootEl.innerHTML = `
    <div class="main-stage" id="main-stage"></div>
    <nav class="bottom-nav" aria-label="Primary navigation">
      <button type="button" class="nav-tab ${store.activeTab === 'reels' ? 'active' : ''}" data-tab="reels">
        ${ICONS.reels}
        <span>Reels</span>
      </button>
      <button type="button" class="nav-tab ${store.activeTab === 'radar' ? 'active' : ''}" data-tab="radar">
        ${ICONS.radar}
        <span>Radar</span>
      </button>
      <button type="button" class="nav-tab ${store.activeTab === 'saved' ? 'active' : ''}" data-tab="saved">
        ${ICONS.bookmark}
        <span>Saved</span>
      </button>
      <button type="button" class="nav-tab ${store.activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
        ${ICONS.user}
        <span>Profile</span>
      </button>
    </nav>
  `;

  rootEl.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextTab = btn.getAttribute('data-tab');
      if (!nextTab) return;
      store.activeTab = nextTab;
      renderShell();
    });
  });

  renderActiveView();
  updateDesktopRails();
}

function renderActiveView() {
  const stageEl = document.getElementById('main-stage');
  if (!stageEl) return;

  if (store.activeTab === 'reels') {
    renderReelsView(stageEl, {
      onOpenWhySheet: openWhySheet,
      onNavigateTab: (tab) => {
        store.activeTab = tab;
        renderShell();
      },
      onFeedUpdated: async ({ reloadFromServer = false, forceRefresh = false } = {}) => {
        if (reloadFromServer) {
          await loadFeed({ forceRefresh });
        } else {
          renderActiveView();
          updateDesktopRails();
        }
      },
    });
  } else if (store.activeTab === 'radar') {
    renderRadarView(stageEl, {
      onJumpToPillar: async (pillar) => {
        store.activePillar = pillar || 'all';
        store.activeReelIndex = 0;
        store.activeTab = 'reels';
        renderShell();
        await loadFeed({ forceRefresh: false });
      },
    });
  } else if (store.activeTab === 'saved') {
    renderSavedView(stageEl, {
      onOpenWhySheet: openWhySheet,
      onNavigateToReels: () => {
        store.activeTab = 'reels';
        renderShell();
      },
    });
  } else if (store.activeTab === 'profile') {
    renderProfileView(stageEl, {
      onProfileUpdated: async () => {
        store.activePillar = 'all';
        store.activeReelIndex = 0;
        store.activeTab = 'reels';
        renderShell();
        await loadFeed({ forceRefresh: true });
      },
      onSwitchAccount: async () => {
        try {
          const auth = await api.getMe();
          store.recentAccounts = auth.recentAccounts || [];
        } catch {
          // ignore
        }
        renderShell();
      },
    });
  }
}

function bindGlobalControls() {
  // Bottom sheet backdrop close
  const backdrop = document.getElementById('sheet-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSheet();
    });
  }

  // Desktop rail buttons
  document.getElementById('desktop-prev-btn')?.addEventListener('click', () => {
    getReelScrollController()?.prev();
  });
  document.getElementById('desktop-next-btn')?.addEventListener('click', () => {
    getReelScrollController()?.next();
  });

  // Keyboard shortcuts when not typing in an input
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (!store.user || store.activeTab !== 'reels') return;

    const ctrl = getReelScrollController();
    if (!ctrl) return;

    if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
      e.preventDefault();
      ctrl.next();
    } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      ctrl.prev();
    } else if (e.key === 'l' || e.key === 'L') {
      ctrl.toggleLikeActive();
    } else if (e.key === 'b' || e.key === 'B') {
      ctrl.toggleSaveActive();
    } else if (e.key === 'Enter') {
      const sheetVisible = !document.getElementById('sheet-backdrop')?.classList.contains('hidden');
      if (!sheetVisible) ctrl.openActiveArticle();
    } else if (e.key === 'Escape') {
      closeSheet();
    }
  });
}

async function init() {
  bindGlobalControls();
  try {
    const [meta, me] = await Promise.all([api.getMeta(), api.getMe()]);
    store.meta = meta;
    store.user = me.user || null;
    store.recentAccounts = me.recentAccounts || [];
  } catch (err) {
    showToast('Connecting to server…');
  }

  renderShell();
  if (store.user) {
    await loadFeed({ forceRefresh: false });
  }
}

init();

