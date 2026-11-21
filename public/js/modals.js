import { api, escapeHtml, safeUrl, setStoredUid, formatRelativeTime } from './api.js';
import { ICONS } from './icons.js';
import { store, resolveAgeGroupMeta, getStatesForCountry, showToast } from './state.js';

export function closeSheet() {
  const backdrop = document.getElementById('sheet-backdrop');
  if (backdrop) {
    backdrop.classList.add('hidden');
    backdrop.setAttribute('aria-hidden', 'true');
  }
}

export function openWhySheet(article) {
  const backdrop = document.getElementById('sheet-backdrop');
  const panel = document.getElementById('sheet-panel');
  if (!backdrop || !panel || !article) return;

  const articleUrl = safeUrl(article.url, 'https://news.google.com');
  const reasons = Array.isArray(article.impactReasons) && article.impactReasons.length
    ? article.impactReasons
    : [article.whyItMatters || 'High real-world impact'];

  panel.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="reel-source-row" style="margin-bottom:8px;">
      <span class="pillar-badge" style="--badge-accent:${escapeHtml(article.pillarAccent || '#38bdf8')}">${escapeHtml(article.pillarLabel || 'Impact')}</span>
      ${article.subTopicLabels && article.subTopicLabels.length ? `<span class="subtopic-badge">${escapeHtml(article.subTopicLabels.join(' · '))}</span>` : ''}
      ${article.learnedBoost ? `<span class="learned-pill">🎯 Learned from your saves</span>` : ''}
      <span class="source-time">${escapeHtml(article.source)} • ${escapeHtml(formatRelativeTime(article.publishedAt))}</span>
    </div>
    <h3 class="sheet-title">${escapeHtml(article.title)}</h3>
    ${article.summary ? `<p class="sheet-summary">${escapeHtml(article.summary)}</p>` : ''}
    <div class="radar-section-title" style="margin-bottom:6px;">WHY THIS IS IN YOUR FEED</div>
    <div class="sheet-reason-list">
      ${reasons
        .map(
          (r) => `
        <div class="sheet-reason-item">
          ${ICONS.zap}
          <span>${escapeHtml(r)}</span>
        </div>`
        )
        .join('')}
    </div>
    ${Array.isArray(article.keyEntities) && article.keyEntities.length ? `
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px;">
        ${article.keyEntities.map((e) => `<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,0.06);color:var(--text-secondary);">#${escapeHtml(e)}</span>`).join('')}
      </div>` : ''}
    <a class="primary-cta" href="${escapeHtml(articleUrl)}" target="_blank" rel="noopener noreferrer">
      <span>Read Full Story on ${escapeHtml(article.source)}</span>
      ${ICONS.external}
    </a>
    <button type="button" class="secondary-btn" id="sheet-close-btn">Back to Reels</button>
  `;

  backdrop.classList.remove('hidden');
  backdrop.setAttribute('aria-hidden', 'false');

  panel.querySelector('#sheet-close-btn')?.addEventListener('click', closeSheet);
}

export function renderRadarView(stageEl, { onJumpToPillar }) {
  const feed = store.feed;
  const user = store.user;
  const pillars = store.meta.pillars || {};
  const counts = feed?.pillarCounts || {};
  const blockedSamples = feed?.filteredOutSamples || [];

  const topicKeys = ['jobs', 'economy', 'state', 'food_essentials', 'weather_markets', 'world_impact'];
  const topicsHtml = topicKeys
    .map((key) => {
      const meta = pillars[key] || { label: key, accent: '#38bdf8' };
      const label = key === 'state' && user?.state ? `${user.state} & Local` : meta.label;
      const count = counts[key] || 0;
      return `
        <button type="button" class="topic-jump-btn" data-jump-pillar="${escapeHtml(key)}">
          <span style="display:flex;align-items:center;gap:9px;">
            <span style="width:9px;height:9px;border-radius:50%;background:${escapeHtml(meta.accent)};"></span>
            <span>${escapeHtml(label)}</span>
          </span>
          <span class="topic-count">${count} reels →</span>
        </button>`;
    })
    .join('');

  const blockedHtml = blockedSamples.length
    ? blockedSamples
        .map(
          (item) => `
        <div class="blocked-sample-item">
          <span class="blocked-tag">BLOCKED</span>
          <span>${escapeHtml(item.title)}</span>
        </div>`
        )
        .join('')
    : `<div style="font-size:12px;color:var(--text-secondary);">No cinema or celebrity noise leaked into your feed. All scanned feeds are filtered automatically.</div>`;

  stageEl.innerHTML = `
    <div class="panel-view">
      <div class="panel-header">
        <h2 class="panel-title">Impact Radar</h2>
        <p class="panel-sub">
          Curated for <strong>@${escapeHtml(user?.username)}</strong> (${escapeHtml(user?.ageLabel)} · ${escapeHtml(user?.persona)}) in
          <strong>${escapeHtml(user?.state ? `${user.state}, ${user.countryName}` : user?.countryName)}</strong>.
        </p>
      </div>

      <div class="radar-stats-grid">
        <div class="stat-card">
          <div class="stat-value green">${escapeHtml(feed?.articles?.length ?? 0)}</div>
          <div class="stat-label">High-impact reels ready</div>
        </div>
        <div class="stat-card">
          <div class="stat-value coral">${escapeHtml(feed?.filteredOutCount ?? 0)}</div>
          <div class="stat-label">Fluff / low-impact blocked</div>
        </div>
      </div>

      <div class="radar-section">
        <div class="radar-section-title">EXPLORE BY IMPACT PILLAR</div>
        <div class="topic-jump-list">${topicsHtml}</div>
      </div>

      <div class="radar-section">
        <div class="radar-section-title">ENTERTAINMENT &amp; CELEB SHIELD</div>
        ${blockedHtml}
      </div>

      <div class="radar-section" style="margin-bottom:4px;">
        <div class="radar-section-title">AGGREGATION ENGINE</div>
        <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;">
          Mode: <strong style="color:#fff;">${feed?.sourceMode === 'live' ? 'Live Multi-Website Aggregation' : 'Offline Preview Cache'}</strong><br/>
          Publishers in mix: <strong style="color:#fff;">${escapeHtml(feed?.uniquePublisherCount ?? 0)}</strong> · Scanned: <strong style="color:#fff;">${escapeHtml(feed?.totalScanned ?? 0)}</strong> items
        </div>
      </div>
    </div>
  `;

  stageEl.querySelectorAll('[data-jump-pillar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pillar = btn.getAttribute('data-jump-pillar');
      onJumpToPillar(pillar);
    });
  });
}

