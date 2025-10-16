Blue Orb API Spec (Turso + Nostr)

Admin endpoints (Basic Auth required):
- POST /api/admin/upload/curricula
  body JSON: { title, description, subject, level, thumbnailCID, fileCID }
- POST /api/admin/upload/exam
  body JSON: { title, subject, year, fileCID }
- POST /api/admin/upload/material
  body JSON: { title, author, category, fileCID }

Management endpoints: GET/PUT/DELETE under /api/admin/{curricula,exams,materials}

Public endpoints:
- GET /api/curricula
- GET /api/exams
- GET /api/materials

Community (Nostr) endpoints:
- POST /api/community/questions
- GET /api/community/questions
- POST /api/community/replies
- GET /api/community/replies

Notes:
- Admin provides IPFS CIDs manually.
- Deploy to Vercel: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.
