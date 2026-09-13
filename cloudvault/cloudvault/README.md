# CloudVault

**Store, organise and share securely.**

CloudVault is a full-stack cloud file management platform inspired by Google Drive, built as a
production-style portfolio project. Users register for a private account, upload files, build
nested folder structures, star and search their content, recover deleted items from trash, and
share files or folders with other users via permissioned access or public links.

> **Build status:** Phase 1 (project setup, authentication, dashboard shell) is complete and
> functional end-to-end. Phases 2–5 (file/folder CRUD, search, trash, sharing, preview) are
> scoped in this repo's architecture and database schema, and are the natural next milestones —
> see [Roadmap](#roadmap--future-improvements).

---

## Main Features

- Email/password authentication with access + refresh tokens (refresh token stored in an
  HTTP-only cookie, automatic silent refresh on the client)
- Responsive dashboard: collapsible sidebar, global search bar, New/Upload actions, profile menu
- Per-user storage quota (5 GB default) with usage breakdown by file category
- Nested folders with breadcrumb navigation
- Grid/list view toggle with persisted preference
- Starred items, Recent activity, and Trash (soft-delete) pages
- File/folder sharing with Viewer/Editor permissions and public share links (schema + API
  contract defined; implementation is Phase 5)
- Light and dark mode
- Original branding: a custom cloud + vault/shield SVG mark — no third-party assets

## Technology Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, TanStack Query,
React Hook Form, Zod, Lucide React, React Dropzone

**Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, JWT (access + refresh),
bcrypt, Multer, Zod, Helmet, express-rate-limit

## Architecture

```
cloudvault/
├── backend/
│   ├── prisma/            # schema.prisma, seed.ts
│   ├── src/
│   │   ├── config/        # env validation, Prisma client singleton
│   │   ├── controllers/   # HTTP layer
│   │   ├── middleware/    # auth, validation, error handling
│   │   ├── repositories/  # Prisma data access
│   │   ├── routes/        # Express routers
│   │   ├── services/      # business logic
│   │   ├── storage/       # StorageProvider abstraction (local disk now, S3-ready)
│   │   ├── utils/         # ApiError, JWT, password hashing, filename sanitization
│   │   └── validators/    # Zod schemas
│   └── tests/
└── frontend/
    └── src/
        ├── api/            # Axios client + typed API calls
        ├── components/     # ui/, layout/, auth/, files/, folders/, sharing/
        ├── context/        # AuthContext, ThemeContext, ToastContext
        ├── pages/          # route-level components
        └── routes/         # ProtectedRoute
```

The backend follows a layered architecture (routes → controllers → services → repositories) so
business logic never touches Express request/response objects directly, and the storage layer is
abstracted behind a `StorageProvider` interface — swapping local disk for S3, Cloudinary, or
Supabase Storage means implementing one interface and changing a single import in
`storage/index.ts`.

## Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or use the provided Docker Compose setup)

### Backend

```bash
cd backend
cp .env.example .env      # then fill in real secrets
npm install
npm run prisma:generate
npm run prisma:migrate    # creates the database schema
npm run seed               # optional: creates demo users
npm run dev                 # starts the API on http://localhost:4000
```

Demo users created by the seed script:
| Email | Password |
|---|---|
| alice@cloudvault.dev | Password123! |
| bob@cloudvault.dev | Password123! |

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts the app on http://localhost:5173
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`. Never commit real secrets — generate
long random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in any real deployment.

## Database Migrations & Seeding

```bash
npm run prisma:migrate    # apply migrations in development
npm run prisma:deploy     # apply migrations in production (no prompts)
npm run prisma:studio     # browse the database visually
npm run seed               # populate demo users/folders
```

## Docker

```bash
docker compose up --build
```

This starts PostgreSQL (with a persistent volume), the backend API (runs migrations on boot,
persists uploads to a volume), and the frontend, wired together on a shared network.

## API Overview

All endpoints are prefixed with `/api`. Implemented in this phase:

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

Scoped in the Prisma schema and ready to build on top of the existing service/repository layers:
`files`, `folders`, `shares`, `share-links`, `search`, `recent`, `starred`, `trash`, `storage`,
`activities` (see the original spec for full endpoint list and behavior).

Every API response follows a consistent envelope:

```json
{ "success": true, "data": { } }
```

Errors:

```json
{ "success": false, "message": "Human-readable message", "code": "ERROR_CODE", "details": {} }
```

## Testing

```bash
# Backend (Vitest + Supertest)
cd backend && npm test

# Frontend (Vitest + React Testing Library)
cd frontend && npm test
```

`backend/tests/auth.test.ts` covers registration validation, duplicate email handling, login
success/failure, and protected-route token verification against a real database connection.

## Security Considerations

- Passwords hashed with bcrypt (12 rounds); hashes are never returned in API responses
- Access tokens are short-lived and kept in memory on the client (never localStorage); refresh
  tokens are HTTP-only, `SameSite=Lax` cookies, scoped to `/api/auth`, and rotated on every use
- Every request body/query is validated with Zod before it reaches business logic
- Centralized error handling normalizes Prisma, validation, and upload errors into one response
  shape without leaking internals
- `LocalStorageProvider` resolves and validates every path to prevent path traversal, and never
  trusts user-supplied filenames as storage keys (a UUID-based key is generated server-side)
- Helmet, CORS restricted to `CLIENT_URL`, and rate limiting (global + stricter on auth routes)
- Ownership and sharing-permission checks are required on every file/folder operation as those
  endpoints are implemented (Phase 2+)

## Roadmap / Future Improvements

- Phase 2: file upload/listing/download/rename/delete, storage usage tracking
- Phase 3: folder CRUD, nested folders, breadcrumb navigation, move operations, grid/list views
- Phase 4: search with filters, recent activity, starred items, trash + restoration, file preview
- Phase 5: sharing (Viewer/Editor), public share links with expiration and optional password
  protection, activity logs, further responsive polish
- Replace `LocalStorageProvider` with an S3-compatible provider for production deployments
- Add virus scanning on upload and background thumbnail generation for image/video previews

## Screenshots

_Add screenshots of the login page, dashboard, and storage view here once the app is running
locally._
