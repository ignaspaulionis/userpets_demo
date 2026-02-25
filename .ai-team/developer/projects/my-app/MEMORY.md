## Build & Run
- Start app with `node server.js` and open `/dashboard.html` for the static dashboard page — SCRUM-18

## Code Patterns
- Dashboard UI is a static HTML page in `public/dashboard.html` using inline CSS/JS and 5-second polling of `/users/user-stats` with Bearer token from `localStorage.token` — public/dashboard.html:35
- Dashboard top navigation includes deterministic backend links (`/dashboard.html`, `/api-docs`, `/pets`, `/users`, `/tags`) plus a logout button that clears `localStorage`/`sessionStorage` token keys — public/dashboard.html:27