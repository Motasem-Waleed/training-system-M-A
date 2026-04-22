import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, RotateCcw, AlertCircle, Lock } from "lucide-react";
import {
  getStudentTrainingProgram,
  saveStudentTrainingProgram,
} from "../../services/api";

const days = [
  { id: "sunday", label: "الأحد" },
  { id: "monday", label: "الاثنين" },
  { id: "tuesday", label: "الثلاثاء" },
  { id: "wednesday", label: "الأربعاء" },
  { id: "thursday", label: "الخميس" },
];

const periods = [
  { id: 1, label: "الأولى" },
  { id: 2, label: "الثانية" },
  { id: 3, label: "الثالثة" },
  { id: 4, label: "الرابعة" },
  { id: 5, label: "الخامسة" },
  { id: 6, label: "السادسة" },
  { id: 7, label: "السابعة" },
];

const buildEmptySchedule = () => {
  const initial = {};
  days.forEach((day) => {
    initial[day.id] = {};
    periods.forEach((period) => {
      initial[day.id][period.id] = "";
    });
  });
  return initial;
};

export default function EvaluationProgram() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditable, setIsEditable] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: "—",
    universityId: "—",
    school: "—",
    semester: "—",
  });
  const [schedule, setSchedule] = useState(buildEmptySchedule);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentTrainingProgram();
      if (res?.data?.schedule) {
        const merged = buildEmptySchedule();
        Object.keys(res.data.schedule).forEach((dayId) => {
          if (merged[dayId]) {
            Object.keys(res.data.schedule[dayId]).forEach((periodId) => {
              if (merged[dayId][periodId] !== undefined) {
                merged[dayId][periodId] = res.data.schedule[dayId][periodId] || "";
              }
            });
          }
        });
        setSchedule(merged);
      }
      if (res?.is_editable !== undefined) {
        setIsEditable(res.is_editable);
      }
      if (res?.student_info) {
        setStudentInfo({
          name: res.student_info.name || "—",
          universityId: res.student_info.university_id || "—",
          school: res.student_info.school || "—",
          semester: res.student_info.semester || "—",
        });
      }
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل برنامج التدريب.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCellChange = (dayId, periodId, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], [periodId]: value },
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await saveStudentTrainingProgram(schedule);
      setSuccess("تم حفظ برنامج التدريب بنجاح");
    } catch (e) {
      setError(e?.response?.data?.message || "فشل حفظ برنامج التدريب.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSchedule(buildEmptySchedule());
  };

  const infoFieldStyle = {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    backgroundColor: "#f5f5f5",
    color: "#333",
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">برنامج التدريب</h1>
        <p className="page-subtitle">
          جدول الحصص الأسبوعي للتدريب الميداني
        </p>
      </div>

      {loading ? (
        <div className="section-card" style={{ textAlign: "center", padding: "2rem" }}>
          <Loader2 className="spin" size={24} /> جاري التحميل...
        </div>
      ) : (
        <>
          {!isEditable && (
            <div className="alert-custom alert-warning mb-3" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock size={18} />
              إدخال برنامج التدريب مغلق حالياً من قبل المنسق. يمكنك مشاهدة الجدول فقط.
            </div>
          )}

          {error && (
            <div className="alert-custom alert-danger mb-3" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {success && (
            <div className="alert-custom alert-success mb-3">{success}</div>
          )}

          <div className="section-card mb-3">
            <div className="panel-header">
              <h3 className="panel-title">معلومات الطالب</h3>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                  اسم الطالب
                </label>
                <div style={infoFieldStyle}>{studentInfo.name}</div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                  الرقم الجامعي
                </label>
                <div style={infoFieldStyle}>{studentInfo.universityId}</div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                  المدرسة / المركز
                </label>
                <div style={infoFieldStyle}>{studentInfo.school}</div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                  الفصل الدراسي
                </label>
                <div style={infoFieldStyle}>{studentInfo.semester}</div>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="panel-header">
              <h3 className="panel-title">جدول التطبيق</h3>
              <p className="panel-subtitle">
                {isEditable
                  ? "قم بملء الجدول بتوزيع الحصص الأسبوعية ثم اضغط حفظ"
                  : "عرض جدول الحصص الأسبوعي (للقراءة فقط)"}
              </p>
            </div>

            <div className="table-wrapper" style={{ marginTop: "1rem" }}>
              <table
                className="table-custom"
                style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <th
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        fontWeight: "bold",
                        backgroundColor: "#e8e8e8",
                      }}
                    >
                      اليوم / الحصة
                    </th>
                    {periods.map((period) => (
                      <th
                        key={period.id}
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                          backgroundColor: "#e8e8e8",
                        }}
                      >
                        {period.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.id}>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        {day.label}
                      </td>
                      {periods.map((period) => (
                        <td
                          key={`${day.id}-${period.id}`}
                          style={{ padding: "8px", border: "1px solid #ddd" }}
                        >
                          {isEditable ? (
                            <input
                              type="text"
                              value={schedule[day.id]?.[period.id] || ""}
                              onChange={(e) =>
                                handleCellChange(day.id, period.id, e.target.value)
                              }
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                textAlign: "center",
                                fontSize: "0.9rem",
                              }}
                              placeholder="..."
                            />
                          ) : (
                            <span style={{ fontSize: "0.9rem", color: schedule[day.id]?.[period.id] ? "#333" : "#aaa" }}>
                              {schedule[day.id]?.[period.id] || "—"}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isEditable && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  onClick={handleReset}
                  disabled={saving}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <RotateCcw size={16} /> إعادة تعيين
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "var(--primary, #007bff)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                  {saving ? "جاري الحفظ..." : "حفظ الجدول"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
