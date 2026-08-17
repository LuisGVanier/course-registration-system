(async function () {
  await CRS.ready;

  const courses = CRS.getCourseCatalog();
  const listEl = document.getElementById('courseList');
  const searchInput = document.getElementById('searchInput');
  const deptFilter = document.getElementById('departmentFilter');
  const noResults = document.getElementById('noResults');

  const departments = [...new Set(courses.map(c => c.departmentName))].sort();
  departments.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    deptFilter.appendChild(opt);
  });

  function courseCard(course) {
    const sectionsHtml = course.sections.map(s =>
      `<li>${s.semester} ${s.year} — ${s.schedule} (${s.room}) — ${s.seatsAvailable}/${s.capacity} seats — ${s.instructor}</li>`
    ).join('');

    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title"><span class="course-code">${course.courseCode}</span> ${course.courseName}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${course.departmentName} · ${course.credits} credits</h6>
            <ul class="small mb-0">${sectionsHtml || '<li>No sections offered</li>'}</ul>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const term = searchInput.value.trim().toLowerCase();
    const dept = deptFilter.value;

    const filtered = courses.filter(c => {
      const matchesTerm = !term || c.courseCode.toLowerCase().includes(term) || c.courseName.toLowerCase().includes(term);
      const matchesDept = !dept || c.departmentName === dept;
      return matchesTerm && matchesDept;
    });

    listEl.innerHTML = filtered.map(courseCard).join('');
    noResults.classList.toggle('d-none', filtered.length > 0);
  }

  searchInput.addEventListener('input', render);
  deptFilter.addEventListener('change', render);

  render();
})();