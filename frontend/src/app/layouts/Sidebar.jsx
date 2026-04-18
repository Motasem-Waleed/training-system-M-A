import { NavLink, useNavigate } from "react-router-dom";
import SidebarMenuGlyph from "./SidebarMenuGlyph";

const roleLabels = {
  admin: "مدير النظام",
  coordinator: "المنسق الأكاديمي",
  training_coordinator: "منسق التدريب",
  supervisor: "المشرف الأكاديمي",
  teacher: "المعلم المرشد",
  mentor: "المشرف الميداني",
  psychologist: "الأخصائي النفسي",
  principal: "مدير جهة التدريب",
  school_manager: "مدير جهة التدريب",
  health_directorate: "مديرية الصحة",
  education_directorate: "مديرية التربية والتعليم",
  student: "الطالب المتدرب",
};

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
  ],
  

  supervisor: [
    { name: "الرئيسية", path: "/supervisor/dashboard" },
    { name: "المهام", path: "/supervisor/tasks" },
    { name: "حلول الطلبة", path: "/supervisor/submissions" },
    { name: "السجل اليومي", path: "/supervisor/training-logs" },
    { name: "متابعة الحضور", path: "/supervisor/attendance-follow-up" },
    { name: "الزيارات الميدانية", path: "/supervisor/field-visits" },
    { name: "الشعب", path: "/supervisor/sections" },
    { name: "التقييمات", path: "/supervisor/evaluations" },
    { name: "التقارير", path: "/supervisor/reports" },
  ],

  mentor: [
    { name: "الرئيسية", path: "/mentor/dashboard" },
    { name: "طلبة التدريب", path: "/mentor/students" },
    { name: "المهام", path: "/mentor/tasks" },
    { name: "الحضور", path: "/mentor/attendance" },
    { name: "التقييمات", path: "/mentor/evaluations" },
    { name: "الجدول الأسبوعي", path: "/mentor/schedule" },
  ],

  psychologist: [
    { name: "الرئيسية", path: "/psychologist/dashboard" },
    { name: "الطلبة", path: "/psychologist/students" },
    { name: "الإرشاد والدعم", path: "/psychologist/guidance" },
    { name: "الإشعارات", path: "/notifications" },
  ],

  student: [
    { name: "الرئيسية", path: "/student/dashboard" },
    { name: "طلب التدريب", path: "/student/training-request" },
    { name: "برنامج التدريب", path: "/student/schedule" },
    { name: "سجل التدريب اليومي", path: "/student/training-log" },
    { name: "الملف الإنجازي", path: "/student/portfolio" },
    { name: "التكليفات", path: "/student/assignments" },
    { name: "الإشعارات", path: "/student/notifications-updates" },
  ],

  coordinator: [
    { name: "الرئيسية", path: "/coordinator/dashboard" },
    { name: "الطلبة", path: "/coordinator/students" },
    { name: "التوزيع", path: "/coordinator/distribution" },
    { name: "الإحصائيات", path: "/coordinator/statistics" },
  ],

  school_manager: [
    { name: "الرئيسية", path: "/principal/dashboard" },
    { name: "الملف الشخصي", path: "/principal/profile" },
    { name: "تعيين المعلم المرشد", path: "/principal/mentor-assignment" },
    { name: "الطلبة المتدربون", path: "/principal/trainee-students" },
    { name: "الكتب الرسمية", path: "/principal/official-letters" },
  ],

  principal: [
    { name: "الرئيسية", path: "/principal/dashboard" },
    { name: "الملف الشخصي", path: "/principal/profile" },
    { name: "تعيين المعلم المرشد", path: "/principal/mentor-assignment" },
    { name: "الطلبة المتدربون", path: "/principal/trainee-students" },
    { name: "الكتب الرسمية", path: "/principal/official-letters" },
  ],

  health_directorate: [
    { name: "الرئيسية", path: "/health/dashboard" },
    { name: "أماكن التدريب", path: "/health/training-sites" },
  ],

  education_directorate: [
    { name: "الرئيسية", path: "/education/dashboard" },
    { name: "أماكن التدريب", path: "/education/training-sites" },
    { name: "الكتب الرسمية", path: "/education/official-letters" },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem("user")) || {};
  const rawRole = savedUser?.role?.name || savedUser?.role || "admin";
  const role =
    rawRole === "training_coordinator"
      ? "coordinator"
      : rawRole === "teacher"
        ? "mentor"
        : rawRole;
  const userName = savedUser?.name || "مستخدم تجريبي";
const roleName = roleLabels[rawRole] || roleLabels[role] || "مستخدم النظام";
const menu = menus[role] || [];

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

        {menu.map((item) => (
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