import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUsers, deleteUser, changeUserStatus } from "../../../services/api";

export default function UsersList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ role_id: "", status: "", search: "" });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [perPage, setPerPage] = useState(10);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );
      const response = await getUsers({
        ...cleanFilters,
        page,
        per_page: perPage,
      });

      const usersData = response.data?.data ?? response.data ?? [];
      setUsers(usersData);

      setPagination({
        current_page: response.data?.current_page ?? response.current_page ?? 1,
        last_page: response.data?.last_page ?? response.last_page ?? 1,
        per_page: response.data?.per_page ?? response.per_page ?? perPage,
        total: response.data?.total ?? response.total ?? 0,
      });
      setError("");
    } catch (err) {
      console.error(err);
      setError("فشل تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [filters, perPage, location.key]);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.last_page) return;
    fetchUsers(page);
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        await deleteUser(id);
        fetchUsers(pagination.current_page);
      } catch (err) {
        alert("حدث خطأ أثناء الحذف");
      }
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await changeUserStatus(id, newStatus);
      fetchUsers(pagination.current_page);
    } catch (err) {
      alert("حدث خطأ أثناء تغيير الحالة");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active": return <span className="badge-success">نشط</span>;
      case "inactive": return <span className="badge-warning">غير نشط</span>;
      case "suspended": return <span className="badge-danger">موقوف</span>;
      default: return <span>{status}</span>;
    }
  };

  const getEditPath = (user) => {
    const roleName = user.role?.name?.toLowerCase() || "";
    switch (roleName) {
      case "student": return `/admin/users/edit/student/${user.id}`;
      case "admin": return `/admin/users/edit/admin/${user.id}`;
      case "teacher": return `/admin/users/edit/teacher/${user.id}`;
      case "school_manager": return `/admin/users/edit/schoolmanager/${user.id}`;
      case "adviser": return `/admin/users/edit/counselor/${user.id}`;
      case "psychologist": return `/admin/users/edit/psychologist/${user.id}`;
      case "academic_supervisor": return `/admin/users/edit/academic-supervisor/${user.id}`;
      default: return `/admin/users/edit/student/${user.id}`;
    }
  };

  if (loading) return <div className="text-center">جاري التحميل...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="users-list">
      <div className="page-header">
        <h1>إدارة المستخدمين</h1>
        <div className="add-buttons-group">
          <button onClick={() => navigate("/admin/users/add/student")} className="btn-primary">+ إضافة طالب</button>
          <button onClick={() => navigate("/admin/users/add/schoolmanager")} className="btn-primary">+ إضافة مدير مدرسة</button>
          <button onClick={() => navigate("/admin/users/add/teacher")} className="btn-primary">+ إضافة معلم</button>
          <button onClick={() => navigate("/admin/users/add/counselor")} className="btn-primary">+ إضافة مرشد</button>
          <button onClick={() => navigate("/admin/users/add/psychologist")} className="btn-primary">+ إضافة أخصائي نفسي</button>
          <button onClick={() => navigate("/admin/users/add/academic-supervisor")} className="btn-primary">+ إضافة مشرف أكاديمي</button>
        </div>
      </div>

      {/* فلاتر البحث */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="بحث بالاسم أو البريد..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.role_id}
          onChange={(e) => setFilters({ ...filters, role_id: e.target.value })}
        >
          <option value="">جميع الأدوار</option>
          <option value="1">مدير النظام</option>
          <option value="2">طالب</option>
          <option value="3">معلم</option>
          <option value="4">مدير مدرسة</option>
          <option value="5">مرشد</option>
          <option value="6">أخصائي نفسي</option>
          <option value="7">مشرف أكاديمي</option>
          <option value="8">منسق تدريب</option>
          <option value="9">مديرية تربية</option>
          <option value="10">وزارة الصحة</option>
          <option value="11">رئيس قسم</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="suspended">موقوف</option>
        </select>
      </div>

      {/* جدول المستخدمين */}
      <table className="data-table">
        <thead>
          <tr>
            <th>المعرف الجامعي</th>
            <th>الاسم</th>
            <th>البريد الإلكتروني</th>
            <th>الدور</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.university_id || "—"}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role?.name || "—"}</td>
              <td>{getStatusBadge(user.status)}</td>
              <td>
                <Link to={getEditPath(user)} className="btn-sm">تعديل</Link>
                <button onClick={() => handleStatusChange(user.id, user.status)} className="btn-sm">
                  {user.status === "active" ? "تعليق" : "تفعيل"}
                </button>
                <button onClick={() => handleDelete(user.id)} className="btn-sm danger">حذف</button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan="6" className="text-center">لا يوجد مستخدمون</td></tr>
          )}
        </tbody>
      </table>

      {/* عناصر التصفح */}
      {pagination.last_page > 1 && (
        <div className="pagination">
          <button
            onClick={() => goToPage(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
          >
            &laquo; السابق
          </button>
          <span>
            الصفحة {pagination.current_page} من {pagination.last_page}
            (إجمالي {pagination.total} مستخدم)
          </span>
          <button
            onClick={() => goToPage(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.last_page}
          >
            التالي &raquo;
          </button>
        </div>
      )}
    </div>
  );
}