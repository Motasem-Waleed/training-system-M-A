# Training System M-A

منصة لإدارة التدريب الميداني في جامعة الخليل، تغطي دورة العمل من تقديم طلب التدريب وحتى المتابعة اليومية والتقييم والمراسلات الرسمية.

## نظرة عامة

النظام يدعم عدة أدوار داخل نفس المنصة، أهمها:

- `admin`
- `student`
- `training_coordinator`
- `academic_supervisor`
- `teacher`
- `field_supervisor`
- `school_manager`
- `psychology_center_manager`
- `education_directorate`
- `health_directorate`
- `psychologist`

المنصة لا تقتصر على إدارة الطلبات فقط، بل تشمل أيضًا:

- طلبات التدريب وسير الموافقات
- توزيع الطلبة على جهات التدريب
- الحضور والسجلات اليومية
- المهام والتسليمات
- التقييمات الأكاديمية والميدانية
- الملف الإنجازي
- الزيارات الميدانية
- الإشعارات
- الكتب الرسمية
- النسخ الاحتياطي وسجل النشاطات

## هيكل المشروع

```text
training-system-M-A/
├─ backend/    # Laravel 12 API
├─ frontend/   # React + Vite
├─ Project.docx
├─ بيانات المدارس الحكومية - الخليل.csv
└─ ملفات وبيانات مساعدة أخرى
```

## المعمارية

### Backend

الخلفية مبنية باستخدام:

- `PHP 8.2`
- `Laravel 12`
- `Laravel Sanctum`
- `SQLite` افتراضيًا
- `spatie/laravel-permission`

نقاط مهمة:

- جميع المسارات الأساسية موجودة في `backend/routes/api.php`
- منطق الأعمال موزع بين `Controllers`, `Services`, `Policies`, و`Requests`
- توجد `Seeders` غنية لتجهيز بيانات تجريبية قريبة من الواقع

### Frontend

الواجهة مبنية باستخدام:

- `React`
- `Vite`
- `React Router`
- `Axios`
- `Bootstrap`
- `Chart.js`

نقاط مهمة:

- التوجيه الرئيسي موجود في `frontend/src/router/index.jsx`
- تكوين الاتصال مع الـ API موجود في `frontend/src/services/api.js`
- توجد طبقات مساعدة لتوحيد الأدوار والجلسة والحالات في:
  - `frontend/src/utils/roles.js`
  - `frontend/src/utils/session.js`
  - `frontend/src/utils/status.js`

## سير العمل الرئيسي

أهم تدفق داخل النظام هو:

1. الطالب يقدّم طلب تدريب.
2. منسق التدريب يراجع الطلب.
3. يتم الإرسال إلى المديرية أو الجهة الرسمية.
4. تصدر الموافقة أو الرفض.
5. يُرسل الطلب إلى جهة التدريب.
6. مدير الجهة يعتمد الطلب ويعيّن المرشد/المشرف.
7. يبدأ التنفيذ عبر الحضور، السجلات، المهام، التقييمات، والمتابعة.

## التشغيل المحلي

## 1. تشغيل الخلفية

من داخل `backend/`:

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

إذا كنت تستخدم SQLite:

- الملف الافتراضي هو `backend/database/database.sqlite`
- ملف `.env.example` مهيأ لذلك افتراضيًا

يمكن أيضًا استخدام سكربت Composer:

```bash
composer run db:init
```

أو:

```bash
composer run dev
```

هذا يشغّل:

- خادم Laravel
- الـ queue listener
- الـ logs
- Vite الخاص بالـ backend إن لزم

## 2. تشغيل الواجهة

من داخل `frontend/`:

```bash
npm install
copy .env.example .env
npm run dev
```

القيمة الافتراضية في `frontend/.env.example` هي:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## بيانات البيئة

### Backend

ملف `backend/.env.example` مضبوط افتراضيًا على:

- `APP_ENV=local`
- `APP_DEBUG=true`
- `DB_CONNECTION=sqlite`
- `QUEUE_CONNECTION=database`
- `SESSION_DRIVER=database`

