const recruitmentPage = document.querySelector('.recruitment-page');
const applicationHost = document.querySelector('#recruitmentApp');
const availabilityUrl = '../../../data/antagonists/control-room/recruitment-availability.json';

if (recruitmentPage && applicationHost) {
  let availability = null;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === 'string') element.textContent = text;
    return element;
  };

  const closeRecruitment = (workspace) => {
    if (!availability || availability.enabled !== false || !workspace) return;
    const panel = workspace.querySelector('#application');
    if (!panel) return;

    const closed = make('section', 'recruitment-closed');
    closed.id = 'application';
    closed.setAttribute('aria-labelledby', 'recruitmentClosedTitle');
    const heading = make('h2', '', availability.heading);
    heading.id = 'recruitmentClosedTitle';
    closed.append(
      make('p', 'recruitment-closed__eyebrow', availability.eyebrow),
      heading,
      make('p', '', availability.description),
      make('p', 'recruitment-closed__notice', availability.notice)
    );
    panel.replaceWith(closed);

    workspace.querySelectorAll('a[href="#application"]').forEach(link => {
      link.textContent = availability.actionLabel;
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', event => {
        event.preventDefault();
        closed.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    recruitmentPage.dataset.recruitmentAvailability = 'paused';
    try { sessionStorage.removeItem('mathbhoot.antagonistContribution.draft.v1'); } catch { /* Storage is optional. */ }
  };

  document.addEventListener('mathbhoot:recruitment-rendered', event => closeRecruitment(event.detail?.workspace));

  fetch(availabilityUrl, { credentials: 'same-origin' })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Availability unavailable')))
    .then(data => {
      availability = data;
      closeRecruitment(applicationHost.querySelector('.recruitment-workspace'));
    })
    .catch(() => {
      availability = { enabled: false, eyebrow: 'Recruitment channel secured', heading: 'Applications are temporarily closed', description: 'MATHBHOOT is not accepting submissions at this time.', notice: 'No information can be submitted from this page.', actionLabel: 'Applications Paused' };
      closeRecruitment(applicationHost.querySelector('.recruitment-workspace'));
    });
}
