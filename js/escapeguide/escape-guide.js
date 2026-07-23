const root = document.querySelector(".escape-page");

if (root) {
  const escape = (value = "") =>
    String(value).replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char],
    );
  const state = {
    data: null,
    filter: "All",
    query: "",
    collectionIndex: 0,
    partIndex: 0,
    itemIndex: 0,
    activeSubnav: "history", // "history" | "graph" | "video"
  };
  const allowedTones = new Set(["green", "red", "blue", "purple"]);

  const getCollectionItems = (collection, partIndex = 0) =>
    collection?.parts?.[partIndex]?.items || collection?.items || [];

  const getSelection = () => {
    const collection = state.data?.collections?.[state.collectionIndex];
    const item = getCollectionItems(collection, state.partIndex)?.[
      state.itemIndex
    ];
    return collection && item ? { collection, item } : null;
  };

  const setSessionTone = (tone) => {
    if (!allowedTones.has(tone)) return;
    const deck = document.querySelector(".module-deck");
    if (deck) deck.dataset.sessionTone = tone;
  };

  const rememberSelection = () => {
    try {
      sessionStorage.setItem(
        "mathbhootEscapeSelection",
        JSON.stringify({
          collection: state.collectionIndex,
          part: state.partIndex,
          item: state.itemIndex,
        }),
      );
    } catch (error) {
      /* Storage is optional. */
    }
  };

  const renderFilters = () => {
    const host = document.querySelector("#archiveFilters");
    if (!host || !state.data) return;
    host.innerHTML = state.data.filters
      .map(
        (filter) =>
          `<button type="button" data-filter="${escape(filter)}" class="${filter === state.filter ? "active" : ""}" aria-pressed="${filter === state.filter}">${escape(filter)}</button>`,
      )
      .join("");
  };

  const renderCollections = () => {
    const host = document.querySelector("#archiveGrid");
    if (!host || !state.data) return;
    const query = state.query.toLowerCase();
    const cards = state.data.collections
      .map((card, collectionIndex) => ({ card, collectionIndex }))
      .filter(({ card }) => {
        const matchesFilter =
          state.filter === "All" || card.type === state.filter;
        const searchableItems =
          card.parts?.flatMap((part) => part.items) || card.items || [];
        const searchable = [
          card.title,
          card.subtitle,
          card.description,
          ...searchableItems.flatMap((item) => [
            item.title,
            item.meta,
            item.summary,
            item.concept,
          ]),
        ]
          .join(" ")
          .toLowerCase();
        return matchesFilter && searchable.includes(query);
      });

    host.innerHTML = cards.length
      ? cards
        .map(({ card, collectionIndex }) => {
          const isSelected = collectionIndex === state.collectionIndex;
          const action = card.actionDisabled
            ? `<button type="button" class="card-action" disabled aria-disabled="true">${escape(card.action)}</button>`
            : `<a class="card-action" href="${escape(card.actionHref)}">${escape(card.action)}</a>`;
          const imageSrc = card.image ? escape(card.image) : "";
          const imageElement = imageSrc
            ? `<img src="${imageSrc}" alt="${escape(card.title)} artwork" class="card-photo" loading="lazy" />`
            : `<div class="card-emblem-icon">${escape(card.symbol)}</div>`;

          return `<article class="archive-card tone-${escape(card.tone)}${isSelected ? " session-card active is-active" : ""}" data-collection-index="${collectionIndex}" role="button" tabindex="0" aria-label="Open ${escape(card.title)} in Current Session">
      <div class="card-number">${escape(card.number)}</div><p class="card-type">${escape(card.type)}</p>
      <h2>${escape(card.title)}<span>${escape(card.subtitle)}</span></h2>
      <p class="card-description">${escape(card.description)}</p>
      <div class="card-image-frame" aria-hidden="true">
        ${imageElement}
      </div>
      <div class="card-footer-action">
        ${action}
      </div>
      </article>`;
        })
        .join("")
      : '<p class="empty-state">No archive entries match your search.</p>';
  };

  const renderDynamicGraph = (item) => {
    const type = item.graphType || "node-network";
    const title = item.graphTitle || "Interactive Mathematical Visualization";
    const desc = item.graphDesc || "Dynamic graphical representation of the underlying mathematical concepts.";

    let svgContent = "";
    if (type === "node-network") {
      svgContent = `<svg viewBox="0 0 500 240" class="graph-svg" aria-label="${escape(title)}">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="var(--session-tone)" stop-opacity="0.8"/><stop offset="100%" stop-color="var(--session-tone)" stop-opacity="0"/></radialGradient>
        </defs>
        <line x1="80" y1="120" x2="200" y2="60" stroke="var(--session-tone)" stroke-width="2" stroke-dasharray="4,4"><animate attributeName="stroke-dashoffset" from="20" to="0" dur="2s" repeatCount="indefinite"/></line>
        <line x1="80" y1="120" x2="200" y2="180" stroke="var(--session-tone)" stroke-width="2"/>
        <line x1="200" y1="60" x2="340" y2="70" stroke="var(--session-tone)" stroke-width="2"/>
        <line x1="200" y1="180" x2="340" y2="170" stroke="var(--session-tone)" stroke-width="2"/>
        <line x1="340" y1="70" x2="440" y2="120" stroke="var(--session-tone)" stroke-width="2" stroke-dasharray="4,4"><animate attributeName="stroke-dashoffset" from="0" to="20" dur="1.5s" repeatCount="indefinite"/></line>
        <line x1="340" y1="170" x2="440" y2="120" stroke="var(--session-tone)" stroke-width="2"/>
        <line x1="200" y1="60" x2="200" y2="180" stroke="var(--session-tone)" stroke-width="1.5" stroke-opacity="0.5"/>
        <line x1="340" y1="70" x2="340" y2="170" stroke="var(--session-tone)" stroke-width="1.5" stroke-opacity="0.5"/>
        <circle cx="80" cy="120" r="18" fill="url(#nodeGlow)"/>
        <circle cx="80" cy="120" r="8" fill="#fff"/>
        <text x="80" y="148" fill="#eee" font-size="11" text-anchor="middle">Entry (N0)</text>
        <circle cx="200" cy="60" r="14" fill="url(#nodeGlow)"/>
        <circle cx="200" cy="60" r="6" fill="var(--session-tone)"/>
        <text x="200" y="44" fill="#eee" font-size="11" text-anchor="middle">Node A</text>
        <circle cx="200" cy="180" r="14" fill="url(#nodeGlow)"/>
        <circle cx="200" cy="180" r="6" fill="var(--session-tone)"/>
        <text x="200" y="202" fill="#eee" font-size="11" text-anchor="middle">Node B</text>
        <circle cx="340" cy="70" r="14" fill="url(#nodeGlow)"/>
        <circle cx="340" cy="70" r="6" fill="var(--session-tone)"/>
        <text x="340" y="54" fill="#eee" font-size="11" text-anchor="middle">Node C</text>
        <circle cx="340" cy="170" r="14" fill="url(#nodeGlow)"/>
        <circle cx="340" cy="170" r="6" fill="var(--session-tone)"/>
        <text x="340" y="192" fill="#eee" font-size="11" text-anchor="middle">Node D</text>
        <circle cx="440" cy="120" r="20" fill="url(#nodeGlow)"/>
        <circle cx="440" cy="120" r="9" fill="#fff"/>
        <text x="440" y="150" fill="#eee" font-size="11" text-anchor="middle">Target (N5)</text>
      </svg>`;
    } else if (type === "vector-plane" || type === "cartesian-grid" || type === "complex-plane") {
      svgContent = `<svg viewBox="0 0 500 240" class="graph-svg" aria-label="${escape(title)}">
        <line x1="50" y1="120" x2="450" y2="120" stroke="#444" stroke-width="1.5"/>
        <line x1="250" y1="20" x2="250" y2="220" stroke="#444" stroke-width="1.5"/>
        <path d="M100 20v200M150 20v200M200 20v200M300 20v200M350 20v200M400 20v200 M50 70h400M50 170h400" stroke="#222" stroke-width="1" stroke-dasharray="2,2"/>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--session-tone)" />
          </marker>
        </defs>
        <line x1="250" y1="120" x2="380" y2="50" stroke="var(--session-tone)" stroke-width="3" marker-end="url(#arrow)">
          <animate attributeName="x2" values="250;380" dur="1.2s" fill="freeze"/>
          <animate attributeName="y2" values="120;50" dur="1.2s" fill="freeze"/>
        </line>
        <circle cx="380" cy="50" r="5" fill="#fff"/>
        <text x="390" y="45" fill="var(--session-tone)" font-weight="bold" font-size="13">Vector V (x=130, y=70)</text>
        <text x="255" y="135" fill="#888" font-size="11">(0,0)</text>
      </svg>`;
    } else if (type === "inverse-square" || type === "exponential-curve" || type === "sequence-curve") {
      svgContent = `<svg viewBox="0 0 500 240" class="graph-svg" aria-label="${escape(title)}">
        <path d="M 60 40 L 60 200 L 460 200" stroke="#555" stroke-width="2" fill="none"/>
        <path d="M 70 50 Q 140 180 440 195" stroke="var(--session-tone)" stroke-width="3.5" fill="none">
          <animate attributeName="stroke-dashoffset" from="500" to="0" dur="2s" fill="freeze"/>
        </path>
        <circle cx="70" cy="50" r="5" fill="#fff"/>
        <circle cx="150" cy="150" r="5" fill="var(--session-tone)"/>
        <circle cx="260" cy="185" r="5" fill="var(--session-tone)"/>
        <circle cx="440" cy="195" r="5" fill="var(--session-tone)"/>
        <text x="75" y="45" fill="#eee" font-size="11">Peak (t=1)</text>
        <text x="155" y="145" fill="#aaa" font-size="11">Stage 2</text>
        <text x="265" y="180" fill="#aaa" font-size="11">Stage 3</text>
        <text x="400" y="215" fill="#777" font-size="11">Progress →</text>
      </svg>`;
    } else {
      svgContent = `<svg viewBox="0 0 500 240" class="graph-svg" aria-label="${escape(title)}">
        <circle cx="250" cy="120" r="80" stroke="var(--session-tone)" stroke-width="2" fill="none" stroke-dasharray="6,6">
          <animateTransform attributeName="transform" type="rotate" from="0 250 120" to="360 250 120" dur="10s" repeatCount="indefinite"/>
        </circle>
        <circle cx="250" cy="120" r="45" stroke="#fff" stroke-width="1.5" fill="none"/>
        <polygon points="250,40 320,160 180,160" fill="none" stroke="var(--session-tone)" stroke-width="2">
          <animateTransform attributeName="transform" type="rotate" from="360 250 120" to="0 250 120" dur="8s" repeatCount="indefinite"/>
        </polygon>
        <circle cx="250" cy="120" r="8" fill="var(--session-tone)"/>
        <text x="250" y="220" fill="#ddd" font-size="12" text-anchor="middle">${escape(title)}</text>
      </svg>`;
    }

    return `<div class="graph-interactive-panel">
      <div class="graph-header">
        <div><h4>${escape(title)}</h4><p class="graph-desc">${escape(desc)}</p></div>
        <span class="graph-live-badge">LIVE GRAPHICAL ANIMATION</span>
      </div>
      <div class="graph-stage">${svgContent}</div>
      <div class="graph-controls">
        <button type="button" class="graph-btn" id="graphToggleBtn">▶ Pause Animation</button>
        <button type="button" class="graph-btn" id="graphResetBtn">↺ Reset Coordinates</button>
        <div class="graph-readout"><span>Status: <strong>CALCULATING MATRIX</strong></span></div>
      </div>
    </div>`;
  };

  const renderVideoAndFuture = (item) => {
    const videoTitle = item.videoTitle || "Mathematical Showcase Video";
    const videoDuration = item.videoDuration || "4:30";
    const videoSummary = item.videoSummary || "Visual investigation and dynamic demonstration of key concepts.";
    const futureApps = item.futureApps || [
      { title: "Artificial Intelligence", desc: "Machine learning neural networks & optimization." },
      { title: "Quantum Computing", desc: "Subatomic algorithms & qubit state vector dynamics." },
      { title: "Aerospace Systems", desc: "Flight trajectory mechanics & orbital calculations." }
    ];

    const appsHtml = futureApps.map(app => `
      <div class="future-card">
        <div class="future-card-icon">🚀</div>
        <h5>${escape(app.title)}</h5>
        <p>${escape(app.desc)}</p>
      </div>
    `).join("");

    return `<div class="video-future-panel">
      <div class="video-player-frame">
        <div class="video-poster">
          <div class="video-overlay">
            <span class="play-pulse-btn" role="button" aria-label="Play video showcase">▶</span>
            <span class="video-badge">CINEMATIC SHOWCASE · ${escape(videoDuration)}</span>
          </div>
        </div>
        <div class="video-meta">
          <h4>${escape(videoTitle)}</h4>
          <p>${escape(videoSummary)}</p>
        </div>
      </div>

      <div class="future-section">
        <div class="future-section-header">
          <h4>⚡ Mathematics Future &amp; Real-World Applications</h4>
          <p>Discover how this chapter's mathematical foundation powers next-generation technology and engineering:</p>
        </div>
        <div class="future-grid">${appsHtml}</div>
      </div>
    </div>`;
  };

  const renderModule = () => {
    const selected = getSelection();
    if (!selected || !state.data) return;
    const { collection, item } = selected;
    const labels = state.data.sessionLabels;
    const title = document.querySelector("#modulePreviewTitle");
    const difficulty = document.querySelector("#moduleDifficulty");
    const tabs = document.querySelector("#moduleTabs");
    const content = document.querySelector("#moduleContent");
    const menuLabel = document.querySelector("#moduleMenuLabel");
    const currentLabel = document.querySelector("#currentSessionLabel");
    const subnavBtns = document.querySelectorAll("#sessionSubnav button");

    setSessionTone(collection.tone);
    if (menuLabel) menuLabel.textContent = `${collection.title} · Table of Contents`;
    if (currentLabel) currentLabel.textContent = labels.current;
    if (title) title.textContent = item.title;
    if (difficulty) difficulty.textContent = `${labels.level} ${item.level}`;

    subnavBtns.forEach(btn => {
      const isSubnavActive = btn.dataset.subnav === state.activeSubnav;
      btn.classList.toggle("active", isSubnavActive);
      btn.setAttribute("aria-selected", isSubnavActive);
    });

    const sessionItems = getCollectionItems(collection, state.partIndex);
    const partSwitcher = collection.parts
      ? `<div class="toc-part-switcher">${collection.parts.map((part, partIndex) => `<button type="button" data-collection-index="${state.collectionIndex}" data-part-index="${partIndex}" class="part-switch-btn${partIndex === state.partIndex ? " active is-active" : ""}">${escape(part.label)}</button>`).join("")}</div>`
      : "";

    if (tabs)
      tabs.innerHTML = partSwitcher + sessionItems
        .map(
          (related, itemIndex) => {
            const isActive = itemIndex === state.itemIndex;
            return `<button type="button" data-related-item="${itemIndex}" class="toc-chapter-btn${isActive ? " active is-active" : ""}" aria-selected="${isActive}" aria-pressed="${isActive}"><span><strong>${escape(related.title)}</strong><small>${escape(related.meta || '')}</small></span><b aria-hidden="true">&rsaquo;</b></button>`;
          },
        )
        .join("");

    if (content) {
      if (state.activeSubnav === "graph") {
        content.innerHTML = renderDynamicGraph(item);
      } else if (state.activeSubnav === "video") {
        content.innerHTML = renderVideoAndFuture(item);
      } else {
        // History & Core Written Content
        content.innerHTML = [
          {
            heading: labels.context,
            body: item.summary,
            mark: collection.symbol,
          },
          { heading: labels.concept, body: item.concept, mark: "＋" },
          { heading: "Historical Origins & Discovery", body: item.history || "Mathematical foundations established by historical scholars and refined through global discovery.", mark: "📜" },
          { heading: labels.activity, body: item.activity, mark: "△" },
        ]
          .map(
            (section) =>
              `<section><div><h3>${escape(section.heading)}</h3><p>${escape(section.body)}</p></div><span class="lesson-mark" aria-hidden="true">${escape(section.mark)}</span></section>`,
          )
          .join("");
      }
    }
  };

  const selectSession = (
    collectionIndex,
    itemIndex,
    shouldScroll = false,
    partIndex = 0,
  ) => {
    const collection = state.data?.collections?.[collectionIndex];
    if (!getCollectionItems(collection, partIndex)?.[itemIndex]) return;
    state.collectionIndex = collectionIndex;
    state.partIndex = partIndex;
    state.itemIndex = itemIndex;
    rememberSelection();
    renderCollections();
    renderModule();
    if (shouldScroll) {
      const navigationRequest = new CustomEvent(
        "escape-guide:session-selected",
        {
          cancelable: true,
          detail: { title: getSelection()?.item?.title || "" },
        },
      );
      root.dispatchEvent(navigationRequest);
      const deck = document.querySelector(".module-deck");
      if (deck) {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        deck.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
        const heading = document.querySelector("#modulePreviewTitle");
        if (heading) {
          try {
            heading.focus({ preventScroll: true });
          } catch (e) {
            heading.focus();
          }
        }
      }
    }
  };

  const initialize = async () => {
    try {
      const response = await fetch(
        "../../data/escapeguide/escape-guide-content.json",
      );
      if (!response.ok) throw new Error("Archive content unavailable");
      state.data = await response.json();
      const fallback = state.data.defaultSession || { collection: 0, item: 0 };
      let saved = fallback;
      try {
        saved =
          JSON.parse(sessionStorage.getItem("mathbhootEscapeSelection")) ||
          fallback;
      } catch (error) {
        saved = fallback;
      }
      if (
        getCollectionItems(
          state.data.collections?.[saved.collection],
          saved.part || 0,
        )?.[saved.item]
      ) {
        state.collectionIndex = saved.collection;
        state.partIndex = saved.part || 0;
        state.itemIndex = saved.item;
      }

      const progressValue = document.querySelector("#progressValue");
      const progressBar = document.querySelector("#progressBar");
      const progressCaption = document.querySelector("#progressCaption");
      const footerText = document.querySelector("#escapeFooterText");
      const controlsLabel = document.querySelector("#archiveControlsLabel");
      if (progressValue) progressValue.textContent = `${state.data.progress}%`;
      if (progressBar) progressBar.style.width = `${state.data.progress}%`;
      if (progressCaption)
        progressCaption.textContent = state.data.progressCaption;
      if (footerText && state.data.footerText)
        footerText.textContent = state.data.footerText;
      if (controlsLabel)
        controlsLabel.textContent = state.data.sessionLabels?.browse || "";
      renderFilters();
      renderCollections();
      renderModule();
    } catch (error) {
      const grid = document.querySelector("#archiveGrid");
      if (grid)
        grid.innerHTML =
          '<p class="empty-state">The archive cannot be opened right now. Please return shortly.</p>';
    }
  };

  document
    .querySelector("#archiveFilters")
    ?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      state.filter = button.dataset.filter || "All";
      renderFilters();
      renderCollections();
    });

  document.querySelector("#archiveGrid")?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const cardAction = event.target.closest(".card-action");
    if (cardAction) return;

    const card = event.target.closest(".archive-card");
    if (card) {
      const clickedCollection = Number(card.dataset.collectionIndex);
      selectSession(clickedCollection, 0, true, 0);
    }
  });

  document.querySelector("#archiveGrid")?.addEventListener("keydown", (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.key === "Enter" || event.key === " ") {
      const cardAction = event.target.closest(".card-action");
      if (cardAction) return;
      const card = event.target.closest(".archive-card");
      if (card) {
        event.preventDefault();
        const clickedCollection = Number(card.dataset.collectionIndex);
        selectSession(clickedCollection, 0, true, 0);
      }
    }
  });

  document.querySelector("#moduleTabs")?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const partBtn = event.target.closest("button[data-part-index]");
    if (partBtn) {
      selectSession(
        Number(partBtn.dataset.collectionIndex),
        0,
        false,
        Number(partBtn.dataset.partIndex),
      );
      return;
    }
    const button = event.target.closest("button[data-related-item]");
    if (!button) return;
    selectSession(
      state.collectionIndex,
      Number(button.dataset.relatedItem),
      false,
      state.partIndex,
    );
  });

  document.querySelector("#sessionSubnav")?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const btn = event.target.closest("button[data-subnav]");
    if (!btn) return;
    state.activeSubnav = btn.dataset.subnav || "history";
    renderModule();
  });

  document.querySelector("#moduleContent")?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const toggleBtn = event.target.closest("#graphToggleBtn");
    if (toggleBtn) {
      const isPaused = toggleBtn.textContent.includes("Resume");
      toggleBtn.textContent = isPaused ? "▶ Pause Animation" : "⏸ Resume Animation";
      const svg = document.querySelector(".graph-svg");
      if (svg) {
        if (isPaused) {
          svg.unpauseAnimations?.();
        } else {
          svg.pauseAnimations?.();
        }
      }
    }
  });

  document
    .querySelector(".archive-search")
    ?.addEventListener("submit", (event) => event.preventDefault());
  document
    .querySelector("#archiveSearch")
    ?.addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      renderCollections();
    });

  initialize();
}
