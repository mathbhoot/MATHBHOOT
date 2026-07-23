(function () {
  "use strict";

  function setupGalleryRing() {
    const sliders = document.querySelectorAll(".banner .slider");

    if (!sliders.length) {
      return;
    }

    sliders.forEach((slider) => {
      const items = Array.from(slider.querySelectorAll(".item"));

      if (!items.length) {
        return;
      }

      slider.style.setProperty("--quantity", String(items.length));

      items.forEach((item, index) => {
        item.style.setProperty("--position", String(index + 1));
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupGalleryRing);
  } else {
    setupGalleryRing();
  }
})();
