(async function () {
  await CRS.ready;

  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.classList.add('d-none');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const user = await CRS.loginUser(username, password);
    if (!user) {
      errorBox.textContent = 'Incorrect username or password.';
      errorBox.classList.remove('d-none');
      return;
    }

    window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'student-profile.html';
  });
})();