export async function renderSavedView(stageEl, { onOpenWhySheet, onNavigateToReels }) {
  stageEl.innerHTML = `
    <div class="panel-view">
      <div class="panel-header">
        <h2 class="panel-title">Saved Reels</h2>
        <p class="panel-sub">Your bookmarked economy, job, food &amp; policy updates.</p>
      </div>
      <div id="saved-content" style="font-size:13px;color:var(--text-secondary);">Loading saved stories…</div>
    </div>
  `;

  try {
    const res = await api.getSaved();
    store.saved = res.saved || [];
    const contentEl = stageEl.querySelector('#saved-content');
    if (!contentEl) return;

    if (store.saved.length === 0) {
      contentEl.innerHTML = `
        <div class="radar-section" style="text-align:center;padding:28px 18px;">
          <div style="font-size:28px;margin-bottom:8px;">🔖</div>
          <div style="font-family:var(--font-display);font-weight:700;color:#fff;margin-bottom:6px;">No saved reels yet</div>
          <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px;">
            Tap the bookmark icon while scrolling to keep important updates handy.
          </div>
          <button type="button" class="more-article-link" id="saved-go-reels">Browse Reels</button>
        </div>
      `;
      contentEl.querySelector('#saved-go-reels')?.addEventListener('click', onNavigateToReels);
      return;
    }

    contentEl.innerHTML = `
      <div class="saved-grid">
        ${store.saved
          .map((item, idx) => {
            const img = safeUrl(item.imageUrl || item.fallbackCoverUrl, '/assets/covers/economy.svg');
            const fb = safeUrl(item.fallbackCoverUrl, '/assets/covers/economy.svg');
            return `
              <div class="saved-card" data-saved-idx="${idx}">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(item.title)}" referrerpolicy="no-referrer" data-fallback="${escapeHtml(fb)}" />
                <div class="saved-card-overlay">
                  <span class="saved-card-source">${escapeHtml(item.source)}</span>
                  <div class="saved-card-title">${escapeHtml(item.title)}</div>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    contentEl.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => {
        const fb = img.getAttribute('data-fallback');
        if (fb && img.src !== new URL(fb, window.location.origin).href) {
          img.src = fb;
        }
      });
    });

    contentEl.querySelectorAll('.saved-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = Number(card.getAttribute('data-saved-idx'));
        const item = store.saved[idx];
        if (item) onOpenWhySheet(item);
      });
    });
  } catch (err) {
    const contentEl = stageEl.querySelector('#saved-content');
    if (contentEl) contentEl.textContent = err.message;
  }
}

