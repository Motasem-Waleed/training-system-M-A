@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo [1/3] التأكد من وجود ملف SQLite...
if not exist "database\database.sqlite" (type nul > "database\database.sqlite")

echo [2/3] تشغيل الهجرات (إنشاء جداول users وجميع الجداول)...
php artisan migrate --force
if errorlevel 1 (
  echo فشل migrate. تأكد أن PHP في PATH وأنك داخل مجلد backend.
  pause
  exit /b 1
)

echo [3/3] تعبئة البيانات التجريبية (يشمل schoolmanager@hebron.edu / كلمة المرور: password)...
php artisan db:seed --force
if errorlevel 1 (
  echo فشل db:seed.
  pause
  exit /b 1
)

echo.
echo تم. جرّب تسجيل الدخول مرة أخرى.
echo.
pause
