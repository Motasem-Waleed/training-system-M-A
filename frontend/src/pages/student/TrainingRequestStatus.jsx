import { useEffect, useState } from "react";
import { getStudentTrainingRequests, itemsFromPagedResponse } from "../../services/api";

export default function TrainingRequestStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestItem, setRequestItem] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getStudentTrainingRequests();
        const list = itemsFromPagedResponse(res);
        setRequestItem(list[0] || null);
      } catch (e) {
        setError(e?.response?.data?.message || "تعذر تحميل حالة الطلب.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">متابعة حالة طلب التدريب</h1>
        <p className="page-subtitle">عرض الطلب الحالي وحالته والجهة المعتمدة والمشرف إن وجد.</p>
      </div>

      {loading ? <div className="section-card">جاري التحميل...</div> : null}
      {error ? <div className="alert-custom alert-danger">{error}</div> : null}

      {!loading && !error && !requestItem ? (
        <div className="section-card">
          <p className="mb-0">لا يوجد طلب تدريب حالي. يمكنك تقديم طلب جديد من صفحة طلب التدريب.</p>
        </div>
      ) : null}

      {!loading && !error && requestItem ? (
        <div className="section-card">
          <div className="summary-grid">
            <div className="kpi-box">
              <strong>{requestItem.book_status_label || requestItem.book_status || "—"}</strong>
              <span>حالة الطلب</span>
            </div>
            <div className="kpi-box">
              <strong>{requestItem.training_site?.name || "—"}</strong>
              <span>الجهة المعتمدة</span>
            </div>
            <div className="kpi-box">
              <strong>{requestItem.training_site?.location || "—"}</strong>
              <span>المنطقة</span>
            </div>
            <div className="kpi-box">
              <strong>
                {requestItem.students?.[0]?.assigned_teacher?.name || "غير محدد"}
              </strong>
              <span>المشرف/المرشد</span>
            </div>
          </div>

          {(requestItem.rejection_reason || requestItem.coordinator_rejection_reason || requestItem.needs_edit_reason) ? (
            <div className="alert-custom alert-warning mt-3">
              <strong>ملاحظات على الطلب:</strong>{" "}
              {requestItem.rejection_reason || requestItem.coordinator_rejection_reason || requestItem.needs_edit_reason}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
