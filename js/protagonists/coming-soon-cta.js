document.addEventListener('DOMContentLoaded', () => {
    const section = document.querySelector('.next-protagonist-cta');
    const button = section ? section.querySelector('button') : null;

    if (!button) {
        return;
    }

    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');

    fetch('../../data/protagonists/next-protagonist-cta.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error('CTA content could not be loaded.');
            }

            return response.json();
        })
        .then((content) => {
            if (!content.buttonLabel || !content.statusLabel) {
                return;
            }

            const label = document.createElement('span');
            const status = document.createElement('span');

            label.textContent = content.buttonLabel;
            status.className = 'next-protagonist-cta__status';
            status.textContent = content.statusLabel;

            button.replaceChildren(label, status);

            if (content.accessibleLabel) {
                button.setAttribute('aria-label', content.accessibleLabel);
            }
        })
        .catch(() => {
            // The native disabled state and original label remain as a safe fallback.
        });
});
