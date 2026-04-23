import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { getUsers, itemsFromPagedResponse } from "../../services/api";
import EmptyState from "../../components/common/EmptyState";

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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUsers({
        per_page: 100,
        status: "active",
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setItems(itemsFromPagedResponse(res));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل الطلبة");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="users-list">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>الطلبة</h1>
            <p>قائمة الطلبة المتاحين للتوزيع على جهات التدريب.</p>
          </div>
          <button
            className="btn-secondary"
            onClick={load}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            تحديث
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="بحث بالاسم أو البريد أو الرقم الجامعي"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {error && (
        <div className="section-card" style={{ marginBottom: 12 }}>
          <p className="text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <EmptyState title="لا يوجد طلبة" description="لا يوجد طلبة مطابقون للبحث." />
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
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.university_id || "—"}</td>
                  <td>{u.department?.name || "—"}</td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      style={{
                        background: u.status === "active" ? "#d4edda" : "#e9ecef",
                        color: u.status === "active" ? "#155724" : "#495057",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                    >
                      {u.status === "active" ? "نشط" : u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

