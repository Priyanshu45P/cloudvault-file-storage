# Run CloudVault on Windows

## First time only

Open PowerShell in the extracted `cloudvault` folder and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup-windows.ps1
```

The script starts PostgreSQL, installs backend/frontend packages, generates Prisma Client, applies the database schema and optionally seeds demo accounts.

## Start later

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-cloudvault.ps1
```

It opens backend and frontend development servers in separate PowerShell windows.

Open `http://localhost:5173`.

## Demo login

- `alice@cloudvault.dev` / `Password123!`
- `bob@cloudvault.dev` / `Password123!`

## Manual start

PostgreSQL:

```powershell
docker compose up -d postgres
```

Backend:

```powershell
cd backend
npm run dev
```

Frontend (new terminal):

```powershell
cd frontend
npm run dev
```
