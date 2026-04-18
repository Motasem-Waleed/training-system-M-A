export default function Navbar({ onMenuClick }) {
  const savedUser = JSON.parse(localStorage.getItem("user")) || {};

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

  const userName = savedUser?.name || "مستخدم النظام";
  const roleKey = savedUser?.role?.name || savedUser?.role;
  const roleName = roleLabels[roleKey] || "بوابة النظام";

  return (
    <header className="top-navbar">
      <div className="navbar-right">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          ☰
        </button>

        <div>
          <h3 className="navbar-title">منصة إدارة التدريب الميداني</h3>
          <p className="navbar-subtitle">
            منصة أكاديمية لمتابعة التدريب العملي والتربوي
          </p>
        </div>
      </div>

      <div className="navbar-left">
        <div className="navbar-chip">
          <span>{userName}</span>
          <span>—</span>
          <span>{roleName}</span>
        </div>
      </div>
    </header>
  );
}