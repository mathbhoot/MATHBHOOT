const escapePage = document.querySelector('.escape-page');
const isAndroidDevice = /Android/i.test(navigator.userAgent);

if (escapePage && isAndroidDevice) {
  const sessionDeck = document.querySelector('.module-deck');
  const sessionPreview = document.querySelector('#modulePreview');
  let navigationCopy = { status: 'Current session', announcement: 'Current session opened' };
  let statusTimer;

  document.documentElement.classList.add('android-session-navigation');

  fetch('../../data/escapeguide/escape-guide-content.json')
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (data?.androidNavigation) navigationCopy = { ...navigationCopy, ...data.androidNavigation };
    })
    .catch(() => { /* Navigation remains usable with fallback interface text. */ });

  escapePage.addEventListener('escape-guide:session-selected', event => {
    if (!sessionDeck || !sessionPreview) return;
    event.preventDefault();

    sessionDeck.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });

    sessionPreview.classList.remove('session-arrival');
    requestAnimationFrame(() => sessionPreview.classList.add('session-arrival'));
    window.setTimeout(() => sessionPreview.classList.remove('session-arrival'), 1400);

    let status = document.querySelector('.android-session-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'android-session-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      document.body.append(status);
    }

    const chapterTitle = event.detail?.title ? ` · ${event.detail.title}` : '';
    status.textContent = `${navigationCopy.status}${chapterTitle}`;
    status.setAttribute('aria-label', `${navigationCopy.announcement}${chapterTitle}`);
    status.classList.add('is-visible');
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => status.classList.remove('is-visible'), 2600);
  });
}
