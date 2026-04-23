import NotificationBell from "../../components/common/NotificationBell";
import { getRoleLabel } from "../../utils/roles";
import { readStoredUser } from "../../utils/session";

export default function Navbar({ onMenuClick }) {
  const savedUser = readStoredUser();

  const userName = savedUser?.name || "مستخدم النظام";
  const roleKey = savedUser?.role?.name || savedUser?.role;
  const roleName = getRoleLabel(roleKey);

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
        <NotificationBell />
        <div className="navbar-chip">
          <span>{userName}</span>
          <span>—</span>
          <span>{roleName}</span>
        </div>
      </div>
    </header>
  );
}
