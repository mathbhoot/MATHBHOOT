(() => {
  const app = document.querySelector("#antagonistApp");
  if (!app) return;

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  };

  const renderProfile = (data) => {
    if (
      !data ||
      !data.profile ||
      !data.status ||
      !data.anomaly ||
      !Array.isArray(data.metrics) ||
      !data.intruderSearch
    )
      return false;

    const shell = createElement("article", "antagonist-shell");
    const hero = createElement("section", "profile-hero");
    hero.setAttribute("aria-labelledby", "antagonistTitle");

    const copy = createElement("div", "profile-copy");
    copy.append(createElement("p", "eyebrow", data.profile.classification));

    const title = createElement("h1", "profile-title");
    title.id = "antagonistTitle";
    const titleLines = Array.isArray(data.profile.titleLines)
      ? data.profile.titleLines
      : [data.profile.titleLead];
    titleLines.forEach((line) =>
      title.append(createElement("span", "profile-title-line", line)),
    );
    title.append(
      createElement("span", "profile-title-accent", data.profile.titleAccent),
    );
    copy.append(title);
    const quote = createElement("blockquote", "profile-quote");
    const quoteLines = Array.isArray(data.profile.quote)
      ? data.profile.quote
      : [data.profile.quote];
    quoteLines.forEach((line, index) => {
      quote.append(
        createElement(
          "span",
          index >= Number(data.profile.quoteAlertStart) ? "quote-alert" : "",
          line,
        ),
      );
    });
    copy.append(quote);

    const profileLink = createElement(
      "a",
      "profile-button",
      data.profile.actionLabel,
    );
    profileLink.href = data.profile.actionHref || "#villaStatus";
    copy.append(profileLink);

    const visual = createElement("div", "profile-visual");
    const image = createElement("img");
    image.src = data.profile.image;
    image.alt = data.profile.imageAlt;
    image.width = 1122;
    image.height = 1402;
    image.decoding = "async";
    visual.append(image);
    hero.append(copy, visual);

    const status = createElement("section", "status-panel");
    status.id = "villaStatus";
    status.setAttribute("aria-labelledby", "statusHeading");

    const alert = createElement("div", "status-alert");
    const statusHeading = createElement(
      "p",
      "status-kicker",
      data.status.kicker,
    );
    statusHeading.id = "statusHeading";
    const alertRow = createElement("div", "alert-row");
    const alertIcon = createElement("span", "alert-icon", "!");
    alertIcon.setAttribute("aria-hidden", "true");
    const alertText = createElement("div");
    alertText.append(createElement("h2", "alert-title", data.status.title));
    alertText.append(createElement("p", "alert-copy", data.status.message));
    alertRow.append(alertIcon, alertText);
    alert.append(statusHeading, alertRow);

    const metrics = createElement("div", "status-metrics");
    const metricList = createElement("ul", "metric-list");
    data.metrics.forEach((item) => {
      const metric = createElement("li", "metric");
      const numericValue = Number(item.value);
      const isError = !Number.isFinite(numericValue);
      metric.dataset.error = String(isError);
      metric.append(createElement("span", "metric-name", item.label));
      const track = createElement("span", "metric-track");
      const fill = createElement("span", "metric-fill");
      const progressValue = isError
        ? 100
        : Math.min(100, Math.max(0, numericValue));
      fill.classList.add(`metric-fill-${progressValue}`);
      track.append(fill);
      metric.append(
        track,
        createElement(
          "span",
          "metric-value",
          isError ? item.value : `${numericValue}%`,
        ),
      );
      metricList.append(metric);
    });
    metrics.append(metricList);

    const anomaly = createElement("aside", "anomaly-card");
    anomaly.append(createElement("p", "anomaly-label", data.anomaly.label));
    const signal = createElement("div", "anomaly-signal");
    signal.setAttribute("aria-hidden", "true");
    anomaly.append(
      signal,
      createElement("p", "anomaly-copy", data.anomaly.message),
    );

    status.append(alert, metrics, anomaly);

    const search = createElement("section", "intruder-search");
    search.id = "intruderSearch";
    search.setAttribute("aria-labelledby", "intruderHeading");
    const searchCopy = createElement("div", "intruder-copy");
    searchCopy.append(
      createElement("p", "eyebrow", data.intruderSearch.kicker),
    );
    const searchTitle = createElement("h2", "intruder-title");
    searchTitle.id = "intruderHeading";
    searchTitle.append(
      document.createTextNode(data.intruderSearch.titleLead + " "),
    );
    searchTitle.append(
      createElement("span", "", data.intruderSearch.titleAccent),
    );
    searchCopy.append(searchTitle);
    const narrative = createElement("div", "intruder-narrative");
    data.intruderSearch.paragraphs.forEach((paragraph, index) => {
      narrative.append(
        createElement(
          "p",
          index === data.intruderSearch.paragraphs.length - 1
            ? "intruder-vow"
            : "",
          paragraph,
        ),
      );
    });
    searchCopy.append(narrative);
    const searchLink = createElement(
      "a",
      "profile-button",
      data.intruderSearch.actionLabel,
    );
    searchLink.href = data.intruderSearch.actionHref || "#villaStatus";
    searchCopy.append(searchLink);

    const searchVisual = createElement("div", "intruder-visual");
    const searchImage = createElement("img");
    searchImage.src = data.intruderSearch.image;
    searchImage.alt = data.intruderSearch.imageAlt;
    searchImage.width = 1536;
    searchImage.height = 1024;
    searchImage.loading = "lazy";
    searchImage.decoding = "async";
    searchVisual.append(searchImage);

    search.append(searchCopy, searchVisual);

    shell.append(hero, status, search);
    app.replaceChildren(shell);
    return true;
  };

  fetch("../../data/antagonists/lead-antagonist.json")
    .then((response) => {
      if (!response.ok)
        throw new Error(`Archive request failed: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!renderProfile(data)) throw new Error("Archive data is incomplete.");
    })
    .catch(() => {
      app.dataset.enhancement = "offline";
    });
})();
