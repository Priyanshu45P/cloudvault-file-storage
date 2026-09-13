# CloudVault — Google Drive-style full-stack file manager

CloudVault is a React + TypeScript, Node.js + Express, PostgreSQL + Prisma cloud file manager inspired by Google Drive. The current build includes working authentication, uploads, nested folders, file browsing, preview/download, search, sorting, starring, trash/restore, sharing, public links, recent files, activity tracking, storage analytics, drag-and-drop uploads, grid/list views and multi-select actions.

## Implemented features

- Secure email/password registration and login
- Short-lived JWT access token + rotating HTTP-only refresh cookie
- Upload one or many files (100 MB/file default)
- Drag-and-drop uploads and upload progress
- Duplicate filename handling (`Report (1).pdf`, etc.)
- File version history: upload new versions, download previous versions and restore an older version
- Real My Drive file/folder listing
- Nested folders and breadcrumb navigation
- List/grid view with persisted preference
- Sort by modified date, name, or file size
- File preview for images, PDF, text, audio and video
- Image thumbnails in grid view
- Authenticated file downloads
- Rename files/folders
- Move files/folders (including cycle protection for folders)
- Star/unstar items and Starred page
- Recent files based on access/update activity
- Global filename/folder search
- Soft-delete Trash, restore, delete forever and empty trash
- Multi-select bulk star/trash/restore/permanent-delete
- Drag files/folders onto folders to reorganise them
- Keyboard shortcuts for upload, select-all, delete, open and escape
- Share files/folders with another CloudVault user as Viewer or Editor
- Browse folders shared with you, including inherited access to nested content
- Public share links for files/folders with optional expiry
- Public shared-folder browsing with nested files/folders
- Item details panel and activity history
- Per-user 5 GB default quota
- Storage usage breakdown by Images, Videos, Documents, Audio, Archives and Other
- Editable profile name and secure password change
- Light/dark mode
- Keyboard upload shortcut: `Ctrl+U` / `Cmd+U`
- Local `StorageProvider` abstraction designed so S3/R2/Azure storage can be added later
- Filename sanitisation, dangerous-extension blocking, safe storage keys, quota enforcement, Helmet, CORS and rate limiting

## Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, TanStack Query, React Dropzone, Lucide React

**Backend:** Node.js, Express, TypeScript, PostgreSQL 16, Prisma 5, JWT, bcrypt, Multer, Zod, Helmet, express-rate-limit

## Local setup (Windows / VS Code)

### 1. Start PostgreSQL

From the project root (the folder containing `docker-compose.yml`):

```powershell
docker compose up -d postgres
docker compose ps
```

### 2. Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run prisma:generate
npx prisma db push
npm run seed
npm run dev
```

Backend: `http://localhost:4000`

Health check: `http://localhost:4000/health`

Demo accounts:

| Email | Password |
|---|---|
| alice@cloudvault.dev | Password123! |
| bob@cloudvault.dev | Password123! |

### 3. Frontend

Open another terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Main API routes

All routes are prefixed with `/api`.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Drive

```text
GET    /api/drive
GET    /api/search?q=...
POST   /api/files/upload
GET    /api/files/:id/preview
GET    /api/files/:id/download
PATCH  /api/files/:id/rename
PATCH  /api/files/:id/move
PATCH  /api/files/:id/star
GET    /api/files/:id/versions
POST   /api/files/:id/versions
POST   /api/files/:id/versions/:versionId/restore
GET    /api/files/:id/versions/:versionId/download
DELETE /api/files/:id
POST   /api/files/:id/restore
DELETE /api/files/:id/permanent
```

### Folders

```text
POST   /api/folders
GET    /api/folders/options
PATCH  /api/folders/:id/rename
PATCH  /api/folders/:id/move
PATCH  /api/folders/:id/star
DELETE /api/folders/:id
POST   /api/folders/:id/restore
DELETE /api/folders/:id/permanent
```

### Smart views

```text
GET    /api/recent
GET    /api/starred
GET    /api/trash
DELETE /api/trash
GET    /api/storage/stats
GET    /api/activity
```

### Sharing

```text
GET  /api/shared
GET  /api/shared/folder/:id
POST /api/files/:id/share
POST /api/folders/:id/share
POST /api/files/:id/share-link
POST /api/folders/:id/share-link
GET  /api/public/:token
GET  /api/public/:token/preview
GET  /api/public/:token/download
GET  /api/public/:token/folder
GET  /api/public/:token/file/:fileId/preview
GET  /api/public/:token/file/:fileId/download
```

## Docker full-stack start

```powershell
docker compose up --build
```

For this development clone the backend container uses `prisma db push` on startup so a fresh PostgreSQL volume is initialised automatically.

## Storage

Local development files are written to:

```text
backend/uploads/
```

File metadata, ownership, folders, sharing permissions, public-link metadata, activity logs and storage totals live in PostgreSQL.

## Production notes

Before deploying publicly:

- replace development JWT secrets with strong random secrets;
- use managed PostgreSQL;
- implement an S3-compatible `StorageProvider` (AWS S3, Cloudflare R2, etc.);
- add malware/virus scanning and content-signature validation for uploads;
- use a migration pipeline rather than `prisma db push`;
- use HTTPS and production cookie/CORS configuration;
- add background thumbnail generation for large media libraries.

## Advanced features not included in this local portfolio build

Real-time collaborative document editing, desktop sync clients, offline sync/conflict resolution, enterprise DLP, malware scanning infrastructure, file-version replacement workflows, billing/plans and an enterprise admin console require additional infrastructure beyond the current single-node Drive clone. The current architecture leaves room to add them without redesigning authentication, metadata or storage boundaries.
