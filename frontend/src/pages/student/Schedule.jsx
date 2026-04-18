import { useCallback, useEffect, useMemo, useState } from "react";
import { getStudentSchedule, itemsFromPagedResponse } from "../../services/api";

const dayLabels = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
};

export default function Schedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    school_name: null,
    mentor_name: null,
    period_name: null,
    period_start: null,
    period_end: null,
    message: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentSchedule();
      setRows(itemsFromPagedResponse(res));
      setMeta({
        school_name: res?.meta?.school_name ?? null,
        mentor_name: res?.meta?.mentor_name ?? null,
        period_name: res?.meta?.period_name ?? null,
        period_start: res?.meta?.period_start ?? null,
        period_end: res?.meta?.period_end ?? null,
        message: res?.meta?.message ?? null,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل جدول التدريب.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatTime = (t) => {
    if (!t) return "—";
    const s = String(t);
    return s.length >= 5 ? s.slice(0, 5) : s;
  };

  const displayDay = (row) => row.day_label || dayLabels[row.day] || row.day || "—";

  const summary = useMemo(() => {
    const slots = rows.length;
    return { slots };
  }, [rows]);

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">برنامج التدريب</h1>
        <p className="page-subtitle">
          الجدول الأسبوعي المعتمد من المعلم المرشد في جهة التدريب (قراءة من النظام).
        </p>
      </div>

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : error ? (
        <div className="section-card">
          <p className="text-danger">{error}</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid mb-3">
            <div className="stat-card primary">
              <div className="stat-title">حصص في الجدول</div>
              <div className="stat-value">{summary.slots}</div>
              <div className="stat-meta">عدد الفترات المسجّلة هذا الأسبوع</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-title">جهة التدريب</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>
                {meta.school_name || "—"}
              </div>
              <div className="stat-meta">المدرسة / المركز</div>
            </div>
            <div className="stat-card success">
              <div className="stat-title">المعلم المرشد</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>
                {meta.mentor_name || "—"}
              </div>
              <div className="stat-meta">متابعة ميدانية</div>
            </div>
            <div className="stat-card info">
              <div className="stat-title">الفترة التدريبية</div>
              <div className="stat-value" style={{ fontSize: "1rem" }}>
                {meta.period_name || "—"}
              </div>
              <div className="stat-meta">
                {meta.period_start && meta.period_end
                  ? `${meta.period_start} — ${meta.period_end}`
                  : "التواريخ"}
              </div>
            </div>
          </div>

          {meta.message ? (
            <div className="alert-custom alert-info mb-3">{meta.message}</div>
          ) : null}

          <div className="section-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">الجدول الأسبوعي</h3>
                <p className="panel-subtitle">أيام وساعات التدريب حسب ما أدخله المرشد.</p>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>اليوم</th>
                    <th>من</th>
                    <th>إلى</th>
                    <th>المعلم</th>
                    <th>المكان</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center">
                        {meta.message || "لا توجد فترات في الجدول بعد."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td>{displayDay(r)}</td>
                        <td>{formatTime(r.start_time)}</td>
                        <td>{formatTime(r.end_time)}</td>
                        <td>{r.teacher?.name || r.teacher?.data?.name || "—"}</td>
                        <td>{r.training_site?.name || r.training_site?.data?.name || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-muted small mt-2">
            لتسجيل أنشطة اليوم التفصيلية استخدم «سجل التدريب اليومي» من القائمة.
          </p>
        </>
      )}
    </>
  );
}
