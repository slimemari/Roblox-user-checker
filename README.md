# Discord 4-Letter Handle Sniper

A Vite + React dashboard for generating unique four-letter handles and displaying availability results.

## Run

```bash
npm install
npm run dev
```

## Modes

**Demo / UI Preview** generates unique handles locally and simulates results so the interface can be tested immediately.

**Authorized Backend** calls `GET /api/check?username=xxxx`. Connect this to a backend you control that is authorized to perform the check. The UI pauses when the backend returns HTTP 429.

This project deliberately does not bypass Discord rate limits or anti-abuse controls.
