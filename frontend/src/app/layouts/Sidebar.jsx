import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import SidebarMenuGlyph from "./SidebarMenuGlyph";
import { checkFeatureFlag } from "../../services/api";

const roleLabels = {
  admin: "مدير النظام",
  coordinator: "المنسق الأكاديمي",
  training_coordinator: "منسق التدريب",
  supervisor: "المشرف الأكاديمي",
  teacher: "المعلم المرشد",
  mentor: "المشرف الميداني",
  field_supervisor: "المشرف الميداني",
  psychologist: "الأخصائي النفسي",
  principal: "مدير المدرسة",
  school_manager: "مدير المدرسة",
  psychology_center_manager: "مدير المركز النفسي",
  health_directorate: "مديرية الصحة",
  education_directorate: "مديرية التربية والتعليم",
  student: "الطالب المتدرب",
};

const menuFeatureMap = {
  "/student/training-request": "training_requests.create",
  "/field-staff/tasks": "tasks.create",
  "/admin/announcements": "announcements.create",
};

/** القائمة الموحدة للكادر الميداني — نفس العناصر مع Conditional Rendering */
function buildFieldStaffMenu(roleKey) {
  // الصفحات الموحدة الأساسية لكل الكادر الميداني
  const menu = [
    { name: "الرئيسية", path: "/field-staff/dashboard" },
    { name: "ملفات الطلبة", path: "/field-staff/students" },
    { name: "التقييمات", path: "/field-staff/evaluations" },
    { name: "الملاحظات", path: "/field-staff/notes" },
  ];

  // المهام والسجلات اليومية والتقييم النهائي: للمعلم والمشرف الأكاديمي والمشرف الميداني
  if (roleKey === "mentor" || roleKey === "supervisor" || roleKey === "field_supervisor") {
    menu.push(
      { name: "المهام", path: "/field-staff/tasks" },
      { name: "السجلات اليومية", path: "/field-staff/daily-reports" },
      { name: "التقييم النهائي", path: "/field-staff/final-evaluation" },
    );
  }

  // الإرشاد النفسي: للأخصائي النفسي فقط
  if (roleKey === "psychologist") {
    menu.push({ name: "الإرشاد والدعم", path: "/field-staff/guidance" });
  }

  // صفحات خاصة بالمشرف الأكاديمي
  if (roleKey === "supervisor") {
    // إضافة مساحة العمل الموحدة في البداية
    menu.unshift({ name: "🏠 مساحة العمل", path: "/supervisor/workspace" });
    menu.push(
      { name: "الزيارات الميدانية", path: "/supervisor/field-visits" },
      { name: "الشعب", path: "/supervisor/sections" },
      { name: "حلول الطلبة", path: "/supervisor/submissions" },
    );
  }

  // الجدول الأسبوعي: للمعلم فقط
  if (roleKey === "mentor") {
    menu.push(
      { name: "الحضور", path: "/mentor/attendance" },
      { name: "الجدول الأسبوعي", path: "/mentor/schedule" },
    );
  }

  menu.push({ name: "الإشعارات", path: "/notifications" });
  return menu;
}

