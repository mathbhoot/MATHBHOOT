(() => {
    const antagonistApp = document.querySelector('#antagonistApp');
    if (!antagonistApp) return;
    const source = '../../data/antagonists/villa-story-entry.json';

    const createElement = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (typeof text === 'string') element.textContent = text;
        return element;
    };

    const renderEntry = (content) => {
        if (antagonistApp.querySelector('.villa-story-feature')) return true;

        const shell = antagonistApp.querySelector('.antagonist-shell');
        const intruderSection = shell?.querySelector('.intruder-search');
        if (!shell || !intruderSection) return false;
        if (!content?.title || !content?.paragraph || !content?.image?.src || !content?.actionLabel || !content?.actionHref) return false;

        const entry = createElement('section', 'villa-story-feature');
        entry.setAttribute('aria-labelledby', 'villaStoryEntryTitle');

        const visual = createElement('div', 'villa-story-feature__visual');
        const image = createElement('img');
        image.src = content.image.src;
        image.alt = content.image.alt || '';
        image.width = Number(content.image.width) || 1536;
        image.height = Number(content.image.height) || 1024;
        image.loading = 'lazy';
        image.decoding = 'async';
        visual.append(image);

        const copy = createElement('div', 'villa-story-feature__copy');
        copy.append(createElement('p', 'villa-story-feature__kicker', content.kicker || 'Villa Story'));

        const title = createElement('h2', 'villa-story-feature__title', content.title);
        title.id = 'villaStoryEntryTitle';
        copy.append(title, createElement('p', 'villa-story-feature__text', content.paragraph));

        const action = createElement('a', 'profile-button villa-story-feature__action', content.actionLabel);
        action.href = content.actionHref;
        copy.append(action);
        entry.append(visual, copy);
        intruderSection.insertAdjacentElement('afterend', entry);
        return true;
    };

    fetch(source)
        .then((response) => {
            if (!response.ok) throw new Error(`Villa story entry request failed: ${response.status}`);
            return response.json();
        })
        .then((content) => {
            renderEntry(content);

            const observer = new MutationObserver(() => {
                renderEntry(content);
            });
            observer.observe(antagonistApp, { childList: true, subtree: true });
        })
        .catch(() => {
            // The main antagonist page remains usable if this optional entry fails.
        });
})();
