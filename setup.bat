@echo off
echo ============================================
echo       ERP Zidan - Setup Script
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Installing dependencies...
npm install
if errorlevel 1 (
  echo ERROR: npm install failed
  pause
  exit /b 1
)

echo.
echo [2/4] Generating Prisma client...
npx prisma generate
if errorlevel 1 (
  echo ERROR: Prisma generate failed
  pause
  exit /b 1
)

echo.
echo [3/4] Running database migrations...
npx prisma migrate dev --name init
if errorlevel 1 (
  echo ERROR: Migration failed
  pause
  exit /b 1
)

echo.
echo [4/4] Seeding sample data...
npx tsx prisma/seed.ts
if errorlevel 1 (
  echo WARNING: Seed failed (optional)
)

echo.
echo ============================================
echo   Setup complete! Starting dev server...
echo   Open: http://localhost:3000
echo ============================================
echo.
npm run dev
