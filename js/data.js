(function () {
  const STORAGE_KEY = 'crs_db_v1';
  const SESSION_KEY = 'crs_session_v1';
  const DEMO_PASSWORD_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

  let db = null;

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function loadDB() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function saveDB() { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }

  async function fetchSeed() {
    const res = await fetch('data/seed.json');
    const seed = await res.json();
    seed.users = seed.students.map(s => ({
      userId: s.studentId,
      studentId: s.studentId,
      username: s.email.split('@')[0],
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'student',
    }));
    seed.users.push({ userId: 999, studentId: null, username: 'admin', passwordHash: DEMO_PASSWORD_HASH, role: 'admin' });
    return seed;
  }

  async function resetDB() {
    db = await fetchSeed();
    saveDB();
    return db;
  }

  const ready = (async () => {
    db = loadDB();
    if (!db) {
      db = await fetchSeed();
      saveDB();
    }
    return db;
  })();

  function nextId(field, arr) {
    return arr.reduce((max, item) => Math.max(max, item[field]), 0) + 1;
  }

  async function hashPassword(password) {
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function registerUser({ firstName, lastName, email, phone, username, password }) {
    if (db.students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('That username is already taken.');
    }
    const student = sp_CreateStudent(firstName, lastName, email, phone, new Date().toISOString().slice(0, 10));
    const passwordHash = await hashPassword(password);
    const user = { userId: student.studentId, studentId: student.studentId, username, passwordHash, role: 'student' };
    db.users.push(user);
    saveDB();
    return { student, user };
  }

  async function loginUser(username, password) {
    const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) return null;
    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) return null;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  function logout() { sessionStorage.removeItem(SESSION_KEY); }

  function getCurrentUser() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function vw_StudentEnrollment() {
    return db.enrollments.map(e => {
      const s = getStudentById(e.studentId);
      const sec = db.sections.find(x => x.sectionId === e.sectionId);
      const c = db.courses.find(x => x.courseId === sec.courseId);
      return { studentId: s.studentId, firstName: s.firstName, lastName: s.lastName, courseName: c.courseName, semester: sec.semester, year: sec.year, status: e.status, grade: e.grade };
    });
  }

  function vw_EnrollmentOverview() {
    return db.enrollments.map(e => {
      const st = getStudentById(e.studentId);
      const sec = db.sections.find(x => x.sectionId === e.sectionId);
      const c = db.courses.find(x => x.courseId === sec.courseId);
      const instr = db.instructors.find(x => x.instructorId === sec.instructorId);
      const dept = db.departments.find(x => x.departmentId === c.departmentId);
      return {
        enrollmentId: e.enrollmentId, sectionId: e.sectionId, studentId: st.studentId, studentName: `${st.firstName} ${st.lastName}`, studentEmail: st.email,
        courseCode: c.courseCode, courseName: c.courseName, credits: c.credits,
        semester: sec.semester, year: sec.year, schedule: sec.schedule, room: sec.room,
        instructorName: `${instr.firstName} ${instr.lastName}`, departmentName: dept.departmentName,
        enrollmentDate: e.enrollmentDate, grade: e.grade, status: e.status,
      };
    });
  }

  function fn_GetCompletedCredits(studentId) {
    return db.enrollments
      .filter(e => e.studentId === studentId && e.status === 'Completed' && e.grade !== null)
      .reduce((sum, e) => {
        const sec = db.sections.find(s => s.sectionId === e.sectionId);
        const c = db.courses.find(c => c.courseId === sec.courseId);
        return sum + c.credits;
      }, 0);
  }

  function fn_GetStudentAverage(studentId) {
    const rows = db.enrollments.filter(e => e.studentId === studentId && e.status === 'Completed' && e.grade !== null);
    let weightedSum = 0, creditSum = 0;
    rows.forEach(e => {
      const sec = db.sections.find(s => s.sectionId === e.sectionId);
      const c = db.courses.find(c => c.courseId === sec.courseId);
      weightedSum += e.grade * c.credits;
      creditSum += c.credits;
    });
    return creditSum === 0 ? 0 : Math.round((weightedSum / creditSum) * 100) / 100;
  }

  function sp_CreateDepartment(departmentName, departmentHead) {
    const dept = { departmentId: nextId('departmentId', db.departments), departmentName, departmentHead };
    db.departments.push(dept); saveDB(); return dept;
  }

  function sp_CreateInstructor(firstName, lastName, email, departmentId) {
    const instr = { instructorId: nextId('instructorId', db.instructors), firstName, lastName, email, departmentId };
    db.instructors.push(instr); saveDB(); return instr;
  }

  function sp_CreateStudent(firstName, lastName, email, phone, enrollmentDate) {
    const student = { studentId: nextId('studentId', db.students), firstName, lastName, email, phone, enrollmentDate };
    db.students.push(student); saveDB(); return student;
  }

  function sp_CreateCourse(courseCode, courseName, credits, departmentId) {
    const course = { courseId: nextId('courseId', db.courses), courseCode, courseName, credits, departmentId };
    db.courses.push(course); saveDB(); return course;
  }

  function sp_CreateSection(courseId, instructorId, semester, year, schedule, room, capacity) {
    const section = { sectionId: nextId('sectionId', db.sections), courseId, instructorId, semester, year, schedule, room, capacity };
    db.sections.push(section); saveDB(); return section;
  }

  function sp_EnrollStudent(studentId, sectionId, enrollmentDate, status) {
    const section = db.sections.find(s => s.sectionId === sectionId);
    if (!section) throw new Error('Section not found.');

        const alreadyEnrolled = db.enrollments.some(e =>
      e.studentId === studentId && e.sectionId === sectionId && e.status !== 'Dropped');
    if (alreadyEnrolled) {
      throw new Error('You are already enrolled in this section.');
    }

    const activeCount = db.enrollments.filter(e => e.sectionId === sectionId && e.status !== 'Dropped').length;
    if (activeCount >= section.capacity) {
      throw new Error('Section is full. Enrollment not allowed.');
    }

    const requiredPrereqs = db.prerequisites.filter(p => p.courseId === section.courseId).map(p => p.prereqCourseId);
    if (requiredPrereqs.length > 0) {
      const completedCourseIds = db.enrollments
        .filter(e => e.studentId === studentId && e.status === 'Completed' && e.grade >= 60)
        .map(e => db.sections.find(s => s.sectionId === e.sectionId).courseId);
      if (requiredPrereqs.some(pid => !completedCourseIds.includes(pid))) {
          throw new Error('You have not completed the prerequisites required for this course.');
      }
    }

    const enrollment = { enrollmentId: nextId('enrollmentId', db.enrollments), studentId, sectionId, enrollmentDate, grade: null, status };
    db.enrollments.push(enrollment); saveDB(); return enrollment;
  }

  function sp_UpdateStudent(studentId, email, phone) {
    const student = getStudentById(studentId);
    if (!student) throw new Error('Student not found.');
    student.email = email; student.phone = phone; saveDB(); return student;
  }

  function sp_UpdateEnrollment(enrollmentId, grade, status) {
    const e = db.enrollments.find(x => x.enrollmentId === enrollmentId);
    if (!e) throw new Error('Enrollment not found.');
    e.grade = grade; e.status = status; saveDB(); return e;
  }

  function sp_UpdateSection(sectionId, schedule, room) {
    const s = db.sections.find(x => x.sectionId === sectionId);
    if (!s) throw new Error('Section not found.');
    s.schedule = schedule; s.room = room; saveDB(); return s;
  }

  function sp_DropEnrollment(enrollmentId) {
    const idx = db.enrollments.findIndex(x => x.enrollmentId === enrollmentId);
    if (idx === -1) throw new Error('Enrollment not found.');
    db.enrollments.splice(idx, 1); saveDB();
  }

  function sp_DeleteCourse(courseId) {
    if (db.sections.some(s => s.courseId === courseId)) {
      throw new Error('Cannot delete course: active sections exist.');
    }
    db.courses = db.courses.filter(c => c.courseId !== courseId); saveDB();
  }

  function sp_SearchStudent(lastName) {
    const term = lastName.trim().toLowerCase();
    return db.students.filter(s => s.lastName.toLowerCase().includes(term));
  }

  function sp_GetSectionsByCourse(courseId) {
    return db.sections.filter(s => s.courseId === courseId).map(s => {
      const instr = db.instructors.find(i => i.instructorId === s.instructorId);
      return { ...s, instructor: `${instr.firstName} ${instr.lastName}` };
    });
  }

  function sp_GetEnrollmentsByStudent(studentId) {
    return db.enrollments.filter(e => e.studentId === studentId).map(e => {
      const sec = db.sections.find(s => s.sectionId === e.sectionId);
      const c = db.courses.find(c => c.courseId === sec.courseId);
      return { enrollmentId: e.enrollmentId, courseName: c.courseName, semester: sec.semester, year: sec.year, grade: e.grade, status: e.status };
    });
  }

  function getDepartments() { return clone(db.departments); }
  function getInstructors() { return clone(db.instructors); }
  function getCourses() { return clone(db.courses); }
  function getCourseByCode(code) { return db.courses.find(c => c.courseCode.toLowerCase() === code.toLowerCase()); }
  function getStudents() { return clone(db.students); }
  function getStudentById(id) { return db.students.find(s => s.studentId === id); }
  function getSections() { return clone(db.sections); }

  function getCourseCatalog() {
    return db.courses.map(c => {
      const dept = db.departments.find(d => d.departmentId === c.departmentId);
      const sections = db.sections.filter(s => s.courseId === c.courseId).map(s => {
        const instr = db.instructors.find(i => i.instructorId === s.instructorId);
        const enrolled = db.enrollments.filter(e => e.sectionId === s.sectionId && e.status !== 'Dropped').length;
        return { sectionId: s.sectionId, semester: s.semester, year: s.year, schedule: s.schedule, room: s.room, capacity: s.capacity, seatsAvailable: s.capacity - enrolled, instructor: `${instr.firstName} ${instr.lastName}` };
      });
      return { courseId: c.courseId, courseCode: c.courseCode, courseName: c.courseName, credits: c.credits, departmentName: dept.departmentName, sections };
    });
  }

  window.CRS = {
    ready,
    hashPassword, registerUser, loginUser, logout, getCurrentUser,
    vw_StudentEnrollment, vw_EnrollmentOverview,
    fn_GetCompletedCredits, fn_GetStudentAverage,
    sp_CreateDepartment, sp_CreateInstructor, sp_CreateStudent, sp_CreateCourse, sp_CreateSection,
    sp_EnrollStudent, sp_UpdateStudent, sp_UpdateEnrollment, sp_UpdateSection, sp_DropEnrollment,
    sp_DeleteCourse, sp_SearchStudent, sp_GetSectionsByCourse, sp_GetEnrollmentsByStudent,
    getDepartments, getInstructors, getCourses, getCourseByCode, getStudents, getStudentById, getSections, getCourseCatalog,
    resetDB,
  };
})();