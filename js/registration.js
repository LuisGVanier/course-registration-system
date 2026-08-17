(async function () {
  await CRS.ready;

  const form = document.getElementById('registrationForm');
  const sectionSelect = document.getElementById('sectionSelect');
  const errorBox = document.getElementById('formError');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');

  const catalog = CRS.getCourseCatalog();
  sectionSelect.innerHTML = '<option selected disabled value="">Choose a section...</option>';
  catalog.forEach(course => {
    course.sections.forEach(sec => {
      const opt = document.createElement('option');
      opt.value = sec.sectionId;
      opt.textContent = `${course.courseCode} — ${course.courseName} (${sec.semester} ${sec.year}, ${sec.schedule}) — ${sec.seatsAvailable} seats left`;
      opt.disabled = sec.seatsAvailable <= 0;
      sectionSelect.appendChild(opt);
    });
  });

  function checkPasswordsMatch() {
    if (confirmInput.value && confirmInput.value !== passwordInput.value) {
      confirmInput.setCustomValidity('Passwords must match.');
    } else {
      confirmInput.setCustomValidity('');
    }
  }
  passwordInput.addEventListener('input', checkPasswordsMatch);
  confirmInput.addEventListener('input', checkPasswordsMatch);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    checkPasswordsMatch();
    errorBox.classList.add('d-none');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = passwordInput.value;
    const sectionId = Number(sectionSelect.value);

    try {
      const { student } = await CRS.registerUser({ firstName, lastName, email, phone, username, password });
      CRS.sp_EnrollStudent(student.studentId, sectionId, new Date().toISOString().slice(0, 10), 'Active');
      await CRS.loginUser(username, password);
      window.location.href = 'enrollment-confirmation.html';
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove('d-none');
    }
  });
})();