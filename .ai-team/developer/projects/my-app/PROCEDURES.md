### Add menu to static dashboard page
1. Open `public/dashboard.html` and locate the existing `<style>` and top-level `<body>` structure.
2. Add a lightweight `<nav>` menu near the top with links to `/dashboard.html`, `/api-docs`, `/pets`, `/users`, `/tags`.
3. Add a `Logout` button and wire a click handler in the existing script to clear `localStorage.removeItem('token')` and `sessionStorage.removeItem('token')`.
4. Redirect to `/dashboard.html` after logout to keep flow deterministic.
5. Keep existing polling/rendering logic unchanged; only add menu styling and logout behavior.
6. Smoke test by starting server, opening `/dashboard.html`, and verifying menu links resolve without 404s and logout redirects.