export function renderProfileView(stageEl, { onProfileUpdated, onSwitchAccount }) {
  const user = store.user;
  if (!user) return;

  const countries = store.meta.countries || [];
  let editAge = user.age;
  let editCountry = countries.some((c) => c.code === user.countryCode) ? user.countryCode : '__custom__';
  let editCustomCountry = editCountry === '__custom__' ? user.countryName : '';
  const initialStates = getStatesForCountry(editCountry);
  let editState =
    !user.state
      ? ''
      : initialStates.includes(user.state)
      ? user.state
      : '__custom_state__';
  let editCustomState = editState === '__custom_state__' ? user.state : '';

  function draw() {
    const activeGroup = resolveAgeGroupMeta(editAge);
    const statesList = getStatesForCountry(editCountry);
    const avatarInitial = (user.username || 'N').charAt(0).toUpperCase();

    stageEl.innerHTML = `
      <div class="panel-view">
        <div class="panel-header">
          <h2 class="panel-title">Your Persona</h2>
          <p class="panel-sub">Update your age, country, or state to re-aggregate your feed.</p>
        </div>

        <div class="profile-hero">
          <div class="profile-avatar">${escapeHtml(avatarInitial)}</div>
          <div>
            <div style="font-family:var(--font-display);font-weight:800;font-size:17px;">@${escapeHtml(user.username)}</div>
            <div style="font-size:12.5px;color:var(--text-secondary);">
              ${escapeHtml(user.ageLabel)} · ${escapeHtml(user.persona)}<br/>
              ${escapeHtml(user.countryFlag)} ${escapeHtml(user.state ? `${user.state}, ${user.countryName}` : user.countryName)}
            </div>
          </div>
        </div>

        <form id="profile-form" class="form-stack">
          <div class="field-group">
            <label class="field-label" for="prof-username"><span>Username</span></label>
            <div class="input-wrap">
              <span class="input-prefix">@</span>
              <input id="prof-username" class="text-input with-prefix" type="text" required minlength="2" maxlength="32" value="${escapeHtml(user.username)}" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="prof-age">
              <span>Age</span>
              <span class="field-hint">${escapeHtml(activeGroup?.persona || '')}</span>
            </label>
            <input id="prof-age" class="text-input" type="number" min="13" max="110" required value="${escapeHtml(editAge)}" />
          </div>

          <div class="field-group">
            <label class="field-label" for="prof-country"><span>Country</span></label>
            <select id="prof-country" class="select-input">
              ${countries
                .map(
                  (c) => `<option value="${escapeHtml(c.code)}" ${editCountry === c.code ? 'selected' : ''}>${escapeHtml(c.flag)} ${escapeHtml(c.name)}</option>`
                )
                .join('')}
              <option value="__custom__" ${editCountry === '__custom__' ? 'selected' : ''}>🌍 Other Country…</option>
            </select>
            ${
              editCountry === '__custom__'
                ? `<input id="prof-custom-country" class="text-input" type="text" required value="${escapeHtml(editCustomCountry)}" placeholder="Country name" />`
                : ''
            }
          </div>

          <div class="field-group">
            <label class="field-label" for="prof-state"><span>State / Region (Optional)</span></label>
            ${
              statesList.length > 0 && editCountry !== '__custom__'
                ? `<select id="prof-state" class="select-input">
                    <option value="">All regions (National)</option>
                    ${statesList
                      .map((st) => `<option value="${escapeHtml(st)}" ${editState === st ? 'selected' : ''}>${escapeHtml(st)}</option>`)
                      .join('')}
                    <option value="__custom_state__" ${editState === '__custom_state__' ? 'selected' : ''}>Type custom state / city…</option>
                  </select>`
                : `<input id="prof-custom-state" class="text-input" type="text" value="${escapeHtml(editCustomState)}" placeholder="Optional state or city" />`
            }
            ${
              editState === '__custom_state__' && statesList.length > 0
                ? `<input id="prof-custom-state" class="text-input" type="text" value="${escapeHtml(editCustomState)}" placeholder="Enter state or city" />`
                : ''
            }
          </div>

          <div id="prof-error" class="form-error hidden"></div>
          <button type="submit" class="primary-cta" id="prof-save-btn">Save &amp; Re-Aggregate Feed</button>
        </form>

        <button type="button" class="secondary-btn" id="switch-account-btn">Switch or Create New Account</button>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    stageEl.querySelector('#prof-age')?.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      if (Number.isFinite(val)) editAge = val;
    });

    stageEl.querySelector('#prof-country')?.addEventListener('change', (e) => {
      editCountry = e.target.value;
      editState = '';
      editCustomState = '';
      draw();
    });

    stageEl.querySelector('#prof-state')?.addEventListener('change', (e) => {
      editState = e.target.value;
      draw();
    });

    stageEl.querySelector('#profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = stageEl.querySelector('#prof-username')?.value?.trim() || user.username;
      const age = Number(stageEl.querySelector('#prof-age')?.value || editAge);
      const country =
        editCountry === '__custom__'
          ? stageEl.querySelector('#prof-custom-country')?.value?.trim() || ''
          : editCountry;
      const state =
        editCountry === '__custom__' || editState === '__custom_state__' || !stageEl.querySelector('#prof-state')
          ? stageEl.querySelector('#prof-custom-state')?.value?.trim() || ''
          : editState;

      const btn = stageEl.querySelector('#prof-save-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Updating & Fetching News…';
      }

      try {
        const res = await api.updateProfile({ username, age, country, state });
        store.user = res.user;
        showToast('Profile updated — refreshing reels');
        onProfileUpdated(res.user);
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Save & Re-Aggregate Feed';
        }
        const errEl = stageEl.querySelector('#prof-error');
        if (errEl) {
          errEl.textContent = err.message;
          errEl.classList.remove('hidden');
        }
      }
    });

    stageEl.querySelector('#switch-account-btn')?.addEventListener('click', async () => {
      try {
        await api.logout();
      } catch {
        // ignore
      }
      setStoredUid('');
      store.user = null;
      store.feed = null;
      onSwitchAccount();
    });
  }

  draw();
}

