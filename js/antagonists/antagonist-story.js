(() => {
    const app = document.querySelector('#antagonistStory');
    const source = document.body?.dataset.storySource;
    if (!app || !source) return;

    const createElement = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (typeof text === 'string') element.textContent = text;
        return element;
    };

    const renderStory = (story) => {
        if (!story || !story.title || !story.image || !Array.isArray(story.paragraphs)) return false;

        const article = createElement('article', 'story-article');
        app.setAttribute('aria-labelledby', 'storyTitle');
        const hero = createElement('header', 'story-hero');
        const image = createElement('img');
        image.src = story.image.src;
        image.alt = story.image.alt || '';
        image.width = Number(story.image.width) || 1536;
        image.height = Number(story.image.height) || 1024;
        image.decoding = 'async';

        const heading = createElement('div', 'story-heading');
        heading.append(createElement('p', 'story-kicker', story.kicker));
        const title = createElement('h1', '', story.title);
        title.id = 'storyTitle';
        heading.append(title);
        hero.append(image, heading);

        const body = createElement('div', 'story-body');
        story.paragraphs.forEach((paragraph, index) => {
            body.append(createElement('p', index === 0 ? 'story-lead' : '', paragraph));
        });

        const actions = createElement('nav', 'story-actions');
        actions.setAttribute('aria-label', 'Story navigation');
        if (Array.isArray(story.links)) {
            story.links.forEach((item) => {
                if (!item || !item.href || !item.label) return;
                const link = createElement('a', 'story-link', item.label);
                link.href = item.href;
                actions.append(link);
            });
        }
        body.append(actions);
        article.append(hero, body);
        app.replaceChildren(article);
        return true;
    };

    fetch(source)
        .then((response) => {
            if (!response.ok) throw new Error(`Story request failed: ${response.status}`);
            return response.json();
        })
        .then((story) => {
            if (!renderStory(story)) throw new Error('Story data is incomplete.');
        })
        .catch(() => {
            app.replaceChildren(createElement('p', 'story-error', 'This restricted archive is temporarily unavailable.'));
        });
})();
