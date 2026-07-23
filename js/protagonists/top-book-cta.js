(() => {
  "use strict";

  const host = document.getElementById("topBookCta");
  const source = host?.dataset.source;
  if (!host || !source) return;

  const render = (content) => {
    if (!content?.eyebrow || !content?.label || !content?.href) return false;

    const destination = new URL(content.href, document.baseURI);
    if (destination.origin !== window.location.origin) return false;

    const eyebrow = document.createElement("span");
    eyebrow.className = "top-book-cta__eyebrow";
    eyebrow.textContent = content.eyebrow;

    const link = document.createElement("a");
    link.className = "top-book-cta__link";
    link.href = destination.href;
    link.textContent = content.label;
    if (content.accessibleLabel)
      link.setAttribute("aria-label", content.accessibleLabel);

    host.replaceChildren(eyebrow, link);
    host.dataset.ready = "true";
    return true;
  };

  fetch(source, { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok)
        throw new Error(`Book CTA request failed: ${response.status}`);
      return response.json();
    })
    .then((content) => {
      if (!render(content)) throw new Error("Book CTA content is incomplete.");
    })
    .catch(() => {
      host.hidden = true;
    });
})();