const menus = {
  admin: [
    { name: "الرئيسية", path: "/dashboard" },
    
    // إدارة المستخدمين والصلاحيات
    { name: "إدارة المستخدمين", path: "/admin/users" },
    { name: "إدارة الأدوار", path: "/admin/roles" },
    { name: "إدارة الصلاحيات", path: "/admin/permissions" },
    
    // إدارة الهيكل الأكاديمي
    { name: "إدارة الأقسام", path: "/admin/departments" },
    { name: "إدارة المساقات", path: "/admin/courses" },
    { name: "إدارة الشعب", path: "/admin/sections" },
    { name: "تسجيل الطلاب في الشعب", path: "/admin/enrollments" },
    
    // إدارة التدريب الميداني
    { name: "إدارة مواقع التدريب", path: "/admin/training-sites" },
    { name: "إدارة الفترات التدريبية", path: "/admin/training-periods" },
    
    // إدارة المحتوى والإشعارات
    { name: "إدارة الإعلانات", path: "/admin/announcements" },
    { name: "إدارة قوالب التقييم", path: "/admin/evaluation-templates" },
    
    // إدارة النظام
    { name: "النسخ الاحتياطي", path: "/admin/backups" },
    { name: "سجل النشاطات", path: "/admin/activity-logs" },
    { name: "الميزات الديناميكية", path: "/admin/feature-flags" },
    
    // تقارير
    { name: "التقارير", path: "/reports" },

    // صفحات مشتركة
    { name: "الملف الشخصي", path: "/profile" },
    { name: "تغيير كلمة المرور", path: "/change-password" },
    { name: "الإشعارات", path: "/notifications" },
  ],
  

  // الكادر الميداني الموحد — يُبنى ديناميكياً حسب الدور
  mentor: buildFieldStaffMenu("mentor"),
  psychologist: buildFieldStaffMenu("psychologist"),
  supervisor: buildFieldStaffMenu("supervisor"),
  
  // المشرف الميداني — يستخدم نفس قائمة الكادر الميداني
  field_supervisor: buildFieldStaffMenu("field_supervisor"),

  student: [
    { name: "الرئيسية", path: "/student/dashboard" },
    { name: "طلب التدريب", path: "/student/training-request" },
    { name: "برنامج التدريب", path: "/student/schedule" },
    { name: "سجل الحضور والغياب", path: "/student/attendance" },
    { name: "سجل التدريب اليومي", path: "/student/training-log" },
    { name: "الملف الإنجازي", path: "/student/portfolio" },
    { name: "التكليفات", path: "/student/assignments" },
    { name: "النماذج الإلكترونية", path: "/student/e-forms" },
    { name: "الإشعارات", path: "/student/notifications-updates" },
  ],

  coordinator: [
    { name: "الرئيسية", path: "/coordinator/dashboard" },
    { name: "الطلبة", path: "/coordinator/students" },
    { name: "طلبات التدريب", path: "/coordinator/training-requests" },
    { name: "التوزيع", path: "/coordinator/distribution" },
    { name: "الإحصائيات", path: "/coordinator/statistics" },
    { name: "التحكم ببرنامج التدريب", path: "/coordinator/training-program-control" },
  ],

  principal: [
    { name: "الرئيسية", path: "/principal/dashboard" },
    { name: "الملف الشخصي", path: "/principal/profile" },
    { name: "طلبات التدريب", path: "/principal/mentor-assignment" },
    { name: "الطلبة المتدربون", path: "/principal/trainee-students" },
  ],

  psychology_center_manager: [
    { name: "الرئيسية", path: "/psychology-center/dashboard" },
    { name: "الملف الشخصي", path: "/psychology-center/profile" },
    { name: "طلبات التدريب", path: "/psychology-center/mentor-assignment" },
    { name: "المتدربون في المركز", path: "/psychology-center/trainee-students" },
  ],

  health_directorate: [
    { name: "الرئيسية", path: "/health/dashboard" },
    { name: "أماكن التدريب", path: "/health/training-sites" },
    { name: "الكتب الرسمية", path: "/health/official-letters" },
  ],

  education_directorate: [
    { name: "الرئيسية", path: "/education/dashboard" },
    { name: "أماكن التدريب", path: "/education/training-sites" },
    { name: "الكتب الرسمية", path: "/education/official-letters" },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [featureFlags, setFeatureFlags] = useState({});
  const savedUser = JSON.parse(localStorage.getItem("user")) || {};
  const rawRole = savedUser?.role?.name || savedUser?.role || "admin";
  const role =
    rawRole === "training_coordinator"
      ? "coordinator"
      : rawRole === "teacher"
        ? "mentor"
        : rawRole === "psychology_center_manager"
          ? "psychology_center_manager"
          : rawRole === "academic_supervisor"
            ? "supervisor"
            : rawRole === "school_manager"
              ? "principal"
              : rawRole;
  const userName = savedUser?.name || "مستخدم تجريبي";
const roleName = roleLabels[rawRole] || roleLabels[role] || "مستخدم النظام";
  const menu = menus[role] || [];

  useEffect(() => {
    let isMounted = true;
    const featureNames = [...new Set(Object.values(menuFeatureMap))];
    Promise.all(
      featureNames.map((name) =>
        checkFeatureFlag(name)
          .then((res) => [name, Boolean(res?.is_open)])
          .catch(() => [name, false])
      )
    )
      .then((entries) => {
        if (!isMounted) return;
        const normalized = entries.reduce((acc, [name, isOpen]) => {
          acc[name] = isOpen;
          return acc;
        }, {});
        setFeatureFlags(normalized);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleMenu = useMemo(
    () =>
      menu.filter((item) => {
        const featureName = menuFeatureMap[item.path];
        if (!featureName) return true;
        return featureFlags[featureName] === true;
      }),
    [menu, featureFlags]
  );

  const getInitials = (name) => {
    if (!name) return "HU";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return `${parts[0][0]}${parts[1][0]}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-mobile-header">
        <button className="sidebar-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="sidebar-brand">
        <h2>جامعة الخليل</h2>
        <p>منصة إدارة التدريب الميداني</p>
      </div>

      <div className="sidebar-menu">
        <div className="sidebar-section-title">القائمة الرئيسية</div>

        {visibleMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <SidebarMenuGlyph path={item.path} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-box">
          <div className="sidebar-user-avatar">{getInitials(userName)}</div>

          <div>
            <strong>{userName}</strong>
            <span>{roleName}</span>
          </div>
        </div>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          تسجيل الخروج
        </button>

        <p>البوابة الأكاديمية لإدارة التدريب العملي والتربوي</p>
      </div>
    </aside>
  );
}