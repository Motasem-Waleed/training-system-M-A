import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { getStudentTrainingProgramById } from "../../services/api";

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

export default function StudentTrainingProgram() {
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentInfo, setStudentInfo] = useState({ name: "—", university_id: "—" });
  const [schedule, setSchedule] = useState({});

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getStudentTrainingProgramById(studentId);
      if (res?.data?.schedule) {
        setSchedule(res.data.schedule);
      }
      if (res?.data?.student) {
        setStudentInfo(res.data.student);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل برنامج التدريب.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const getCellValue = (dayId, periodId) => {
    return schedule?.[dayId]?.[periodId] || "";
  };

  if (loading) {
    return (
      <div className="section-card" style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="spin" size={24} /> جاري التحميل...
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card">
        <p className="text-danger" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} /> {error}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">برنامج التدريب - {studentInfo.name}</h1>
        <p className="page-subtitle">
          الرقم الجامعي: {studentInfo.university_id} — عرض جدول الحصص (للقراءة فقط)
        </p>
      </div>

      <div className="section-card">
        <div className="panel-header">
          <h3 className="panel-title">جدول التطبيق</h3>
          <p className="panel-subtitle">جدول الحصص الأسبوعي كما أدخله الطالب</p>
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
                      style={{ padding: "10px", border: "1px solid #ddd" }}
                    >
                      <span style={{ fontSize: "0.9rem", color: getCellValue(day.id, period.id) ? "#333" : "#ccc" }}>
                        {getCellValue(day.id, period.id) || "—"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
