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

  const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));

  function findSection(sectionId) {
    for (const course of CRS.getCourseCatalog()) {
      const section = course.sections.find(s => s.sectionId === sectionId);
      if (section) return { course, section };
    }
    return null;
  }

    function showConfirmation(student, enrollment, enrollmentError) {
    const body = document.getElementById('confirmBody');

    if (!enrollment) {
      body.innerHTML = `
        <p>Welcome, <strong>${student.firstName} ${student.lastName}</strong>. Your account has been
        created and you are signed in.</p>
        <div class="alert alert-warning mb-0">
          We could not enroll you in that section: ${enrollmentError}
          Open the catalog to choose another course.
        </div>`;
      confirmModal.show();
      return;
    }

    const match = findSection(enrollment.sectionId);
    const reference = `ENR-${String(enrollment.enrollmentId).padStart(5, '0')}`;

        body.innerHTML = `
      <p>Welcome, <strong>${student.firstName} ${student.lastName}</strong>. Your account is ready
      and you are enrolled in:</p>
      <div class="card p-3 mb-3">
        <p class="mb-1"><span class="course-code">${match.course.courseCode}</span>
          <strong>${match.course.courseName}</strong></p>
        <p class="text-muted small mb-1">
          ${match.section.semester} ${match.section.year} ·
          ${match.section.schedule} · Room ${match.section.room}</p>
        <p class="text-muted small mb-0">Instructor: ${match.section.instructor}</p>
      </div>
      <p class="text-muted small mb-0">Confirmation number: <strong>${reference}</strong> ·
      a copy has been sent to ${student.email}.</p>`;

    confirmModal.show();
  }

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
      await CRS.loginUser(username, password);

      let enrollment = null;
      let enrollmentError = '';
      try {
        enrollment = CRS.sp_EnrollStudent(student.studentId, sectionId, new Date().toISOString().slice(0, 10), 'Active');
      } catch (err) {
        enrollmentError = err.message;
      }

      showConfirmation(student, enrollment, enrollmentError);
      form.reset();
      form.classList.remove('was-validated');
      CRSNav.render();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove('d-none');
    }
  });
})();