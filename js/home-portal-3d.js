/**
 * MATHBHOOT — Homepage Mathematical Portal Particle Field
 * Renders floating 3D mathematical fragments emerging from the central portal background.
 */
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.querySelector("#webgl");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const isMobile = window.innerWidth <= 768;
  const particleCount = isMobile ? 16 : 32;
  const mathSymbols = ["π", "∑", "√x", "∞", "θ", "∫", "Δ", "f(x)", "∀", "∈"];
  const colors = ["#a855f7", "#3b82f6", "#22c55e", "#ef4444", "#eab308"];

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Position canvas behind hero content
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "-1";

  class MathFragment {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.symbol = mathSymbols[Math.floor(Math.random() * mathSymbols.length)];
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.x = (Math.random() - 0.5) * width * 0.9;
      this.y = (Math.random() - 0.5) * height * 0.9;
      this.z = initial ? Math.random() * 800 + 100 : 900;
      this.speed = Math.random() * 1.2 + 0.4;
      this.baseSize = Math.random() * 14 + 12;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.015;
    }

    update() {
      this.z -= this.speed * 2;
      this.rotation += this.rotSpeed;

      if (this.z <= 10) {
        this.reset(false);
      }
    }

    draw() {
      const fov = 400;
      const scale = fov / (fov + this.z);
      const projX = width / 2 + this.x * scale;
      const projY = height / 2 + this.y * scale;

      const alpha = Math.min(1, (1000 - this.z) / 400) * (this.z / 900);
      if (alpha <= 0) return;

      ctx.save();
      ctx.translate(projX, projY);
      ctx.rotate(this.rotation);
      ctx.font = `600 ${Math.max(10, this.baseSize * scale * 1.5)}px "Courier New", monospace`;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha * 0.45;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.symbol, 0, 0);
      ctx.restore();
    }
  }

  const particles = Array.from({ length: particleCount }, () => new MathFragment());
  let isVisible = true;
  let rafId = null;

  const render = () => {
    if (!isVisible) return;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    rafId = requestAnimationFrame(render);
  };

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  window.addEventListener("resize", handleResize, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting && !document.hidden;
    if (isVisible) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    }
  });

  observer.observe(canvas);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      isVisible = false;
    } else {
      isVisible = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    }
  });

  rafId = requestAnimationFrame(render);
})();
