import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { getEvaluations, itemsFromPagedResponse } from "../../services/api";

export default function MentorEvaluations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let m = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getEvaluations({ per_page: 100 });
        if (m) setItems(itemsFromPagedResponse(res));
      } catch (e) {
        if (m) setError(e?.response?.data?.message || "فشل تحميل التقييمات");
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
        title="التقييمات"
        subtitle="التقييمات التي قمت بها كمقيم ميداني لطلبة التدريب."
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
                <th>الطالب</th>
                <th>القالب</th>
                <th>المجموع</th>
                <th>تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    لا توجد تقييمات.
                  </td>
                </tr>
              ) : (
                items.map((ev) => {
                  const stu = ev.training_assignment?.enrollment?.user;
                  return (
                    <tr key={ev.id}>
                      <td>{stu?.name || "—"}</td>
                      <td>{ev.template?.name || "—"}</td>
                      <td>{ev.total_score ?? "—"}</td>
                      <td>{ev.created_at || "—"}</td>
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
