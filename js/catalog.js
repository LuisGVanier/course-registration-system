(async function () {
  await CRS.ready;

  const listEl = document.getElementById('courseList');
  const searchInput = document.getElementById('searchInput');
  const deptFilter = document.getElementById('departmentFilter');
  const noResults = document.getElementById('noResults');
  const message = document.getElementById('catalogMessage');
  const user = CRS.getCurrentUser();
  const isStudent = Boolean(user) && user.role === 'student';

  const departments = [...new Set(CRS.getCourseCatalog().map(c => c.departmentName))].sort();
  departments.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    deptFilter.appendChild(opt);
  });

  if (!isStudent) {
    message.className = 'alert alert-secondary';
    message.innerHTML = '<a href="login.html">Log in</a> as a student to enroll in a section.';
  }

  function enrolledSectionIds() {
    if (!isStudent) return [];
    return CRS.vw_EnrollmentOverview()
      .filter(row => row.studentId === user.studentId)
      .map(row => row.sectionId);
  }

  function sectionRow(section, mySections) {
    let action = '';
    if (isStudent) {
      if (mySections.includes(section.sectionId)) {
        action = '<span class="badge badge-status-active">Enrolled</span>';
      } else if (section.seatsAvailable <= 0) {
        action = '<span class="text-muted">Full</span>';
      } else {
        action = `<button class="btn btn-sm btn-outline-primary enroll-btn"
                    data-section-id="${section.sectionId}">Enroll</button>`;
      }
    }

    return `
      <li class="d-flex justify-content-between align-items-center gap-2 py-1">
        <span>${section.semester} ${section.year} — ${section.schedule} (${section.room}) —
          ${section.seatsAvailable}/${section.capacity} seats — ${section.instructor}</span>
        ${action}
      </li>`;
  }

  function courseCard(course, mySections) {
    const sections = course.sections.map(s => sectionRow(s, mySections)).join('');

    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title"><span class="course-code">${course.courseCode}</span> ${course.courseName}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${course.departmentName} · ${course.credits} credits</h6>
            <ul class="small mb-0 list-unstyled">${sections || '<li>No sections offered</li>'}</ul>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const term = searchInput.value.trim().toLowerCase();
    const dept = deptFilter.value;
    const mySections = enrolledSectionIds();

    const filtered = CRS.getCourseCatalog().filter(course => {
      const matchesTerm = !term ||
        course.courseCode.toLowerCase().includes(term) ||
        course.courseName.toLowerCase().includes(term);
      const matchesDept = !dept || course.departmentName === dept;
      return matchesTerm && matchesDept;
    });

    listEl.innerHTML = filtered.map(course => courseCard(course, mySections)).join('');
    noResults.classList.toggle('d-none', filtered.length > 0);
  }

  listEl.addEventListener('click', (event) => {
    const button = event.target.closest('.enroll-btn');
    if (!button) return;

    try {
      CRS.sp_EnrollStudent(
        user.studentId,
        Number(button.dataset.sectionId),
        new Date().toISOString().slice(0, 10),
        'Active'
      );
      message.className = 'alert alert-success';
      message.textContent = 'Enrolled. The course now appears on your profile.';
    } catch (err) {
      message.className = 'alert alert-danger';
      message.textContent = err.message;
    }

    render();
  });

  searchInput.addEventListener('input', render);
  deptFilter.addEventListener('change', render);

  render();
})();