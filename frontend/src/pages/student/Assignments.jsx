import { useCallback, useEffect, useState } from "react";
import { getStudentTasks, itemsFromPagedResponse, submitStudentTask } from "../../services/api";

export default function Assignments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState({});
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentTasks();
      setTasks(itemsFromPagedResponse(res));
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل التكليفات.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (task) => {
    const id = task.id;
    setSavingId(id);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      if (files[id]) {
        fd.append("file", files[id]);
      }
      const n = (notes[id] || "").trim();
      if (n) fd.append("notes", n);
      await submitStudentTask(id, fd);
      setSuccess("تم تسليم التكليف بنجاح.");
      setFiles((prev) => ({ ...prev, [id]: null }));
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل التسليم.");
    } finally {
      setSavingId(null);
    }
  };

  const statusLabel = (t) => t.status_label || t.status || "—";
  const canSubmit = (t) => !["submitted", "graded"].includes(t.status);

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">التكليفات</h1>
        <p className="page-subtitle">متابعة التكليفات المطلوبة ورفع الملفات عبر النظام</p>
      </div>

      {success ? (
        <div className="alert-custom alert-success mb-3">{success}</div>
      ) : null}
      {error ? (
        <div className="alert-custom alert-danger mb-3">{error}</div>
      ) : null}

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : tasks.length === 0 ? (
        <div className="section-card">
          <p className="text-muted mb-0">لا توجد تكليفات مرتبطة بتدريبك حاليًا.</p>
        </div>
      ) : (
        <div className="row g-4">
          {tasks.map((assignment) => (
            <div className="col-12" key={assignment.id}>
              <div className="panel">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                  <div>
                    <h5 className="mb-2">{assignment.title}</h5>
                    <p className="text-muted mb-2">{assignment.description || "—"}</p>
                    <p className="mb-1">
                      <strong>آخر موعد:</strong> {assignment.due_date || "—"}
                    </p>
                    <p className="mb-0">
                      <strong>الحالة:</strong> {statusLabel(assignment)}
                    </p>
                  </div>
                </div>

                {canSubmit(assignment) ? (
                  <div className="row g-3 align-items-end">
                    <div className="col-md-8">
                      <label className="form-label">رفع ملف (اختياري إن نصّحكم المرشد)</label>
                      <input
                        type="file"
                        className="form-control-custom"
                        onChange={(e) =>
                          setFiles((prev) => ({
                            ...prev,
                            [assignment.id]: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">ملاحظات</label>
                      <textarea
                        className="form-control-custom"
                        rows={2}
                        value={notes[assignment.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [assignment.id]: e.target.value }))
                        }
                        placeholder="نص التسليم أو ملاحظات"
                      />
                    </div>
                    <div className="col-md-4">
                      <button
                        type="button"
                        className="btn-primary-custom"
                        disabled={savingId === assignment.id}
                        onClick={() => handleSubmit(assignment)}
                      >
                        {savingId === assignment.id ? "جاري الإرسال..." : "تسليم التكليف"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted mb-0">تم تسليم هذا التكليف.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
