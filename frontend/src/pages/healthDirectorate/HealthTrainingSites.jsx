import { useEffect, useState } from "react";
import { getTrainingSites, itemsFromPagedResponse } from "../../services/api";

export default function HealthTrainingSites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getTrainingSites({
          governing_body: "ministry_of_health",
          per_page: 200,
        });
        if (mounted) setItems(itemsFromPagedResponse(res));
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || "تعذر تحميل مواقع التدريب الصحية.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">أماكن التدريب الصحي</h1>
        <p className="page-subtitle">
          مواقع التدريب التابعة لوزارة الصحة / الجهات الصحية المعتمدة.
        </p>
      </div>

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : error ? (
        <div className="section-card">
          <p className="text-danger">{error}</p>
        </div>
      ) : (
        <div className="table-wrapper section-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الموقع</th>
                <th>النوع</th>
                <th>السعة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    لا توجد مواقع مسجلة ضمن نطاق الصحة.
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name || "—"}</td>
                    <td>{s.location || "—"}</td>
                    <td>{s.site_type === "health_center" ? "مركز صحي" : s.site_type || "—"}</td>
                    <td>{s.capacity ?? "—"}</td>
                    <td>{s.is_active ? "نشط" : "غير نشط"}</td>
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
