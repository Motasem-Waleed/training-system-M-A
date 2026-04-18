import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { getTasks, itemsFromPagedResponse } from "../../services/api";

export default function MentorTasks() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let m = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getTasks({ per_page: 100 });
        if (m) setItems(itemsFromPagedResponse(res));
      } catch (e) {
        if (m) setError(e?.response?.data?.message || "فشل تحميل المهام");
      } finally {
        if (m) setLoading(false);
      }
    }
    load();
    return () => {
      m = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="المهام"
        subtitle="المهام التي قمت بإسنادها للطلبة ضمن تعيينات التدريب."
      />

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
                <th>العنوان</th>
                <th>الطالب</th>
                <th>تاريخ التسليم</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    لا توجد مهام مسجلة.
                  </td>
                </tr>
              ) : (
                items.map((t) => {
                  const stu = t.training_assignment?.enrollment?.user;
                  return (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>{stu?.name || "—"}</td>
                      <td>{t.due_date || "—"}</td>
                      <td>{t.status_label || t.status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
