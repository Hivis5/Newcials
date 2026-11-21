import { api, escapeHtml, setStoredUid } from './api.js';
import { ICONS } from './icons.js';
import { store, resolveAgeGroupMeta, getStatesForCountry, showToast } from './state.js';

export function renderOnboarding(container, onAuthenticated) {
  let mode = 'create'; // 'create' | 'signin'
  let selectedAge = 27;
  let selectedCountry = 'IN';
  let selectedState = '';
  let customCountry = '';
  let customState = '';
  let isSubmitting = false;

  const countries = store.meta.countries || [];
  const ageGroups = store.meta.ageGroups || [];

  function draw() {
    const activeGroup = resolveAgeGroupMeta(selectedAge);
    const statesList = getStatesForCountry(selectedCountry);
    const recent = store.recentAccounts || [];

    const recentHtml = recent.length
      ? `
      <div class="recent-accounts">
        <div class="recent-label">Quick Switch Account</div>
        <div class="recent-pills">
          ${recent
            .map(
              (acc) => `
            <button type="button" class="recent-pill" data-quick-user="${escapeHtml(acc.username)}">
              <span>${escapeHtml(acc.countryFlag || '🌍')}</span>
              <span>@${escapeHtml(acc.username)}</span>
              <span style="color:var(--text-muted);font-weight:500;">${escapeHtml(acc.ageLabel)}${acc.state ? ' · ' + escapeHtml(acc.state) : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>`
      : '';

    const ageChipsHtml = ageGroups
      .map((g) => {
        const isActive = activeGroup && activeGroup.id === g.id;
        const midAge = g.id === '60+' ? 65 : Math.round((g.minAge + g.maxAge) / 2);
        return `<button type="button" class="age-chip ${isActive ? 'active' : ''}" data-age-preset="${midAge}">${escapeHtml(g.label)}</button>`;
      })
      .join('');

    const countryOptionsHtml = [
      ...countries.map(
        (c) => `<option value="${escapeHtml(c.code)}" ${selectedCountry === c.code ? 'selected' : ''}>${escapeHtml(c.flag)} ${escapeHtml(c.name)}</option>`
      ),
      `<option value="__custom__" ${selectedCountry === '__custom__' ? 'selected' : ''}>🌍 Other Country…</option>`,
    ].join('');

    const stateOptionsHtml = [
      `<option value="">All ${selectedCountry === '__custom__' ? 'regions' : escapeHtml(countries.find((c) => c.code === selectedCountry)?.name || 'Country')} (National)</option>`,
      ...statesList.map(
        (st) => `<option value="${escapeHtml(st)}" ${selectedState === st ? 'selected' : ''}>${escapeHtml(st)}</option>`
      ),
      `<option value="__custom_state__" ${selectedState === '__custom_state__' ? 'selected' : ''}>Type custom state / city…</option>`,
    ].join('');

    container.innerHTML = `
      <div class="onboarding-view">
        <div class="onboard-badge">
          ${ICONS.shield}
          <span>Zero Cinema · Zero Celeb Gossip</span>
        </div>
        <h1 class="onboard-title">News reels built for your real life.</h1>
        <p class="onboard-sub">
          Tell us your age, country, and optional state. We scan major news sites and keep only economy, jobs, food prices, weather &amp; global events that affect you.
        </p>

        ${recentHtml}

        <div class="auth-mode-tabs">
          <button type="button" class="auth-mode-tab ${mode === 'create' ? 'active' : ''}" data-mode="create">Create Account</button>
          <button type="button" class="auth-mode-tab ${mode === 'signin' ? 'active' : ''}" data-mode="signin">Sign In</button>
        </div>

        <form id="onboard-form" class="form-stack">
          <div class="field-group">
            <label class="field-label" for="onboard-username">
              <span>Username</span>
              <span class="field-hint">Your handle</span>
            </label>
            <div class="input-wrap">
              <span class="input-prefix">@</span>
              <input id="onboard-username" class="text-input with-prefix" type="text" required minlength="2" maxlength="32"
                placeholder="e.g. arjun_27" autocomplete="username" />
            </div>
          </div>

          ${
            mode === 'create'
              ? `
          <div class="field-group">
            <label class="field-label" for="onboard-age">
              <span>Your Age</span>
              <span class="field-hint">Shapes job &amp; finance mix</span>
            </label>
            <div class="age-chips" id="age-chips">${ageChipsHtml}</div>
            <input id="onboard-age" class="text-input" type="number" min="13" max="110" required value="${escapeHtml(selectedAge)}" placeholder="Exact age (e.g. 27)" />
            ${
              activeGroup
                ? `<div class="persona-preview-box" id="persona-preview">
                    <strong>${escapeHtml(activeGroup.label)} · ${escapeHtml(activeGroup.persona)}</strong><br/>
                    <span>${escapeHtml(activeGroup.tagline)}</span>
                  </div>`
                : ''
            }
          </div>

          <div class="field-group">
            <label class="field-label" for="onboard-country">
              <span>Country</span>
              <span class="field-hint">Domestic &amp; global impact</span>
            </label>
            <select id="onboard-country" class="select-input">${countryOptionsHtml}</select>
            ${
              selectedCountry === '__custom__'
                ? `<input id="onboard-custom-country" class="text-input" type="text" required placeholder="Enter country name (e.g. Brazil)" value="${escapeHtml(customCountry)}" />`
                : ''
            }
          </div>

          <div class="field-group">
            <label class="field-label" for="onboard-state">
              <span>State / Region</span>
              <span class="field-hint">Optional · local jobs &amp; policy</span>
            </label>
            ${
              statesList.length > 0 && selectedCountry !== '__custom__'
                ? `<select id="onboard-state" class="select-input">${stateOptionsHtml}</select>`
                : `<input id="onboard-custom-state" class="text-input" type="text" placeholder="Optional state or city (e.g. Karnataka)" value="${escapeHtml(customState)}" />`
            }
            ${
              selectedState === '__custom_state__' && statesList.length > 0
                ? `<input id="onboard-custom-state" class="text-input" type="text" placeholder="Enter state or city name" value="${escapeHtml(customState)}" />`
                : ''
            }
          </div>`
              : ''
          }

          <div id="onboard-error" class="form-error hidden"></div>

          <button type="submit" class="primary-cta" id="onboard-submit" ${isSubmitting ? 'disabled' : ''}>
            ${isSubmitting ? 'Aggregating Your Feed…' : mode === 'create' ? 'Build My News Feed →' : 'Sign In & Open Feed →'}
          </button>
        </form>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelectorAll('[data-quick-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const username = btn.getAttribute('data-quick-user');
        try {
          isSubmitting = true;
          draw();
          const res = await api.createOrSignIn({ username, mode: 'signin' });
          setStoredUid(res.user.id);
          store.user = res.user;
          showToast(`Welcome back @${res.user.username}`);
          onAuthenticated(res.user);
        } catch (err) {
          isSubmitting = false;
          draw();
          showErr(err.message);
        }
      });
    });

    container.querySelectorAll('.auth-mode-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        mode = tab.getAttribute('data-mode');
        draw();
      });
    });

    container.querySelectorAll('[data-age-preset]').forEach((chip) => {
      chip.addEventListener('click', () => {
        selectedAge = Number(chip.getAttribute('data-age-preset'));
        const usernameVal = container.querySelector('#onboard-username')?.value || '';
        draw();
        const uInput = container.querySelector('#onboard-username');
        if (uInput) uInput.value = usernameVal;
      });
    });

    const ageInput = container.querySelector('#onboard-age');
    if (ageInput) {
      ageInput.addEventListener('input', () => {
        const val = Number(ageInput.value);
        if (Number.isFinite(val) && val >= 13 && val <= 110) {
          selectedAge = val;
          const activeGroup = resolveAgeGroupMeta(val);
          const preview = container.querySelector('#persona-preview');
          if (preview && activeGroup) {
            preview.innerHTML = `<strong>${escapeHtml(activeGroup.label)} · ${escapeHtml(activeGroup.persona)}</strong><br/><span>${escapeHtml(activeGroup.tagline)}</span>`;
          }
          container.querySelectorAll('[data-age-preset]').forEach((chip) => {
            const p = Number(chip.getAttribute('data-age-preset'));
            const cg = resolveAgeGroupMeta(p);
            chip.classList.toggle('active', Boolean(activeGroup && cg && cg.id === activeGroup.id));
          });
        }
      });
    }

    const countrySelect = container.querySelector('#onboard-country');
    if (countrySelect) {
      countrySelect.addEventListener('change', () => {
        const usernameVal = container.querySelector('#onboard-username')?.value || '';
        selectedCountry = countrySelect.value;
        selectedState = '';
        customState = '';
        draw();
        const uInput = container.querySelector('#onboard-username');
        if (uInput) uInput.value = usernameVal;
      });
    }

    const stateSelect = container.querySelector('#onboard-state');
    if (stateSelect) {
      stateSelect.addEventListener('change', () => {
        const usernameVal = container.querySelector('#onboard-username')?.value || '';
        selectedState = stateSelect.value;
        draw();
        const uInput = container.querySelector('#onboard-username');
        if (uInput) uInput.value = usernameVal;
      });
    }

    const form = container.querySelector('#onboard-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = container.querySelector('#onboard-username')?.value?.trim() || '';
        const ageVal = Number(container.querySelector('#onboard-age')?.value || selectedAge);
        const countryVal =
          selectedCountry === '__custom__'
            ? container.querySelector('#onboard-custom-country')?.value?.trim() || ''
            : selectedCountry;
        const stateVal =
          selectedCountry === '__custom__' || selectedState === '__custom_state__' || !container.querySelector('#onboard-state')
            ? container.querySelector('#onboard-custom-state')?.value?.trim() || ''
            : selectedState;

        isSubmitting = true;
        const submitBtn = container.querySelector('#onboard-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Aggregating Your Feed…';
        }

        try {
          const res = await api.createOrSignIn({
            username,
            age: ageVal,
            country: countryVal,
            state: stateVal,
            mode: mode === 'signin' ? 'signin' : 'auto',
          });
          setStoredUid(res.user.id);
          store.user = res.user;
          showToast(`Feed tailored for @${res.user.username}`);
          onAuthenticated(res.user);
        } catch (err) {
          isSubmitting = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'create' ? 'Build My News Feed →' : 'Sign In & Open Feed →';
          }
          showErr(err.message);
        }
      });
    }
  }

  function showErr(msg) {
    const errEl = container.querySelector('#onboard-error');
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  }

  draw();
}

