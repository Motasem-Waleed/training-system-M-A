import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTrainingAssignments,
  itemsFromPagedResponse,
} from "../../services/api";

const STATUS_MAP = {
  pending: { label: "قيد الانتظار", cls: "badge-warning" },
  in_progress: { label: "قيد التنفيذ", cls: "badge-info" },
  submitted: { label: "تم التسليم", cls: "badge-primary" },
  graded: { label: "تم التقييم", cls: "badge-success" },
  overdue: { label: "متأخر", cls: "badge-danger" },
};

const emptyForm = { title: "", description: "", training_assignment_id: "", due_date: "", status: "pending" };

export default function FieldStaffTasks() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Modal / form
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [taskRes, assignRes] = await Promise.all([
        getTasks({ per_page: 200 }),
        getTrainingAssignments({ per_page: 200 }),
      ]);
      setItems(itemsFromPagedResponse(taskRes));
      setAssignments(itemsFromPagedResponse(assignRes));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل المهام");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(t) {
    setEditingId(t.id);
    setForm({
      title: t.title || "",
      description: t.description || "",
      training_assignment_id: t.training_assignment_id || "",
      due_date: t.due_date || "",
      status: t.status || "pending",
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await updateTask(editingId, form);
      } else {
        await createTask(form);
      }
      closeModal();
      await load();
    } catch (e) {
      setFormError(e?.response?.data?.message || "فشل حفظ المهمة");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("هل أنت متأكد من حذف هذه المهمة؟")) return;
    try {
      await deleteTask(id);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل حذف المهمة");
    }
  }

  function statusBadge(status) {
    const s = STATUS_MAP[status] || { label: status, cls: "badge-secondary" };
    return <span className={`badge-custom ${s.cls}`}>{s.label}</span>;
  }

  function getStudentName(task) {
    return task.training_assignment?.enrollment?.user?.name || "—";
  }

  return (
    <>
      <PageHeader
        title="المهام"
        subtitle="إضافة ومتابعة المهام التدريبية للطلبة المرتبطين بتعييناتك."
      />

      <div className="table-actions" style={{ marginBottom: 16 }}>
        <button className="btn-primary-custom" onClick={openCreate}>
          + إضافة مهمة جديدة
        </button>
      </div>

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : error ? (
        <div className="section-card">
          <p className="text-danger">{error}</p>
        </div>
      ) : !items.length ? (
        <EmptyState title="لا توجد مهام" description="لم تُضف مهام بعد. اضغط الزر أعلاه لإضافة مهمة جديدة." />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>الوصف</th>
                <th>الطالب</th>
                <th>تاريخ التسليم</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.description ? (t.description.length > 50 ? t.description.slice(0, 50) + "…" : t.description) : "—"}</td>
                  <td>{getStudentName(t)}</td>
                  <td>{t.due_date || "—"}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-outline-custom btn-sm-custom" onClick={() => openEdit(t)}>
                        تعديل
                      </button>
                      <button className="btn-danger-custom btn-sm-custom" onClick={() => handleDelete(t.id)}>
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editingId ? "تعديل مهمة" : "إضافة مهمة جديدة"}</h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <p className="text-danger">{formError}</p>}

                <div className="form-group">
                  <label className="form-label">عنوان المهمة *</label>
                  <input
                    className="form-control-custom"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">الوصف</label>
                  <textarea
                    className="form-control-custom"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">تعيين التدريب (الطالب) *</label>
                  <select
                    className="form-control-custom"
                    value={form.training_assignment_id}
                    onChange={(e) => setForm({ ...form, training_assignment_id: e.target.value })}
                    required
                  >
                    <option value="">— اختر التعيين —</option>
                    {assignments.map((a) => {
                      const stu = a.enrollment?.user;
                      return (
                        <option key={a.id} value={a.id}>
                          {stu?.name || "طالب"} — {a.training_site?.name || "جهة"}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">تاريخ التسليم *</label>
                  <input
                    type="date"
                    className="form-control-custom"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    required
                  />
                </div>

                {editingId && (
                  <div className="form-group">
                    <label className="form-label">الحالة</label>
                    <select
                      className="form-control-custom"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline-custom" onClick={closeModal} disabled={saving}>
                  إلغاء
                </button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>
                  {saving ? "جاري الحفظ..." : editingId ? "تحديث" : "إضافة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
