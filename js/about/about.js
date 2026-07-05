(() => {
    const particleField = document.getElementById('magic-particles');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (particleField && !reducedMotion) {
        const fragment = document.createDocumentFragment();
        const particleCount = Math.min(22, Math.max(10, Math.floor(window.innerWidth / 44)));

        for (let index = 0; index < particleCount; index += 1) {
            const particle = document.createElement('span');
            particle.className = 'magic-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * -14}s`;
            particle.style.setProperty('--float-speed', `${10 + Math.random() * 12}s`);
            particle.style.setProperty('--float-drift', `${Math.round((Math.random() - 0.5) * 90)}px`);
            fragment.appendChild(particle);
        }

        particleField.appendChild(fragment);
    }

    const revealItems = document.querySelectorAll('.reveal');

    if (revealItems.length) {
        if (!('IntersectionObserver' in window) || reducedMotion) {
            revealItems.forEach((item) => item.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.16 });

        revealItems.forEach((item) => observer.observe(item));
    }
})();
