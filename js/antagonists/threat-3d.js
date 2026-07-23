/**
 * MATHBHOOT — Antagonist Threat 3D Depth & Glare Controller
 * Manages pointer-reactive perspective shift on antagonist threat cards.
 */
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const initThreat3D = () => {
    const cards = document.querySelectorAll(".antagonist-card, .dossier-card");
    if (!cards.length) return;

    cards.forEach((card) => {
      let rafId = null;

      const handlePointerMove = (e) => {
        if (e.pointerType === "touch") return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((centerY - y) / centerY) * 5.5;
        const rotateY = ((x - centerX) / centerX) * 5.5;

        const mouseX = `${((x / rect.width) * 100).toFixed(1)}%`;
        const mouseY = `${((y / rect.height) * 100).toFixed(1)}%`;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.setProperty("--threat-mouse-x", mouseX);
          card.style.setProperty("--threat-mouse-y", mouseY);
          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px)`;
        });
      };

      const handlePointerLeave = () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = "";
        card.style.removeProperty("--threat-mouse-x");
        card.style.removeProperty("--threat-mouse-y");
      };

      card.addEventListener("pointermove", handlePointerMove, { passive: true });
      card.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThreat3D);
  } else {
    initThreat3D();
  }
})();
