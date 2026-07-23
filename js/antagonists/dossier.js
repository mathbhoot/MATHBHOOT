(() => {
  "use strict";

  const app = document.getElementById("dossierApp");
  const viewer = document.getElementById("dossierViewer");
  const viewerImage = document.getElementById("viewerImage");
  const viewerTitle = document.getElementById("viewerTitle");
  const viewerCode = document.getElementById("viewerCode");
  const closeButton = viewer?.querySelector(".viewer-close");
  const lockNotice = document.getElementById("lockNotice");

  if (
    !app ||
    !viewer ||
    !viewerImage ||
    !viewerTitle ||
    !viewerCode ||
    !closeButton ||
    !lockNotice
  )
    return;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const showLockNotice = () => {
    lockNotice.hidden = false;
    window.clearTimeout(showLockNotice.timeoutId);
    showLockNotice.timeoutId = window.setTimeout(() => {
      lockNotice.hidden = true;
    }, 2600);
  };

  const openDossier = (record) => {
    if (record.locked) {
      showLockNotice();
      return;
    }
    const detailImage = record.detailImage || record.image;
    if (!detailImage) return;
    viewerCode.textContent = record.id;
    viewerTitle.textContent = record.title;
    viewerImage.src = detailImage;
    viewerImage.alt = record.detailImageAlt || record.imageAlt || record.title;
    if (typeof viewer.showModal === "function") viewer.showModal();
    else viewer.setAttribute("open", "");
  };

  const render = (data) => {
    if (
      !data?.archive ||
      !Array.isArray(data.categories) ||
      !Array.isArray(data.dossiers) ||
      !Array.isArray(data.navigation)
    )
      return false;

    const shell = make("section", "archive-shell");
    shell.setAttribute("aria-labelledby", "archiveTitle");
    const hero = make("header", "archive-hero");
    if (data.archive.heroImage) {
      hero.style.setProperty(
        "--archive-hero-image",
        `url("${data.archive.heroImage}")`,
      );
      hero.setAttribute("data-has-hero-image", "true");
    }
    const heroCopy = make("div", "archive-hero-copy");
    heroCopy.append(make("p", "archive-kicker", data.archive.kicker));
    const title = make("h1", "archive-title", data.archive.title);
    title.id = "archiveTitle";
    heroCopy.append(
      title,
      make("p", "archive-description", data.archive.description),
    );

    const recovery = make("aside", "recovery-panel");
    recovery.setAttribute(
      "aria-label",
      `Archive recovery ${data.archive.recovery} percent`,
    );
    recovery.append(make("span", "recovery-label", "Archive Recovery"));
    const gauge = make("div", "recovery-gauge");
    gauge.style.setProperty("--recovery", `${data.archive.recovery * 3.6}deg`);
    gauge.append(
      make("strong", "", `${data.archive.recovery}%`),
      make("small", "", "Recovered"),
    );
    recovery.append(
      gauge,
      make("span", "recovery-update", "Signal updated · live archive"),
    );
    hero.append(heroCopy, recovery);

    const filters = make("div", "archive-filters");
    filters.setAttribute("role", "toolbar");
    filters.setAttribute("aria-label", "Filter restricted dossiers");
    data.categories.forEach((category, index) => {
      const button = make("button", "archive-filter", category.label);
      button.type = "button";
      button.dataset.filter = category.id;
      button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      filters.append(button);
    });

    const grid = make("div", "dossier-grid");
    data.dossiers.forEach((record) => {
      const card = make(
        "article",
        `dossier-card${record.locked ? " is-locked" : ""}`,
      );
      card.dataset.category = record.category;
      const cardTop = make("div", "dossier-card-top");
      cardTop.append(
        make("span", "dossier-code", record.id),
        make("span", "dossier-status", record.status),
      );
      const media = make("div", "dossier-media");
      if (record.locked) {
        media.append(make("span", "unknown-mark", "?"));
      } else {
        const image = make("img");
        image.src = record.image;
        image.alt = record.imageAlt || record.title;
        image.loading = "lazy";
        image.decoding = "async";
        media.append(image);
      }
      const heading = make("h2", "dossier-title", record.title);
      const summary = make("p", "dossier-summary", record.summary);
      const action = make(
        "button",
        "dossier-action",
        record.locked ? "Locked · Coming Soon" : "Open Dossier →",
      );
      action.type = "button";
      action.dataset.dossierId = record.id;
      action.setAttribute(
        "aria-label",
        record.locked
          ? `${record.title} is locked and coming soon`
          : `Open ${record.title}`,
      );
      action.addEventListener("click", () => openDossier(record));
      card.append(cardTop, heading, media, summary, action);
      grid.append(card);
    });

    filters.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest(".archive-filter");
      if (!button || !filters.contains(button)) return;
      filters
        .querySelectorAll(".archive-filter")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      const selected = button.dataset.filter;
      grid.querySelectorAll(".dossier-card").forEach((card) => {
        card.hidden = selected !== "all" && card.dataset.category !== selected;
      });
    });

    const warning = make("aside", "archive-warning");
    warning.append(
      make("strong", "", "Warning"),
      make("p", "", data.archive.warning),
    );
    const navigation = make("nav", "archive-navigation");
    navigation.setAttribute("aria-label", "Restricted archive navigation");
    data.navigation.forEach((item, index) => {
      if (!item?.label || !item?.href) return;
      const link = make(
        "a",
        `archive-return${index > 0 ? " archive-return-primary" : ""}`,
        `${index === 0 ? "← " : ""}${item.label}${index > 0 ? " →" : ""}`,
      );
      link.href = item.href;
      navigation.append(link);
    });
    shell.append(hero, filters, grid, warning, navigation);
    app.replaceChildren(shell);
    return true;
  };

  closeButton.addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });

  fetch("../../data/antagonists/restricted-dossiers.json")
    .then((response) => {
      if (!response.ok)
        throw new Error(`Archive request failed: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!render(data))
        throw new Error("Restricted archive data is incomplete.");
    })
    .catch(() => {
      app.innerHTML =
        '<p class="dossier-error">Restricted archive is temporarily offline.</p>';
    });
})();
