(async function () {
  await CRS.ready;

  const students = CRS.getStudents();
  const sections = CRS.getSections();
  const catalog = CRS.getCourseCatalog();
  const enrollments = CRS.vw_EnrollmentOverview();

  function statusBadge(status) {
    return `<span class="badge badge-status-${status.toLowerCase()}">${status}</span>`;
  }

  function renderStats() {
    const stats = [
      { label: 'Total Students', value: students.length },
      { label: 'Active Sections', value: sections.length },
      { label: 'Courses Offered', value: catalog.length },
      { label: 'Active Enrollments', value: enrollments.filter(e => e.status === 'Active').length },
    ];

    document.getElementById('adminStats').innerHTML = stats.map(stat => `
      <div class="col-6 col-lg-3">
        <div class="card p-3 h-100">
          <p class="text-muted small mb-1">${stat.label}</p>
          <p class="fs-3 mb-0">${stat.value}</p>
        </div>
      </div>`).join('');
  }

  function renderEnrollments(rows) {
    document.getElementById('enrollmentsBody').innerHTML = rows.length
      ? rows.map(row => `
          <tr>
            <td>${row.studentName}</td>
            <td><span class="course-code">${row.courseCode}</span> ${row.courseName}</td>
            <td>${row.semester} ${row.year}</td>
            <td>${row.instructorName}</td>
            <td>${row.grade === null ? '—' : row.grade}</td>
            <td>${statusBadge(row.status)}</td>
          </tr>`).join('')
      : '<tr><td colspan="6" class="text-muted">No enrollments match this search.</td></tr>';
  }

  function renderStudents() {
    document.getElementById('studentsBody').innerHTML = students.map(student => {
      const average = CRS.fn_GetStudentAverage(student.studentId);
      return `
        <tr>
          <td>${student.studentId}</td>
          <td>${student.firstName} ${student.lastName}</td>
          <td>${student.email}</td>
          <td>${CRS.fn_GetCompletedCredits(student.studentId)}</td>
          <td>${average > 0 ? average : '—'}</td>
        </tr>`;
    }).join('');
  }

  function renderCourses() {
    document.getElementById('coursesBody').innerHTML = catalog.map(course => {
      const seats = course.sections.reduce((sum, s) => sum + s.seatsAvailable, 0);
      const capacity = course.sections.reduce((sum, s) => sum + s.capacity, 0);
      return `
        <tr>
          <td><span class="course-code">${course.courseCode}</span></td>
          <td>${course.courseName}</td>
          <td>${course.departmentName}</td>
          <td>${course.credits}</td>
          <td>${course.sections.length}</td>
          <td>${seats}/${capacity}</td>
        </tr>`;
    }).join('');
  }

  const searchInput = document.getElementById('enrollmentSearch');
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    renderEnrollments(enrollments.filter(row =>
      !term ||
      row.studentName.toLowerCase().includes(term) ||
      row.courseCode.toLowerCase().includes(term) ||
      row.courseName.toLowerCase().includes(term)
    ));
  });

  function downloadFile(fileName, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  function convertToCsv(rows) {
    const header = 'studentName,courseCode,courseName,semester,year,instructor,grade,status';
    const body = rows.map(r => [
      r.studentName, r.courseCode, `"${r.courseName}"`, r.semester, r.year,
      r.instructorName, r.grade === null ? '' : r.grade, r.status,
    ].join(','));
    return [header, ...body].join('\n');
  }

  document.getElementById('exportJsonBtn').addEventListener('click', () => {
    downloadFile('enrollments.json', JSON.stringify(enrollments, null, 2), 'application/json');
  });

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    downloadFile('enrollments.csv', convertToCsv(enrollments), 'text/csv');
  });

  renderStats();
  renderEnrollments(enrollments);
  renderStudents();
  renderCourses();
})();