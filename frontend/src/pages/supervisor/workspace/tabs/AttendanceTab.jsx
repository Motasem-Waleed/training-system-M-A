import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../../services/api";

export default function AttendanceTab({ studentId }) {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [commentDate, setCommentDate] = useState("");

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}/attendance`, { params: { per_page: 200 } });
      const payload = res.data;
      const data = payload?.data ?? payload;
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.records)
          ? data.records
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setAttendance(rows);
      setSummary(data?.summary || null);
    } catch {
      setError("فشل تحميل سجل الحضور");
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleAddComment = async () => {
    if (!comment.trim() || !commentDate) return;
    const record = attendance.find((row) => String(row.date || "").slice(0, 10) === commentDate);
    if (!record?.id) {
      alert("لا يوجد سجل حضور محفوظ لهذا التاريخ");
      return;
    }
    try {
      await apiClient.post(`/supervisor/students/${studentId}/attendance-comment`, {
        attendance_id: record.id,
        comment: comment.trim(),
      });
      setComment("");
      setCommentDate("");
      loadAttendance();
    } catch {
      alert("فشل إضافة الملاحظة");
    }
  };

  const handleAlertStudent = async () => {
    if (!window.confirm("هل تريد إرسال تنبيه للطالب بخصوص الحضور؟")) return;
    const record = getAlertAttendanceRecord(attendance);
    if (!record?.id) {
      alert("لا يوجد سجل غياب أو تأخر يمكن إرسال تنبيه عليه");
      return;
    }
    try {
      await apiClient.post(`/supervisor/students/${studentId}/attendance-alert`, {
        attendance_id: record.id,
        target: "student",
        message: "تنبيه بخصوص سجل الحضور، يرجى المتابعة مع المشرف الأكاديمي.",
      });
      alert("تم إرسال التنبيه للطالب");
    } catch {
      alert("فشل إرسال التنبيه");
    }
  };

  const handleAlertMentor = async () => {
    if (!window.confirm("هل تريد إرسال تنبيه للمشرف الميداني؟")) return;
    const record = getAlertAttendanceRecord(attendance);
    if (!record?.id) {
      alert("لا يوجد سجل غياب أو تأخر يمكن إرسال تنبيه عليه");
      return;
    }
    try {
      await apiClient.post(`/supervisor/students/${studentId}/attendance-alert`, {
        attendance_id: record.id,
        target: "field_supervisor",
        message: "تنبيه بخصوص حضور الطالب، يرجى متابعة الحالة ميدانياً.",
      });
      alert("تم إرسال التنبيه للمشرف الميداني");
    } catch {
      alert("فشل إرسال التنبيه");
    }
  };

  const handleEscalate = async () => {
    if (!window.confirm("هل تريد تصعيد حالة الحضور للمنسق الأكاديمي؟")) return;
    try {
      await apiClient.post(`/supervisor/students/${studentId}/escalate`, {
        target: "coordinator",
        reason: "attendance",
        details: "تصعيد حالة الحضور للمتابعة من المنسق الأكاديمي.",
      });
      alert("تم التصعيد بنجاح");
    } catch {
      alert("فشل التصعيد");
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      present: { label: "حاضر", color: "#28a745", bg: "#e8f5e9" },
      absent: { label: "غائب", color: "#dc3545", bg: "#ffebee" },
      late: { label: "متأخر", color: "#ffc107", bg: "#fff8e1" },
      excused: { label: "غياب بعذر", color: "#17a2b8", bg: "#e3f2fd" },
    };
    const c = config[status] || { label: status, color: "#666", bg: "#f5f5f5" };
    return (
      <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "600", color: c.color, backgroundColor: c.bg }}>
        {c.label}
      </span>
    );
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>⏳ جاري التحميل...</div>;
  if (error) return <div style={{ color: "#dc3545", padding: "20px" }}>⚠️ {error}</div>;

  const isWarning = summary && summary.absent_days > 3;
  const isCritical = summary && summary.absent_days > 6;

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <SummaryCard label="إجمالي الأيام" value={summary.total_days} color="#4361ee" />
          <SummaryCard label="أيام الحضور" value={summary.present_days} color="#28a745" />
          <SummaryCard label="أيام الغياب" value={summary.absent_days} color="#dc3545" />
          <SummaryCard label="أيام التأخر" value={summary.late_days} color="#ffc107" />
          <SummaryCard label="نسبة الحضور" value={`${summary.attendance_rate}%`} color={summary.attendance_rate >= 80 ? "#28a745" : "#dc3545"} />
        </div>
      )}

      {/* Warning / Critical Banner */}
      {isCritical && (
        <div style={{ background: "#ffebee", border: "1px solid #dc3545", borderRadius: "8px", padding: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ color: "#dc3545", fontWeight: "600" }}>🚨 حالة حرجة: غياب متكرر ({summary.absent_days} يوم) — يرجى التصعيد</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleAlertStudent} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #dc3545", background: "#fff", color: "#dc3545", cursor: "pointer", fontSize: "0.82rem" }}>تنبيه الطالب</button>
            <button onClick={handleAlertMentor} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #dc3545", background: "#fff", color: "#dc3545", cursor: "pointer", fontSize: "0.82rem" }}>تنبيه المشرف الميداني</button>
            <button onClick={handleEscalate} style={{ padding: "6px 12px", borderRadius: "6px", background: "#dc3545", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.82rem" }}>تصعيد للمنسق</button>
          </div>
        </div>
      )}
      {isWarning && !isCritical && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffc107", borderRadius: "8px", padding: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ color: "#856404", fontWeight: "600" }}>⚠️ تنبيه: غياب ملحوظ ({summary.absent_days} يوم)</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleAlertStudent} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ffc107", background: "#fff", color: "#856404", cursor: "pointer", fontSize: "0.82rem" }}>تنبيه الطالب</button>
          </div>
        </div>
      )}

      {/* Add Comment */}
      <div className="section-card" style={{ marginBottom: "16px" }}>
        <h5 style={{ margin: "0 0 12px" }}>📝 إضافة ملاحظة على الحضور</h5>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "4px" }}>التاريخ</label>
            <input id="attendance-comment-date" name="date" type="date" className="form-input-custom" value={commentDate} onChange={(e) => setCommentDate(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "4px" }}>الملاحظة</label>
            <input id="attendance-comment" name="comment" type="text" className="form-input-custom" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="ملاحظة على الحضور..." />
          </div>
          <button className="btn-primary-custom" onClick={handleAddComment} disabled={!comment.trim() || !commentDate}>إضافة</button>
        </div>
        <small style={{ color: "#999", fontSize: "0.75rem", display: "block", marginTop: "8px" }}>
          * المشرف الأكاديمي لا يستطيع تعديل سجل الحضور، فقط إضافة ملاحظات وتصعيد الحالات
        </small>
      </div>

      {/* Attendance Records */}
      {!attendance.length ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📭</div>
          لا يوجد سجل حضور بعد
        </div>
      ) : (
        <div className="section-card">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>وقت الحضور</th>
                  <th>ملاحظات المشرف الميداني</th>
                  <th>ملاحظات المشرف الأكاديمي</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={a.id || i}>
                    <td>{a.date || "—"}</td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td>{a.check_in_time || a.check_in || "—"}</td>
                    <td style={{ fontSize: "0.85rem", color: "#666" }}>{a.mentor_note || a.notes || "—"}</td>
                    <td style={{ fontSize: "0.85rem", color: "#4361ee" }}>{a.supervisor_comment || a.academic_note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getAlertAttendanceRecord(attendance) {
  return [...attendance]
    .filter((row) => ["absent", "late"].includes(row.status))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0];
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ padding: "16px", background: color + "10", borderRadius: "10px", textAlign: "center", border: `1px solid ${color}20` }}>
      <div style={{ fontSize: "1.4rem", fontWeight: "700", color }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px" }}>{label}</div>
    </div>
  );
}
