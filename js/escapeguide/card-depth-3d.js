/**
 * MATHBHOOT — 3D Interactive Card Depth & Glare Controller
 * Handles pointer-reactive 3D tilt, spring reset, and dynamic lighting glare.
 */
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const initCard3D = () => {
    const grid = document.querySelector("#archiveGrid");
    if (!grid) return;

    let activeCard = null;
    let rafId = null;

    const handlePointerMove = (e) => {
      // Touch screens do not require continuous tilt
      if (e.pointerType === "touch") return;

      const card = e.target.closest(".archive-card");
      if (!card) {
        if (activeCard) resetCard(activeCard);
        activeCard = null;
        return;
      }

      if (activeCard && activeCard !== card) {
        resetCard(activeCard);
      }
      activeCard = card;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Subtle, cinematic 6.5 degree max tilt
      const rotateX = ((centerY - y) / centerY) * 6.5;
      const rotateY = ((x - centerX) / centerX) * 6.5;

      const mouseX = `${((x / rect.width) * 100).toFixed(1)}%`;
      const mouseY = `${((y / rect.height) * 100).toFixed(1)}%`;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.setProperty("--mouse-x", mouseX);
        card.style.setProperty("--mouse-y", mouseY);
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;
      });
    };

    const resetCard = (card) => {
      card.style.transform = "";
      card.style.removeProperty("--mouse-x");
      card.style.removeProperty("--mouse-y");
    };

    grid.addEventListener("pointermove", handlePointerMove, { passive: true });
    grid.addEventListener("pointerleave", () => {
      if (activeCard) resetCard(activeCard);
      activeCard = null;
    }, { passive: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCard3D);
  } else {
    initCard3D();
  }
})();
