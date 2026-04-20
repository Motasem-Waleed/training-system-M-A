import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../../services/api";

const academicEvalInitial = {
  field_performance: "",
  portfolio_score: "",
  attendance_score: "",
  daily_log_score: "",
  theory_score: "",
  tasks_score: "",
  general_notes: "",
  is_final: false,
};

export default function EvaluationsTab({ studentId }) {
  const [fieldEvals, setFieldEvals] = useState([]);
  const [academicEval, setAcademicEval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("field");
  const [showAcademicForm, setShowAcademicForm] = useState(false);
  const [form, setForm] = useState(academicEvalInitial);
  const [saving, setSaving] = useState(false);

  const loadEvals = useCallback(async () => {
    setLoading(true);
    try {
      const [fieldRes, acadRes] = await Promise.all([
        apiClient.get(`/supervisor/students/${studentId}/field-evaluations`).then((r) => r.data).catch(() => []),
        apiClient.get(`/supervisor/students/${studentId}/academic-evaluation`).then((r) => r.data).catch(() => null),
      ]);
      setFieldEvals(Array.isArray(fieldRes) ? fieldRes : fieldRes?.data || []);
      setAcademicEval(acadRes);
      if (acadRes) {
        setForm({
          field_performance: acadRes.field_performance || "",
          portfolio_score: acadRes.portfolio_score || "",
          attendance_score: acadRes.attendance_score || "",
          daily_log_score: acadRes.daily_log_score || "",
          theory_score: acadRes.theory_score || "",
          tasks_score: acadRes.tasks_score || "",
          general_notes: acadRes.general_notes || "",
          is_final: acadRes.is_final || false,
        });
      }
    } catch {
      setError("فشل تحميل التقييمات");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadEvals(); }, [loadEvals]);

  const handleSubmitAcademic = async (e) => {
    e.preventDefault();
    const requiredFields = ["field_performance", "portfolio_score", "attendance_score", "daily_log_score"];
    const missing = requiredFields.filter((f) => !form[f]);
    if (missing.length > 0) {
      alert(`يرجى تعبئة الحقول الأساسية: ${missing.join("، ")}`);
      return;
    }
    setSaving(true);
    try {
      if (academicEval?.id) {
        await apiClient.put(`/evaluations/${academicEval.id}`, { ...form, student_id: studentId, type: "academic" });
      } else {
        await apiClient.post("/evaluations", { ...form, student_id: studentId, type: "academic" });
      }
      setShowAcademicForm(false);
      loadEvals();
    } catch {
      alert("فشل حفظ التقييم");
    } finally {
      setSaving(false);
    }
  };

  const completeness = () => {
    const fields = ["field_performance", "portfolio_score", "attendance_score", "daily_log_score", "theory_score", "tasks_score"];
    const filled = fields.filter((f) => form[f]).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>⏳ جاري التحميل...</div>;

  return (
    <div>
      {/* Section Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveSection("field")}
          style={{
            padding: "10px 20px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer",
            background: activeSection === "field" ? "#4361ee" : "#f0f0f0", color: activeSection === "field" ? "#fff" : "#333",
            border: "1px solid", borderColor: activeSection === "field" ? "#4361ee" : "#dee2e6",
          }}
        >
          🏃 التقييمات الميدانية
        </button>
        <button
          onClick={() => setActiveSection("academic")}
          style={{
            padding: "10px 20px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer",
            background: activeSection === "academic" ? "#28a745" : "#f0f0f0", color: activeSection === "academic" ? "#fff" : "#333",
            border: "1px solid", borderColor: activeSection === "academic" ? "#28a745" : "#dee2e6",
          }}
        >
          🎓 التقييم الأكاديمي
        </button>
      </div>

      {/* Field Evaluations Section */}
      {activeSection === "field" && (
        <div>
          <div style={{ background: "#f0f7ff", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "0.85rem", color: "#0d6efd" }}>
            📋 التقييمات الميدانية يُدخلها المشرف الميداني ومدير الجهة — المشرف الأكاديمي يطلع عليها فقط
          </div>
          {!fieldEvals.length ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📭</div>
              لا توجد تقييمات ميدانية بعد
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {fieldEvals.map((ev) => (
                <div key={ev.id} style={{ background: "#fff", border: "1px solid #e9ecef", borderRadius: "10px", padding: "16px", borderRight: "4px solid #17a2b8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h5 style={{ margin: 0 }}>{ev.evaluator_name || "مُقيّم"}</h5>
                      <span style={{ fontSize: "0.78rem", color: "#666" }}>{ev.type === "mentor" ? "تقييم المشرف الميداني" : ev.type === "site_manager" ? "تقييم مدير الجهة" : ev.type} — {ev.created_at || "—"}</span>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: "16px", fontSize: "0.78rem", fontWeight: "600", color: ev.total_score != null ? "#28a745" : "#ffc107", backgroundColor: ev.total_score != null ? "#e8f5e9" : "#fff8e1" }}>
                      {ev.total_score != null ? `${ev.total_score}%` : "غير مكتمل"}
                    </span>
                  </div>
                  {ev.items && ev.items.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {ev.items.map((item, i) => (
                        <div key={i} style={{ fontSize: "0.82rem", padding: "4px 8px", background: "#f8f9fa", borderRadius: "4px" }}>
                          {item.label}: <strong>{item.score ?? "—"}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  {ev.notes && <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#555" }}>ملاحظات: {ev.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Academic Evaluation Section */}
      {activeSection === "academic" && (
        <div>
          {academicEval && !showAcademicForm ? (
            <div>
              {/* Show existing evaluation */}
              <div className="section-card" style={{ borderRight: "4px solid #28a745" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ margin: 0 }}>🎓 التقييم الأكاديمي</h4>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-primary-custom" onClick={() => setShowAcademicForm(true)}>✏️ تعديل</button>
                    {academicEval.is_final && <span style={{ padding: "4px 12px", borderRadius: "16px", fontSize: "0.78rem", fontWeight: "600", color: "#28a745", backgroundColor: "#e8f5e9" }}>✅ معتمد</span>}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <EvalItem label="الأداء الميداني" value={academicEval.field_performance} />
                  <EvalItem label="ملف الإنجاز" value={academicEval.portfolio_score} />
                  <EvalItem label="الحضور" value={academicEval.attendance_score} />
                  <EvalItem label="السجل اليومي" value={academicEval.daily_log_score} />
                  <EvalItem label="المتطلبات النظرية" value={academicEval.theory_score} />
                  <EvalItem label="المهام" value={academicEval.tasks_score} />
                </div>
                {academicEval.general_notes && <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "#555" }}>ملاحظات: {academicEval.general_notes}</p>}
              </div>
            </div>
          ) : (
            <div className="section-card" style={{ border: "1px solid #28a745" }}>
              <h4 style={{ margin: "0 0 16px" }}>🎓 إدخال التقييم الأكاديمي</h4>

              {/* Completeness Bar */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.82rem", color: "#666" }}>نسبة الاكتمال</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: "600", color: completeness() >= 100 ? "#28a745" : "#ffc107" }}>{completeness()}%</span>
                </div>
                <div style={{ background: "#e9ecef", borderRadius: "10px", height: "8px" }}>
                  <div style={{ height: "100%", width: `${completeness()}%`, background: completeness() >= 100 ? "#28a745" : "#ffc107", borderRadius: "10px", transition: "width 0.3s" }} />
                </div>
              </div>

              <form onSubmit={handleSubmitAcademic}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="form-label-custom">الأداء الميداني * <small>(من 100)</small></label>
                    <input id="eval-field-performance" name="field_performance" type="number" min="0" max="100" className="form-input-custom" value={form.field_performance} onChange={(e) => setForm((p) => ({ ...p, field_performance: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label-custom">ملف الإنجاز * <small>(من 100)</small></label>
                    <input id="eval-portfolio-score" name="portfolio_score" type="number" min="0" max="100" className="form-input-custom" value={form.portfolio_score} onChange={(e) => setForm((p) => ({ ...p, portfolio_score: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label-custom">الحضور * <small>(من 100)</small></label>
                    <input id="eval-attendance-score" name="attendance_score" type="number" min="0" max="100" className="form-input-custom" value={form.attendance_score} onChange={(e) => setForm((p) => ({ ...p, attendance_score: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label-custom">السجل اليومي * <small>(من 100)</small></label>
                    <input id="eval-daily-log-score" name="daily_log_score" type="number" min="0" max="100" className="form-input-custom" value={form.daily_log_score} onChange={(e) => setForm((p) => ({ ...p, daily_log_score: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label-custom">المتطلبات النظرية <small>(من 100)</small></label>
                    <input id="eval-theory-score" name="theory_score" type="number" min="0" max="100" className="form-input-custom" value={form.theory_score} onChange={(e) => setForm((p) => ({ ...p, theory_score: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label-custom">المهام <small>(من 100)</small></label>
                    <input id="eval-tasks-score" name="tasks_score" type="number" min="0" max="100" className="form-input-custom" value={form.tasks_score} onChange={(e) => setForm((p) => ({ ...p, tasks_score: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label-custom">ملاحظات عامة</label>
                    <textarea id="eval-general-notes" name="general_notes" className="form-textarea-custom" rows={3} value={form.general_notes} onChange={(e) => setForm((p) => ({ ...p, general_notes: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input id="eval-is-final" name="is_final" type="checkbox" checked={form.is_final} onChange={(e) => setForm((p) => ({ ...p, is_final: e.target.checked }))} />
                      <span style={{ fontSize: "0.85rem" }}>اعتماد التقييم النهائي</span>
                    </label>
                    {form.is_final && completeness() < 100 && (
                      <div style={{ color: "#dc3545", fontSize: "0.82rem", marginTop: "4px" }}>⚠️ لا يمكن الاعتماد والحقول الأساسية ناقصة</div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <button className="btn-primary-custom" type="submit" disabled={saving || (form.is_final && completeness() < 100)}>
                    {saving ? "جاري الحفظ..." : "💾 حفظ التقييم"}
                  </button>
                  {academicEval && <button type="button" style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #999", background: "#fff", cursor: "pointer" }} onClick={() => setShowAcademicForm(false)}>إلغاء</button>}
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvalItem({ label, value }) {
  return (
    <div style={{ padding: "10px", background: "#f8f9fa", borderRadius: "8px" }}>
      <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: "700", color: value ? "#28a745" : "#999" }}>{value || "—"}</div>
    </div>
  );
}
