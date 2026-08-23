(async function () {
  await CRS.ready;

  const root = document.getElementById('profileRoot');
  const user = CRS.getCurrentUser();

  if (!user || user.role !== 'student') {
    root.innerHTML = `
      <div class="alert alert-warning">
        You are not signed in as a student.
        <a href="login.html">Log in</a> or <a href="student-registration.html">create an account</a>
        to view your profile.
      </div>`;
    return;
  }

  const editModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
  const editForm = document.getElementById('editProfileForm');

  function statusBadge(status) {
    return `<span class="badge badge-status-${status.toLowerCase()}">${status}</span>`;
  }

  function enrollmentCard(row) {
    const gradeText = row.grade === null ? 'Not graded yet' : `Grade: ${row.grade}`;
    const dropButton = row.status === 'Active'
      ? `<button class="btn btn-sm btn-outline-secondary drop-btn" data-enrollment-id="${row.enrollmentId}">Drop</button>`
      : '';

    return `
      <div class="col-md-6">
        <div class="card h-100 p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="course-code">${row.courseCode}</span>
            ${statusBadge(row.status)}
          </div>
          <h3 class="h6 mb-1">${row.courseName}</h3>
          <p class="text-muted small mb-1">${row.semester} ${row.year} · ${row.schedule} · Room ${row.room}</p>
          <p class="text-muted small mb-2">${row.instructorName} · ${row.credits} credits</p>
          <div class="d-flex justify-content-between align-items-center mt-auto">
            <span class="small">${gradeText}</span>
            ${dropButton}
          </div>
        </div>
      </div>`;
  }

  function render() {
    const student = CRS.getStudentById(user.studentId);
    const rows = CRS.vw_EnrollmentOverview().filter(r => r.studentId === user.studentId);
    const activeCount = rows.filter(r => r.status === 'Active').length;
    const credits = CRS.fn_GetCompletedCredits(user.studentId);
    const average = CRS.fn_GetStudentAverage(user.studentId);

    root.innerHTML = `
      <div class="card p-4 mb-4">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h2 class="h4 mb-1">${student.firstName} ${student.lastName}</h2>
            <p class="text-muted mb-0">Student #${student.studentId} · joined ${student.enrollmentDate}</p>
          </div>
          <button id="editProfileBtn" class="btn btn-outline-primary btn-sm">Edit Profile</button>
        </div>
        <hr>
        <p class="mb-1"><strong>Email:</strong> ${student.email}</p>
        <p class="mb-0"><strong>Phone:</strong> ${student.phone}</p>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-sm-4">
          <div class="card p-3">
            <p class="text-muted small mb-1">Completed credits</p>
            <p class="fs-3 mb-0">${credits}</p>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="card p-3">
            <p class="text-muted small mb-1">Weighted average</p>
            <p class="fs-3 mb-0">${average > 0 ? average : '—'}</p>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="card p-3">
            <p class="text-muted small mb-1">Active courses</p>
            <p class="fs-3 mb-0">${activeCount}</p>
          </div>
        </div>
      </div>

      <h2 class="h5 mb-3">My Courses</h2>
      <div class="row g-3">
        ${rows.length ? rows.map(enrollmentCard).join('') : '<p class="text-muted">No enrollments yet.</p>'}
      </div>`;

    document.getElementById('editProfileBtn').addEventListener('click', () => {
      document.getElementById('editEmail').value = student.email;
      document.getElementById('editPhone').value = student.phone;
      editModal.show();
    });

    root.querySelectorAll('.drop-btn').forEach(button => {
      button.addEventListener('click', () => {
        CRS.sp_DropEnrollment(Number(button.dataset.enrollmentId));
        render();
      });
    });
  }

  editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!editForm.checkValidity()) {
      editForm.classList.add('was-validated');
      return;
    }
    CRS.sp_UpdateStudent(
      user.studentId,
      document.getElementById('editEmail').value.trim(),
      document.getElementById('editPhone').value.trim()
    );
    editForm.classList.remove('was-validated');
    editModal.hide();
    render();
  });

  render();
})();