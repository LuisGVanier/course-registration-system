# Course Registration System

A front-end prototype of a college course registration system, built for **Front-End Programming**
in the Software Development program at Vanier College.

**Live demo:** https://luisgvanier.github.io/course-registration-system/

Everything runs in the browser. Data is loaded from a JSON file and kept in browser storage, with no
backend server, which keeps the project inside the HTML / CSS / Bootstrap / JavaScript scope of this
segment.

## Features

**Students** register with validated forms, log in, search the catalog by course code, name, or
department, enroll in open sections, and view a profile with their completed credits, weighted
average, and enrollments, where they can edit contact details or drop a course.

**Administrators** get a dashboard with live counts, three tabbed tables (Enrollments, Students,
Courses), search, and enrollment export to JSON or CSV.

The navigation bar is generated in JavaScript and changes with the signed-in user's role. Enrollment
enforces section capacity, completed prerequisites, and no duplicate registrations. Passwords are
hashed with SHA-256 and never stored as plain text.

## Demo accounts

Most of seeded accounts use the password `password123`. We've also made some tests with `Abc12345`

| Username | Role |
|---|---|
| `admin` | Administrator |
| `liam.tremblay` | Student with three completed courses, 9 credits, 85.5 average |

To restore the original dataset, run `CRS.resetDB()` in the browser console.

## Running locally

The app uses `fetch()` to load `data/seed.json`, which browsers block on `file://` URLs, so it must
be served over HTTP. Open the folder in VS Code, then right-click `index.html` and choose **Open
with Live Server**.

## How the data layer works

`data/seed.json` mirrors a relational schema (departments, instructors, courses, prerequisites,
sections, students, enrollments) joined by integer keys. `js/data.js` wraps it in an API named after
the SQL objects it stands in for: `vw_` for views, `fn_` for scalar functions, `sp_` for stored
procedures. Every page uses that single API, so when a real API replaces the JSON file, only the
`fetch` call inside `data.js` changes.

## Scope decisions

Intentional boundaries for this segment:

* **No backend or database.** JSON in the browser stands in for the database; `localStorage` stands
  in for persistence, so data does not carry across browsers.
* **No self-registration for administrators.** Admin accounts are provisioned, never self-created.
* **No instructor accounts.** Instructors exist as data; an instructor portal is a separate surface.
* **No password recovery.** A reset flow needs a mail server, so it is future work rather than a link
  that cannot function.
* **Students are not scoped to a program.** The catalog is open, reflecting the Quebec general
  education requirement to take courses outside the major. The rule modelled here is prerequisites.
* **Passwords are hashed but not salted.** SHA-256 shows credentials are never stored in plain text.
  Production needs a salted, slow hash such as bcrypt, which belongs on a server.

## Future work

REST API in place of the JSON file, instructor portal for grade entry, program and graduation
requirement tracking, and server-side authentication.

## Authors

Luis Gerardo Molina Guillen and Fatemeh Damghani, Software Development: Secure Desktop, Mobile And Web Applications ACS/AEC LEA.8F_26W_1232 program, Summer 2026, Vanier College. Developed with Agile methodology using a Trello board and weekly sprint reports.