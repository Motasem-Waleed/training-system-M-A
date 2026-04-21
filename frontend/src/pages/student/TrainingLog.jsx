import { useCallback, useEffect, useState } from "react";
import {
  createStudentTrainingLog,
  getStudentTrainingLogs,
  itemsFromPagedResponse,
  submitStudentTrainingLog,
  updateStudentTrainingLog,
} from "../../services/api";

function timeForInput(v) {
  if (!v) return "";
  const s = String(v);
  if (s.length >= 5) return s.slice(0, 5);
  return s;
}

export default function TrainingLog() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logs, setLogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    log_date: "",
    start_time: "",
    end_time: "",
    activities_performed: "",
    student_reflection: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentTrainingLogs();
      const list = Array.isArray(res) ? res : itemsFromPagedResponse(res);
      setLogs(list);
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل السجل.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({
      log_date: "",
      start_time: "",
      end_time: "",
      activities_performed: "",
      student_reflection: "",
    });
    setEditingId(null);
  };

  const startEdit = (log) => {
    setEditingId(log.id);
    setForm({
      log_date: log.log_date || "",
      start_time: timeForInput(log.start_time),
      end_time: timeForInput(log.end_time),
      activities_performed: log.activities_performed || "",
      student_reflection: log.student_reflection || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = {
        log_date: form.log_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        activities_performed: form.activities_performed,
        student_reflection: form.student_reflection || null,
      };
      if (editingId) {
        await updateStudentTrainingLog(editingId, payload);
        setSuccess("تم تحديث السجل.");
      } else {
        await createStudentTrainingLog(payload);
        setSuccess("تم إضافة يوم تدريب.");
      }
      resetForm();
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || "فشل الحفظ.");
    }
  };

  const handleSubmitLog = async (id) => {
    if (!window.confirm("إرسال السجل للمراجعة؟ لن يمكن تعديله بسهولة بعد الإرسال.")) return;
    setError("");
    try {
      await submitStudentTrainingLog(id);
      setSuccess("تم إرسال السجل.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل الإرسال.");
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">سجل التدريب اليومي</h1>
        <p className="page-subtitle">تسجيل أنشطة كل يوم تدريبي ومتابعة حالة المراجعة</p>
      </div>

      {success ? (
        <div className="alert-custom alert-success mb-3">{success}</div>
      ) : null}
      {error ? (
        <div className="alert-custom alert-danger mb-3">{error}</div>
      ) : null}

      <div className="section-card mb-3">
        <h4>{editingId ? "تعديل سجل" : "إضافة سجل يوم جديد"}</h4>
        <form onSubmit={handleSave} className="row g-3">
          <div className="col-md-4">
            <label className="form-label-custom">تاريخ اليوم</label>
            <input
              type="date"
              className="form-control-custom"
              required
              value={form.log_date}
              onChange={(e) => setForm((f) => ({ ...f, log_date: e.target.value }))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label-custom">من (اختياري)</label>
            <input
              type="time"
              className="form-control-custom"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label-custom">إلى (اختياري)</label>
            <input
              type="time"
              className="form-control-custom"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
            />
          </div>
          <div className="col-12">
            <label className="form-label-custom">الأنشطة المنفذة</label>
            <textarea
              className="form-control-custom"
              rows={3}
              required
              value={form.activities_performed}
              onChange={(e) => setForm((f) => ({ ...f, activities_performed: e.target.value }))}
            />
          </div>
          <div className="col-12">
            <label className="form-label-custom">تأمل الطالب (اختياري)</label>
            <textarea
              className="form-control-custom"
              rows={2}
              value={form.student_reflection}
              onChange={(e) => setForm((f) => ({ ...f, student_reflection: e.target.value }))}
            />
          </div>
          <div className="col-12 d-flex gap-2 flex-wrap">
            <button type="submit" className="btn-primary-custom">
              {editingId ? "حفظ التعديل" : "حفظ السجل"}
            </button>
            {editingId ? (
              <button type="button" className="btn-secondary-custom" onClick={resetForm}>
                إلغاء التعديل
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {/* Weekly Training Schedule */}
      <div className="section-card mb-3">
        <h4>برنامج التدريب الأسبوعي</h4>
        <p className="text-muted mb-3">حدد الأنشطة المقررة لكل حصة خلال أيام التدريب</p>
        <div className="table-wrapper">
          <table className="table-custom training-schedule-table">
            <thead>
              <tr>
                <th style={{ minWidth: 100 }}>اليوم / الحصة</th>
                <th>الأولى</th>
                <th>الثانية</th>
                <th>الثالثة</th>
                <th>الرابعة</th>
                <th>الخامسة</th>
                <th>السادسة</th>
                <th>السابعة</th>
              </tr>
            </thead>
            <tbody>
              {[
                { day: "الأحد", key: "sunday" },
                { day: "الاثنين", key: "monday" },
                { day: "الثلاثاء", key: "tuesday" },
                { day: "الأربعاء", key: "wednesday" },
                { day: "الخميس", key: "thursday" },
              ].map((row) => (
                <tr key={row.key}>
                  <td className="day-cell">{row.day}</td>
                  {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                    <td key={period} className="schedule-cell">
                      <textarea
                        className="form-control-custom schedule-input"
                        rows={2}
                        placeholder={`حصة ${period}`}
                        style={{
                          minWidth: 80,
                          fontSize: "0.85rem",
                          resize: "vertical",
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          padding: 6,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 d-flex gap-2">
          <button type="button" className="btn-primary-custom">
            حفظ البرنامج
          </button>
          <button type="button" className="btn-outline-custom">
            طباعة البرنامج
          </button>
        </div>
      </div>

      <div className="section-card">
        <h4>سجلاتك</h4>
        {loading ? (
          <p>جاري التحميل...</p>
        ) : (
          <div className="table-wrapper">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>الأنشطة</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      لا توجد سجلات بعد. أضف يومًا بعد صدور تعيينك التدريبي.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.log_date || "—"}</td>
                      <td>
                        {timeForInput(log.start_time) || "—"} — {timeForInput(log.end_time) || "—"}
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        {(log.activities_performed || "").slice(0, 120)}
                        {(log.activities_performed || "").length > 120 ? "…" : ""}
                      </td>
                      <td>{log.status_label || log.status}</td>
                      <td>
                        <div className="table-actions d-flex flex-wrap gap-1">
                          {log.status === "draft" ? (
                            <>
                              <button
                                type="button"
                                className="btn-sm-custom btn-primary-custom"
                                onClick={() => startEdit(log)}
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                className="btn-sm-custom btn-primary-custom"
                                onClick={() => handleSubmitLog(log.id)}
                              >
                                إرسال
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
