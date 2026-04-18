import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { getUsers, itemsFromPagedResponse } from "../../services/api";

export default function PsychologistStudents() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let m = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getUsers({
          per_page: 100,
          status: "active",
          ...(debounced ? { search: debounced } : {}),
        });
        if (m) setItems(itemsFromPagedResponse(res));
      } catch (e) {
        if (m) setError(e?.response?.data?.message || "فشل تحميل الطلبة");
      } finally {
        if (m) setLoading(false);
      }
    }
    load();
    return () => {
      m = false;
    };
  }, [debounced]);

  return (
    <>
      <PageHeader
        title="الطلبة"
        subtitle="قائمة الطلبة النشطين للاطلاع الإرشادي — البيانات الأكاديمية التفصيلية تبقى عند الجهات المختصة."
      />

      <div className="filters-bar" style={{ marginBottom: 16 }}>
        <input
          className="form-control-custom search-input"
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
                <th>البريد</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    لا يوجد طلبة.
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.university_id || "—"}</td>
                    <td>{u.email}</td>
                    <td>{u.status_label || u.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
