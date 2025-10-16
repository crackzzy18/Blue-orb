Blue Orb Backend — Turso + Nostr Version
=======================================

This backend uses Turso (libsql) as the single source of truth and integrates with Nostr for community features.

Quick start (local with Turso):
1. Install dependencies:
   npm install

2. Create a .env file from .env.example and set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.

3. Start the server:
   npm run dev

Notes:
- Admin routes are protected with HTTP Basic Auth. Default credentials are in .env.example.
- Files (PDFs, images) should be uploaded/pinned manually to IPFS; admin APIs expect CID strings.
- Deploy to Vercel: set environment variables (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_USER, ADMIN_PASS).