### Frontend

المتغير الأساسي:

- `VITE_API_BASE_URL`

## البيانات التجريبية

ملف `DatabaseSeeder` يشغّل عددًا كبيرًا من الـ seeders، منها:

- `RoleSeeder`
- `DepartmentSeeder`
- `CoursesSeeder`
- `TrainingPeriodsSeeder`
- `TrainingSitesSeeder`
- `UsersSeeder`
- `StudentsSeeder`
- `SectionsSeeder`
- `EnrollmentsSeeder`
- `DemoDataSeeder`
- `OfficialLettersSeeder`
- `FeatureFlagsSeeder`
- `FieldSupervisorSeeder`
- `AcademicSupervisorWorkspaceSeeder`

هذا يعني أن قاعدة البيانات بعد `db:seed` تحتوي على:

- أدوار جاهزة
- مستخدمين تجريبيين
- طلبات تدريب
- تعيينات
- حضور
- سجلات يومية
- تقييمات
- كتب رسمية
- بيانات خاصة بالمشرفين

## حسابات تجريبية

بحسب `backend/database/seeders/UsersSeeder.php`، توجد حسابات جاهزة مثل:

| الدور | البريد | كلمة المرور |
|---|---|---|
| مدير النظام | `admin@hebron.edu` | `password` |
| منسق تدريب أصول التربية | `coordinator.tarbiah@hebron.edu` | `password` |
| منسق تدريب علم النفس | `coordinator.psychology@hebron.edu` | `password` |
| مشرف أكاديمي | `supervisor@hebron.edu` | `password` |
| معلم مرشد | `teacher@hebron.edu` | `password` |
| طالب | `student@hebron.edu` | `password` |
| مدير مدرسة | `schoolmanager@hebron.edu` | `password` |
| أخصائي نفسي | `psychologist@hebron.edu` | `password` |
| مديرية التربية | `edudirectorate@hebron.edu` | `password` |
| مديرية الصحة | `healthdirectorate@hebron.edu` | `password` |
| مدير المركز النفسي | `psychcentermanager@hebron.edu` | `password` |

ملاحظات:

- توجد أيضًا حسابات إضافية لمديريات ومديري مدارس متعددة داخل الـ seeder
- بعض الحسابات مربوطة بجهات تدريب محددة لاختبار المسارات الواقعية

## أهم الملفات

### Backend

- `backend/routes/api.php`
- `backend/app/Http/Controllers/Api/`
- `backend/app/Services/`
- `backend/app/Models/`
- `backend/database/migrations/`
- `backend/database/seeders/`

### Frontend

- `frontend/src/router/index.jsx`
- `frontend/src/services/api.js`
- `frontend/src/app/layouts/`
- `frontend/src/pages/`
- `frontend/src/hooks/`
- `frontend/src/utils/`

## ملاحظات تطوير

- النظام ما زال يحتوي على أجزاء قيد التوحيد بين أسماء الأدوار القديمة والجديدة
- توجد بيانات عربية كثيرة، لذلك يفضّل التأكد دائمًا أن الملفات محفوظة بترميز `UTF-8`
- بعض الصفحات القديمة ما زالت موجودة للتوافق، بينما الاتجاه الحالي يميل إلى توحيد الواجهات حسب الدور

## اقتراحات قبل النشر أو التسليم

- توحيد جميع أسماء الأدوار على مستوى الواجهة والخلفية
- توسيع استخدام طبقات `roles`, `session`, `status`
- كتابة اختبارات للمسارات الحرجة مثل:
  - تسجيل الدخول
  - إنشاء طلب تدريب
  - مراجعة المنسق
  - موافقة المديرية
  - موافقة جهة التدريب
  - إنشاء `TrainingAssignment`

## ملاحظات أخيرة

المشروع غني وظيفيًا، وأقرب إلى نظام تشغيلي فعلي من كونه نموذج CRUD بسيط. أفضل نقطة انطلاق لأي تطوير جديد هي فهم مسار طلب التدريب أولًا، ثم التوسع لباقي الوحدات.
