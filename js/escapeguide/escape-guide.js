const root = document.querySelector('.escape-page');

if (root) {
  const escape = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const state = { data: null, filter: 'All', query: '' };

  const renderFilters = () => {
    const host = document.querySelector('#archiveFilters');
    if (!host || !state.data) return;
    host.innerHTML = state.data.filters.map(filter => `<button type="button" data-filter="${escape(filter)}" class="${filter === state.filter ? 'active' : ''}">${escape(filter)}</button>`).join('');
  };

  const renderCollections = () => {
    const host = document.querySelector('#archiveGrid');
    if (!host || !state.data) return;
    const query = state.query.toLowerCase();
    const cards = state.data.collections.filter(card => {
      const matchesFilter = state.filter === 'All' || card.type === state.filter;
      const searchable = [card.title, card.subtitle, card.description, ...card.items.flatMap(item => [item.title, item.meta])].join(' ').toLowerCase();
      return matchesFilter && searchable.includes(query);
    });
    host.innerHTML = cards.length ? cards.map(card => `<article class="archive-card tone-${escape(card.tone)}">
      <div class="card-number">${escape(card.number)}</div><p class="card-type">${escape(card.type)}</p>
      <h2>${escape(card.title)}<span>${escape(card.subtitle)}</span></h2><p class="card-description">${escape(card.description)}</p>
      <div class="card-emblem" aria-hidden="true">${escape(card.symbol)}</div>
      <ul>${card.items.map(item => `<li><span>${escape(item.title)}<small>${escape(item.meta)}</small></span><b aria-hidden="true">›</b></li>`).join('')}</ul>
      <button type="button" class="card-action">${escape(card.action)}</button></article>`).join('') : '<p class="empty-state">No archive entries match your search.</p>';
  };

  const renderModule = () => {
    const module = state.data?.module;
    if (!module) return;
    const title = document.querySelector('#modulePreviewTitle');
    const difficulty = document.querySelector('#moduleDifficulty');
    const time = document.querySelector('#moduleTime');
    const tabs = document.querySelector('#moduleTabs');
    const content = document.querySelector('#moduleContent');
    if (title) title.textContent = module.title;
    if (difficulty) difficulty.textContent = `Difficulty ${module.difficulty}`;
    if (time) time.textContent = `◷ ${module.time}`;
    if (tabs) tabs.innerHTML = module.tabs.map((tab, index) => `<button type="button" role="tab" aria-selected="${index === 0}" class="${index === 0 ? 'active' : ''}">${escape(tab)}</button>`).join('');
    if (content) content.innerHTML = module.sections.map((section, index) => `<section><div><h3>${escape(section.heading)}</h3><p>${escape(section.body)}</p>${index === module.sections.length - 1 ? '<button type="button" class="practice-button">Practice now</button>' : ''}</div><span class="lesson-mark" aria-hidden="true">${['⌖','╋','△'][index] || '◇'}</span></section>`).join('');
  };

  const renderSidebar = () => {
    const recent = document.querySelector('#recentList');
    const badges = document.querySelector('#badgeRow');
    const quote = document.querySelector('#archiveQuote');
    if (recent) recent.innerHTML = state.data.recent.map(item => `<li><span>${escape(item.title)}</span><small>${escape(item.time)}</small></li>`).join('');
    if (badges) badges.innerHTML = state.data.badges.map(badge => `<span>${escape(badge)}</span>`).join('');
    if (quote) quote.textContent = state.data.quote;
  };

  const initialize = async () => {
    try {
      const response = await fetch('../../data/escapeguide/escape-guide-content.json');
      if (!response.ok) throw new Error('Archive content unavailable');
      state.data = await response.json();
      const progressValue = document.querySelector('#progressValue');
      const progressBar = document.querySelector('#progressBar');
      const progressCaption = document.querySelector('#progressCaption');
      if (progressValue) progressValue.textContent = `${state.data.progress}%`;
      if (progressBar) progressBar.style.width = `${state.data.progress}%`;
      if (progressCaption) progressCaption.textContent = state.data.progressCaption;
      renderFilters(); renderCollections(); renderModule(); renderSidebar();
    } catch (error) {
      const grid = document.querySelector('#archiveGrid');
      if (grid) grid.innerHTML = '<p class="empty-state">The archive cannot be opened right now. Please return shortly.</p>';
    }
  };

  document.querySelector('#archiveFilters')?.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter || 'All'; renderFilters(); renderCollections();
  });
  document.querySelector('.archive-search')?.addEventListener('submit', event => event.preventDefault());
  document.querySelector('#archiveSearch')?.addEventListener('input', event => { state.query = event.target.value.trim(); renderCollections(); });
  document.querySelector('#moduleTabs')?.addEventListener('click', event => {
    const button = event.target.closest('button[role="tab"]');
    if (!button) return;
    document.querySelectorAll('#moduleTabs button').forEach(tab => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-selected', String(tab === button)); });
  });
  initialize();
}
