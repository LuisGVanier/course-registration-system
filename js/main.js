(function () {
  const NAV_ITEMS = [
    { href: 'index.html', label: 'Home', visibility: 'all' },
    { href: 'course-catalog.html', label: 'Catalog', visibility: 'all' },
    { href: 'student-registration.html', label: 'Register', visibility: 'guest' },
    { href: 'login.html', label: 'Log In', visibility: 'guest' },
    { href: 'student-profile.html', label: 'Profile', visibility: 'student' },
    { href: 'admin-dashboard.html', label: 'Admin', visibility: 'admin' },
  ];

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  function isVisible(item, user) {
    switch (item.visibility) {
      case 'all': return true;
      case 'guest': return !user;
      case 'student': return Boolean(user) && user.role === 'student';
      case 'admin': return Boolean(user) && user.role === 'admin';
      default: return false;
    }
  }

  function buildLink(item) {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const a = document.createElement('a');
    a.className = 'nav-link';
    a.href = item.href;
    a.textContent = item.label;

    if (item.href === currentPage) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }

    li.appendChild(a);
    return li;
  }

  function buildLogoutLink() {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const a = document.createElement('a');
    a.className = 'nav-link';
    a.href = '#';
    a.textContent = 'Log Out';
    a.addEventListener('click', (event) => {
      event.preventDefault();
      CRS.logout();
      window.location.href = 'index.html';
    });

    li.appendChild(a);
    return li;
  }

  function render() {
    const user = CRS.getCurrentUser();

    const previous = document.getElementById('siteNav');
    if (previous) previous.remove();

    const nav = document.createElement('nav');
    nav.id = 'siteNav';
    nav.className = 'navbar navbar-expand-lg navbar-dark mb-4';
    nav.innerHTML = `
      <div class="container">
        <a class="navbar-brand" href="index.html">Course Registration</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#navMenu" aria-controls="navMenu"
                aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav ms-auto align-items-lg-center"></ul>
        </div>
      </div>`;

    const list = nav.querySelector('.navbar-nav');
    NAV_ITEMS
      .filter(item => isVisible(item, user))
      .forEach(item => list.appendChild(buildLink(item)));

    if (user) {
      const label = document.createElement('li');
      label.className = 'nav-item nav-user';
      label.textContent = `Signed in as ${user.username}`;
      list.appendChild(label);
      list.appendChild(buildLogoutLink());
    }

    document.body.insertBefore(nav, document.body.firstChild);
  }

    const EYE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/></svg>`;

  const EYE_SLASH = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
    <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709z"/>
    <path d="M13.646 14.354l-12-12 .708-.708 12 12z"/></svg>`;

  function addPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
      const group = document.createElement('div');
      group.className = 'input-group has-validation';
      input.parentNode.insertBefore(group, input);
      group.appendChild(input);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-outline-secondary password-toggle';
      button.innerHTML = EYE;
      button.setAttribute('aria-label', 'Show password');
      button.setAttribute('title', 'Show password');
      group.appendChild(button);

      const feedback = group.nextElementSibling;
      if (feedback && feedback.classList.contains('invalid-feedback')) {
        group.appendChild(feedback);
      }

      button.addEventListener('click', () => {
        const hidden = input.type === 'password';
        input.type = hidden ? 'text' : 'password';
        button.innerHTML = hidden ? EYE_SLASH : EYE;
        button.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
        button.setAttribute('title', hidden ? 'Hide password' : 'Show password');
      });
    });
  }

  window.CRSNav = { render };
  render();
  addPasswordToggles();
})();