import { useEffect, useState } from "react";
import { getUsers, itemsFromPagedResponse } from "../../services/api";

export default function CoordinatorStudents() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getUsers({
          per_page: 100,
          status: "active",
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        });
        if (mounted) setItems(itemsFromPagedResponse(res));
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || "فشل تحميل الطلبة");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch]);

  return (
    <div className="users-list">
      <div className="page-header">
        <div>
          <h1>الطلبة</h1>
          <p>قائمة الطلبة المتاحين للتوزيع على جهات التدريب.</p>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="بحث بالاسم أو البريد أو الرقم الجامعي"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : error ? (
        <div className="section-card">
          <p className="text-danger">{error}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الرقم الجامعي</th>
                <th>القسم</th>
                <th>البريد</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    لا يوجد طلبة
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.university_id || "—"}</td>
                    <td>{u.department?.name || "—"}</td>
                    <td>{u.email}</td>
                    <td>{u.status === "active" ? "نشط" : u.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

