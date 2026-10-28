# Security Policy

## Supported Versions

Only the `master` branch, which is what runs at <https://hackhub.mekhroj.uz>, receives security fixes.

## Reporting a Vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub: **Security → Report a vulnerability**
(<https://github.com/ollayorbek0833/HackHub/security/advisories/new>).

Include what you found, how to reproduce it, and the impact you expect. You should get a reply within a few days;
once a fix is deployed, the advisory is published with credit unless you prefer otherwise.

Particularly relevant areas: Auth.js sessions and `AUTH_SECRET`, password hashing and the login flow
(`src/auth.ts`, `src/lib/password.ts`), role checks for judges and organizers (`requireRole()` in
`src/lib/auth/dal.ts`, since `src/proxy.ts` only redirects and never authorizes), the `callbackUrl` redirect after
login, team invite codes, scores and rankings that should stay hidden until the organizer publishes them, event image
uploads served from `/uploads` (`src/lib/uploads`), and the seeded organizer and demo accounts
(`SEED_ORGANIZER_*`, `SEED_DEMO_*`).
