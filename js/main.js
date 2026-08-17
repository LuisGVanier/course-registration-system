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

  window.CRSNav = { render };
  render();
})();