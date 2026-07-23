const root = document.querySelector('.escape-page');

if (root) {
  const escape = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const state = { data: null, filter: 'All', query: '', collectionIndex: 0, partIndex: 0, itemIndex: 0 };
  const allowedTones = new Set(['green', 'red', 'blue', 'purple']);

  const getCollectionItems = (collection, partIndex = 0) => collection?.parts?.[partIndex]?.items || collection?.items || [];

  const getSelection = () => {
    const collection = state.data?.collections?.[state.collectionIndex];
    const item = getCollectionItems(collection, state.partIndex)?.[state.itemIndex];
    return collection && item ? { collection, item } : null;
  };

  const setSessionTone = (tone) => {
    if (!allowedTones.has(tone)) return;
    const deck = document.querySelector('.module-deck');
    if (deck) deck.dataset.sessionTone = tone;
  };

  const rememberSelection = () => {
    try {
      sessionStorage.setItem('mathbhootEscapeSelection', JSON.stringify({ collection: state.collectionIndex, part: state.partIndex, item: state.itemIndex }));
    } catch (error) { /* Storage is optional. */ }
  };

  const renderFilters = () => {
    const host = document.querySelector('#archiveFilters');
    if (!host || !state.data) return;
    host.innerHTML = state.data.filters.map(filter => `<button type="button" data-filter="${escape(filter)}" class="${filter === state.filter ? 'active' : ''}" aria-pressed="${filter === state.filter}">${escape(filter)}</button>`).join('');
  };

  const renderCollections = () => {
    const host = document.querySelector('#archiveGrid');
    if (!host || !state.data) return;
    const query = state.query.toLowerCase();
    const cards = state.data.collections.map((card, collectionIndex) => ({ card, collectionIndex })).filter(({ card }) => {
      const matchesFilter = state.filter === 'All' || card.type === state.filter;
      const searchableItems = card.parts?.flatMap(part => part.items) || card.items || [];
      const searchable = [card.title, card.subtitle, card.description, ...searchableItems.flatMap(item => [item.title, item.meta, item.summary, item.concept])].join(' ').toLowerCase();
      return matchesFilter && searchable.includes(query);
    });

    host.innerHTML = cards.length ? cards.map(({ card, collectionIndex }) => {
      const activePartIndex = collectionIndex === state.collectionIndex ? state.partIndex : 0;
      const visibleItems = getCollectionItems(card, activePartIndex);
      const partDrawer = card.parts ? `<details class="part-drawer" open><summary>${escape(card.parts[activePartIndex]?.label)}</summary><div class="part-drawer-menu">${card.parts.map((part, partIndex) => `<button type="button" data-collection-index="${collectionIndex}" data-part-index="${partIndex}" class="${partIndex === activePartIndex ? 'active' : ''}" aria-pressed="${partIndex === activePartIndex}">${escape(part.label)}</button>`).join('')}</div></details>` : '';
      const action = card.actionDisabled
        ? `<button type="button" class="card-action" disabled aria-disabled="true">${escape(card.action)}</button>`
        : `<a class="card-action" href="${escape(card.actionHref)}">${escape(card.action)}</a>`;
      return `<article class="archive-card tone-${escape(card.tone)}${collectionIndex === state.collectionIndex ? ' session-card' : ''}">
      <div class="card-number">${escape(card.number)}</div><p class="card-type">${escape(card.type)}</p>
      <h2>${escape(card.title)}<span>${escape(card.subtitle)}</span></h2><p class="card-description">${escape(card.description)}</p>
      <div class="card-emblem" aria-hidden="true">${escape(card.symbol)}</div>
      ${partDrawer}<ul class="archive-card-index">${visibleItems.map((item, itemIndex) => `<li><button type="button" class="archive-item-button${collectionIndex === state.collectionIndex && activePartIndex === state.partIndex && itemIndex === state.itemIndex ? ' active' : ''}" data-collection-index="${collectionIndex}" data-part-index="${activePartIndex}" data-item-index="${itemIndex}" aria-pressed="${collectionIndex === state.collectionIndex && activePartIndex === state.partIndex && itemIndex === state.itemIndex}"><span>${escape(item.title)}<small>${escape(item.meta)}</small></span><b aria-hidden="true">›</b></button></li>`).join('')}</ul>
      ${action}</article>`;
    }).join('') : '<p class="empty-state">No archive entries match your search.</p>';
  };

  const renderModule = () => {
    const selected = getSelection();
    if (!selected || !state.data) return;
    const { collection, item } = selected;
    const labels = state.data.sessionLabels;
    const title = document.querySelector('#modulePreviewTitle');
    const difficulty = document.querySelector('#moduleDifficulty');
    const time = document.querySelector('#moduleTime');
    const tabs = document.querySelector('#moduleTabs');
    const content = document.querySelector('#moduleContent');
    const menuLabel = document.querySelector('#moduleMenuLabel');
    const currentLabel = document.querySelector('#currentSessionLabel');

    setSessionTone(collection.tone);
    if (menuLabel) menuLabel.textContent = labels.menu;
    if (currentLabel) currentLabel.textContent = labels.current;
    if (title) title.textContent = item.title;
    if (difficulty) difficulty.textContent = `${labels.level} ${item.level}`;
    if (time) time.textContent = `${labels.time} ${item.time}`;
    const sessionItems = getCollectionItems(collection, state.partIndex);
    if (tabs) tabs.innerHTML = sessionItems.map((related, itemIndex) => `<button type="button" data-related-item="${itemIndex}" class="${itemIndex === state.itemIndex ? 'active' : ''}" aria-pressed="${itemIndex === state.itemIndex}">${escape(related.title)}</button>`).join('');
    if (content) content.innerHTML = [
      { heading: labels.context, body: item.summary, mark: collection.symbol },
      { heading: labels.concept, body: item.concept, mark: '＋' },
      { heading: labels.activity, body: item.activity, mark: '△' }
    ].map(section => `<section><div><h3>${escape(section.heading)}</h3><p>${escape(section.body)}</p></div><span class="lesson-mark" aria-hidden="true">${escape(section.mark)}</span></section>`).join('');
  };

  const renderSidebar = () => {
    const selected = getSelection();
    if (!selected || !state.data) return;
    const related = document.querySelector('#recentList');
    const badges = document.querySelector('#badgeRow');
    const quote = document.querySelector('#archiveQuote');
    const relatedLabel = document.querySelector('#relatedTopicsLabel');
    const sealsLabel = document.querySelector('#sessionSealsLabel');
    const labels = state.data.sessionLabels;

    if (relatedLabel) relatedLabel.textContent = labels.related;
    if (sealsLabel) sealsLabel.textContent = labels.seals;
    const sessionItems = getCollectionItems(selected.collection, state.partIndex);
    if (related) related.innerHTML = sessionItems.map((item, itemIndex) => `<li class="${itemIndex === state.itemIndex ? 'active' : ''}"><span>${escape(item.title)}</span><small>${escape(item.meta)}</small></li>`).join('');
    if (badges) badges.innerHTML = state.data.badges.map(badge => `<span>${escape(badge)}</span>`).join('');
    if (quote) quote.textContent = state.data.quote;
  };

  const selectSession = (collectionIndex, itemIndex, shouldScroll = false, partIndex = 0) => {
    const collection = state.data?.collections?.[collectionIndex];
    if (!getCollectionItems(collection, partIndex)?.[itemIndex]) return;
    state.collectionIndex = collectionIndex;
    state.partIndex = partIndex;
    state.itemIndex = itemIndex;
    rememberSelection();
    renderCollections();
    renderModule();
    renderSidebar();
    if (shouldScroll) {
      const navigationRequest = new CustomEvent('escape-guide:session-selected', {
        cancelable: true,
        detail: { title: getSelection()?.item?.title || '' }
      });
      const handled = !root.dispatchEvent(navigationRequest);
      if (!handled) document.querySelector('.module-deck')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const initialize = async () => {
    try {
      const response = await fetch('../../data/escapeguide/escape-guide-content.json');
      if (!response.ok) throw new Error('Archive content unavailable');
      state.data = await response.json();
      const fallback = state.data.defaultSession || { collection: 0, item: 0 };
      let saved = fallback;
      try { saved = JSON.parse(sessionStorage.getItem('mathbhootEscapeSelection')) || fallback; } catch (error) { saved = fallback; }
      if (getCollectionItems(state.data.collections?.[saved.collection], saved.part || 0)?.[saved.item]) {
        state.collectionIndex = saved.collection;
        state.partIndex = saved.part || 0;
        state.itemIndex = saved.item;
      }

      const progressValue = document.querySelector('#progressValue');
      const progressBar = document.querySelector('#progressBar');
      const progressCaption = document.querySelector('#progressCaption');
      const footerText = document.querySelector('#escapeFooterText');
      const controlsLabel = document.querySelector('#archiveControlsLabel');
      if (progressValue) progressValue.textContent = `${state.data.progress}%`;
      if (progressBar) progressBar.style.width = `${state.data.progress}%`;
      if (progressCaption) progressCaption.textContent = state.data.progressCaption;
      if (footerText && state.data.footerText) footerText.textContent = state.data.footerText;
      if (controlsLabel) controlsLabel.textContent = state.data.sessionLabels?.browse || '';
      renderFilters(); renderCollections(); renderModule(); renderSidebar();
    } catch (error) {
      const grid = document.querySelector('#archiveGrid');
      if (grid) grid.innerHTML = '<p class="empty-state">The archive cannot be opened right now. Please return shortly.</p>';
    }
  };

  document.querySelector('#archiveFilters')?.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter || 'All';
    renderFilters(); renderCollections();
  });
  document.querySelector('#archiveGrid')?.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const partButton = event.target.closest('button[data-part-index]');
    if (partButton) {
      selectSession(Number(partButton.dataset.collectionIndex), 0, false, Number(partButton.dataset.partIndex));
      return;
    }
    const button = event.target.closest('.archive-item-button');
    if (!button) return;
    selectSession(Number(button.dataset.collectionIndex), Number(button.dataset.itemIndex), true, Number(button.dataset.partIndex || 0));
  });
  document.querySelector('#moduleTabs')?.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button[data-related-item]');
    if (!button) return;
    selectSession(state.collectionIndex, Number(button.dataset.relatedItem), false, state.partIndex);
  });
  document.querySelector('.archive-search')?.addEventListener('submit', event => event.preventDefault());
  document.querySelector('#archiveSearch')?.addEventListener('input', event => { state.query = event.target.value.trim(); renderCollections(); });
  initialize();
}
