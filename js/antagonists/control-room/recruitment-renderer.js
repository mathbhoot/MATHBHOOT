(() => {
    'use strict';

    const app = document.getElementById('recruitmentApp');
    const source = document.body?.dataset.recruitmentSource;
    if (!app || !source) return;

    const make = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (typeof text === 'string') element.textContent = text;
        return element;
    };

    const makeLink = (label, href, className = '') => {
        const link = make('a', className, label);
        link.href = href;
        return link;
    };

    const renderHero = (hero) => {
        const section = make('section', 'recruitment-hero');
        section.setAttribute('aria-labelledby', 'recruitmentTitle');

        const visual = make('div', 'recruitment-hero-visual');
        const image = make('img');
        image.src = hero.image;
        image.alt = hero.imageAlt || '';
        image.width = 1098;
        image.height = 1378;
        image.decoding = 'async';
        visual.append(image);

        const copy = make('div', 'recruitment-hero-copy');
        copy.append(make('p', 'recruitment-eyebrow', hero.eyebrow));
        const title = make('h1', 'recruitment-title');
        title.id = 'recruitmentTitle';
        title.append(
            make('span', '', hero.titleLead),
            make('strong', '', hero.titleAccent),
            make('span', '', hero.titleEnd)
        );
        copy.append(
            title,
            make('p', 'recruitment-statement', hero.statement),
            make('p', 'recruitment-description', hero.description),
            makeLink(hero.actionLabel, '#application', 'recruitment-action')
        );

        const order = make('aside', 'classified-order');
        order.append(make('p', 'classified-stamp', 'Restricted'), make('h2', '', hero.orderTitle), make('p', '', hero.orderText));
        section.append(visual, copy, order);
        return section;
    };

    const renderMissions = (data) => {
        const section = make('section', 'mission-section');
        section.setAttribute('aria-labelledby', 'missionsTitle');
        const heading = make('h2', 'section-title', data.missionsHeading);
        heading.id = 'missionsTitle';
        const grid = make('div', 'mission-grid');
        data.missions.forEach((mission) => {
            const card = make('article', 'mission-card');
            card.dataset.category = mission.category || '';
            const missionLink = makeLink(data.missionActionLabel || 'Create Now', '#application', 'mission-link');
            missionLink.dataset.contributionType = mission.contributionType || '';
            card.append(
                make('span', 'mission-number', mission.number),
                make('span', 'mission-symbol', mission.symbol),
                make('h3', '', mission.title),
                make('p', '', mission.description),
                missionLink
            );
            grid.append(card);
        });
        section.append(heading, grid);
        return section;
    };

    const buildField = (field) => {
        const group = make('div', `application-field application-field-${field.type}`);
        const label = make('label', '', field.label);
        label.htmlFor = field.id;
        let control;

        if (field.type === 'textarea') {
            control = make('textarea');
            control.rows = 5;
        } else if (field.type === 'select') {
            control = make('select');
            control.append(new Option(field.placeholder || 'Select an option', ''));
            (field.options || []).forEach((option) => control.append(new Option(option, option)));
        } else {
            control = make('input');
            control.type = field.type || 'text';
        }

        control.id = field.id;
        control.name = field.id;
        control.required = Boolean(field.required);
        if (field.placeholder) control.placeholder = field.placeholder;
        if (field.autocomplete) control.autocomplete = field.autocomplete;
        if (field.maxlength) control.maxLength = Number(field.maxlength);
        if (field.minlength) control.minLength = Number(field.minlength);
        if (field.pattern) control.pattern = field.pattern;
        if (field.title) control.title = field.title;
        group.append(label, control);
        return group;
    };

    const loadDraft = (form, status) => {
        const store = window.MathbhootContributionStore;
        if (!store || store.mode !== 'local-draft') return;
        try {
            const draft = store.loadDraft();
            if (!draft) return;
            store.fields.forEach((name) => {
                const field = form.elements.namedItem(name);
                if (field && typeof draft[name] === 'string') field.value = draft[name];
            });
            const consent = form.elements.namedItem('originalityConfirmed');
            if (consent) consent.checked = Boolean(draft.originalityConfirmed);
            status.textContent = 'Your private draft was restored from this browser.';
        } catch {
            status.textContent = 'A previous local draft could not be restored.';
        }
    };

    const bindDraftForm = (form, status) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const formData = new FormData(form);
            const store = window.MathbhootContributionStore;
            const service = window.MathbhootRecruitmentSubmission;
            if (!store || store.mode !== 'local-draft') {
                status.textContent = 'Draft storage is temporarily unavailable.';
                return;
            }
            const draft = {};
            store.fields.forEach((name) => {
                draft[name] = String(formData.get(name) || '');
            });
            draft.originalityConfirmed = formData.get('originalityConfirmed') === 'on';
            try {
                store.saveDraft(draft);
            } catch {
                status.textContent = 'This browser blocked local draft storage. Copy your text before leaving the page.';
                return;
            }

            if (!service || typeof service.submit !== 'function') {
                status.textContent = 'The secure submission service is temporarily unavailable. Your draft remains on this device.';
                return;
            }

            const submit = form.querySelector('.application-submit');
            if (submit) submit.disabled = true;
            status.textContent = 'Securing your submission…';

            try {
                const result = await service.submit(draft);
                if (result.verificationSent) {
                    status.textContent = 'Verification email sent. Open its link, return here, and confirm once more to submit your idea.';
                } else {
                    store.clearDraft();
                    form.reset();
                    status.textContent = 'Submission received securely. Your reference is ' + result.reference + '.';
                }
            } catch (error) {
                status.textContent = error?.message || 'Submission failed safely. Your draft remains on this device.';
            } finally {
                if (submit) submit.disabled = false;
            }
        });
    };

    const renderApplication = (application) => {
        const panel = make('section', 'application-panel');
        panel.id = 'application';
        panel.setAttribute('aria-labelledby', 'applicationTitle');
        const heading = make('h2', '', application.heading);
        heading.id = 'applicationTitle';
        const form = make('form', 'application-form');
        form.noValidate = false;
        (application.fields || []).forEach((field) => form.append(buildField(field)));

        const consent = make('label', 'consent-field');
        const checkbox = make('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'originalityConfirmed';
        checkbox.required = true;
        consent.append(checkbox, make('span', '', application.consentLabel));

        const notice = make('p', 'draft-notice', application.draftNotice);
        const status = make('p', 'draft-status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        const submit = make('button', 'application-submit', application.saveLabel);
        submit.type = 'submit';
        form.append(consent, notice, submit, status);
        panel.append(heading, make('p', 'application-intro', application.description), form);
        bindDraftForm(form, status);
        loadDraft(form, status);
        return panel;
    };

    const renderSidebar = (data) => {
        const sidebar = make('aside', 'recruitment-sidebar');
        const ranks = make('section', 'rank-panel');
        ranks.append(make('h2', '', data.ranksHeading));
        const rankList = make('ol', 'rank-list');
        data.ranks.forEach((rank) => {
            const item = make('li');
            item.append(make('span', 'rank-mark', '◇'), make('strong', '', rank.name), make('small', '', rank.requirement));
            rankList.append(item);
        });
        ranks.append(rankList);

        const process = make('section', 'process-panel');
        process.append(make('h2', '', data.processHeading));
        const processList = make('ol', 'process-list');
        data.process.forEach((step) => {
            const item = make('li');
            item.append(make('span', '', step.number), make('strong', '', step.label));
            processList.append(item);
        });
        process.append(processList);
        sidebar.append(ranks, process);
        return sidebar;
    };

    const renderClosing = (closing) => {
        const section = make('section', 'recruitment-closing');
        section.append(
            make('strong', '', closing.lead),
            make('span', '', closing.accent),
            makeLink(closing.linkLabel, closing.linkHref, 'recruitment-action recruitment-action-secondary')
        );
        return section;
    };

    const bindMissionSelection = (workspace) => {
        const typeField = workspace.querySelector('#mission');
        if (!typeField) return;
        workspace.querySelectorAll('.mission-link[data-contribution-type]').forEach((link) => {
            link.addEventListener('click', () => {
                const option = link.dataset.contributionType;
                if (option && Array.from(typeField.options).some((item) => item.value === option)) {
                    typeField.value = option;
                }
            });
        });
    };

    const render = (data) => {
        const valid = data?.hero && Array.isArray(data.missions) && data.application && Array.isArray(data.ranks) && Array.isArray(data.process) && data.closing;
        if (!valid) return false;
        const workspace = make('div', 'recruitment-workspace');
        const joinGrid = make('div', 'join-grid');
        joinGrid.append(renderApplication(data.application), renderSidebar(data));
        workspace.append(renderHero(data.hero), renderMissions(data), joinGrid, renderClosing(data.closing));
        app.replaceChildren(workspace);
        bindMissionSelection(workspace);
        return true;
    };

    fetch(source)
        .then((response) => {
            if (!response.ok) throw new Error(`Recruitment content request failed: ${response.status}`);
            return response.json();
        })
        .then((data) => {
            if (!render(data)) throw new Error('Recruitment content is incomplete.');
        })
        .catch(() => {
            app.replaceChildren(make('p', 'recruitment-error', 'The recruitment channel is temporarily unavailable.'));
        });
})();
