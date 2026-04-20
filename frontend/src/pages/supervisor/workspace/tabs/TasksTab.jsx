import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../../services/api";

const initialForm = {
  title: "",
  description: "",
  due_date: "",
  task_type: "واجب",
  target_mode: "individual",
  section_id: "",
  is_graded: true,
  attachment_path: "",
};

export default function TasksTab({ studentId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}/tasks`, { params: { per_page: 200 } });
      setTasks(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setError("فشل تحميل المهام");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, student_id: studentId };
      if (editingId) {
        await apiClient.put(`/tasks/${editingId}`, payload);
      } else {
        await apiClient.post("/tasks", payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadTasks();
    } catch {
      alert("فشل حفظ المهمة");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("هل تريد حذف هذه المهمة؟")) return;
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      loadTasks();
    } catch {
      alert("فشل حذف المهمة");
    }
  };

  const openEdit = (task) => {
    setForm({
      title: task.title || "",
      description: task.description || "",
      due_date: task.due_date || "",
      task_type: task.task_type || "واجب",
      target_mode: task.target_mode || "individual",
      section_id: task.section_id || "",
      is_graded: task.is_graded !== false,
      attachment_path: task.attachment_path || "",
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const statusConfig = {
    active: { label: "نشطة", color: "#0d6efd", bg: "#e3f2fd" },
    submitted: { label: "تم التسليم", color: "#17a2b8", bg: "#e0f7fa" },
    graded: { label: "تم التقييم", color: "#28a745", bg: "#e8f5e9" },
    closed: { label: "مغلقة", color: "#6c757d", bg: "#f8f9fa" },
    overdue: { label: "متأخرة", color: "#dc3545", bg: "#ffebee" },
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>⏳ جاري التحميل...</div>;

  return (
    <div>
      {/* Add Task Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h4 style={{ margin: 0 }}>✅ المهام</h4>
        <button className="btn-primary-custom" onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true); }}>
          + إضافة مهمة
        </button>
      </div>

      {/* Task Form */}
      {showForm && (
        <div className="section-card" style={{ marginBottom: "16px", border: "1px solid #4361ee" }}>
          <h5 style={{ margin: "0 0 16px" }}>{editingId ? "✏️ تعديل مهمة" : "📝 مهمة جديدة"}</h5>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="form-label-custom">عنوان المهمة *</label>
                <input id="task-title" name="title" className="form-input-custom" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label-custom">تاريخ التسليم *</label>
                <input id="task-due-date" name="due_date" type="date" className="form-input-custom" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} required />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label-custom">الوصف</label>
                <textarea id="task-description" name="description" className="form-textarea-custom" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="form-label-custom">نوع المهمة</label>
                <select id="task-type" name="task_type" className="form-select-custom" value={form.task_type} onChange={(e) => setForm((p) => ({ ...p, task_type: e.target.value }))}>
                  <option value="واجب">واجب</option>
                  <option value="تقرير">تقرير</option>
                  <option value="خطة درس">خطة درس</option>
                  <option value="بحث">بحث</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div>
                <label className="form-label-custom">تدخل في التقييم؟</label>
                <select id="task-is-graded" name="is_graded" className="form-select-custom" value={form.is_graded ? "yes" : "no"} onChange={(e) => setForm((p) => ({ ...p, is_graded: e.target.value === "yes" }))}>
                  <option value="yes">نعم</option>
                  <option value="no">لا</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button className="btn-primary-custom" type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "💾 حفظ"}</button>
              <button type="button" style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #999", background: "#fff", cursor: "pointer" }} onClick={() => { setShowForm(false); setEditingId(null); }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      {!tasks.length ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📭</div>
          لا توجد مهام بعد
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tasks.map((task) => {
            const sc = statusConfig[task.status] || statusConfig.active;
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "graded" && task.status !== "closed";
            return (
              <div key={task.id} style={{ background: "#fff", border: "1px solid #e9ecef", borderRadius: "10px", padding: "16px", borderRight: `4px solid ${isOverdue ? "#dc3545" : sc.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h5 style={{ margin: "0 0 4px" }}>{task.title}</h5>
                    <span style={{ fontSize: "0.78rem", color: "#666" }}>
                      {task.task_type} | التسليم: {task.due_date || "—"}
                      {isOverdue && <span style={{ color: "#dc3545", fontWeight: "600", marginRight: "8px" }}> (متأخرة!)</span>}
                    </span>
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: "16px", fontSize: "0.78rem", fontWeight: "600", color: isOverdue ? "#dc3545" : sc.color, backgroundColor: isOverdue ? "#ffebee" : sc.bg }}>
                    {isOverdue ? "متأخرة" : sc.label}
                  </span>
                </div>
                {task.description && <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "#555" }}>{task.description}</p>}
                {task.is_graded && <span style={{ fontSize: "0.75rem", color: "#28a745", background: "#e8f5e9", padding: "2px 8px", borderRadius: "10px" }}>تدخل في التقييم</span>}
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button style={{ fontSize: "0.82rem", padding: "4px 12px", borderRadius: "6px", border: "1px solid #4361ee", background: "#fff", color: "#4361ee", cursor: "pointer" }} onClick={() => openEdit(task)}>✏️ تعديل</button>
                  <button style={{ fontSize: "0.82rem", padding: "4px 12px", borderRadius: "6px", border: "1px solid #dc3545", background: "#fff", color: "#dc3545", cursor: "pointer" }} onClick={() => handleDelete(task.id)}>🗑️ حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
