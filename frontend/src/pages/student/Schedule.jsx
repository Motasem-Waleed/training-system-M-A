import { useCallback, useEffect, useState, useRef } from "react";
import { getStudentTrainingProgram, saveStudentTrainingProgram, uploadPortfolioFile } from "../../services/api";
import html2pdf from "html2pdf.js";
import { Calendar, Clock, Lock, Edit3, Save, RotateCcw, Loader2, AlertCircle, CheckCircle, Printer } from "lucide-react";

// Print-specific CSS
const printStyles = `
@media print {
  @page { size: landscape; margin: 10mm; }
  body * { visibility: hidden; }
  #printable-area, #printable-area * { visibility: visible; }
  #printable-area { 
    position: absolute; 
    left: 0; 
    top: 0; 
    width: 100%;
    padding: 10mm;
  }
  .no-print { display: none !important; }
  .print-header { display: block !important; visibility: visible !important; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px; }
  th { background-color: #142a42 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .day-cell { background-color: #f5f5f5 !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .filled-cell { background-color: #e3f2fd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

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

export default function Schedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [isEditable, setIsEditable] = useState(false);
  const [studentInfo, setStudentInfo] = useState({ name: "—", university_id: "—", school: "—", semester: "—" });
  const [schedule, setSchedule] = useState(buildEmptySchedule);
  const [hasSavedProgram, setHasSavedProgram] = useState(false);
  const portfolioEntryIdRef = useRef(null);

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
        setHasSavedProgram(true);
      }
      if (res?.is_editable !== undefined) {
        setIsEditable(res.is_editable);
      }
      if (res?.student_info) {
        setStudentInfo({
          name: res.student_info.name || "—",
          university_id: res.student_info.university_id || "—",
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
    setSuccess("");
  };

  const generatePdf = async () => {
    const element = document.getElementById('printable-area');
    if (!element) return null;
    const opt = {
      margin: 10,
      filename: 'training-program.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };
    const blob = await html2pdf().set(opt).from(element).output('blob');
    return blob;
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveStudentTrainingProgram(schedule);
      setHasSavedProgram(true);
      if (res?.data?.portfolio_entry_id) {
        portfolioEntryIdRef.current = res.data.portfolio_entry_id;
      }
      // Generate PDF and upload to portfolio
      try {
        const pdfBlob = await generatePdf();
        if (pdfBlob && portfolioEntryIdRef.current) {
          await uploadPortfolioFile(portfolioEntryIdRef.current, pdfBlob, 'training-program.pdf');
        }
      } catch (pdfErr) {
        console.error('PDF upload failed:', pdfErr);
      }
      setSuccess("تم حفظ برنامج التدريب بنجاح وإضافته للملف الإنجاز.");
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر حفظ برنامج التدريب.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSchedule(buildEmptySchedule());
    setSuccess("");
  };

  const handlePrint = () => {
    window.print();
  };

  const filledCount = days.reduce(
    (acc, day) => acc + periods.filter((p) => schedule[day.id]?.[p.id]).length,
    0
  );

  if (loading) {
    return (
      <div className="section-card" style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="spin" size={24} /> جاري التحميل...
      </div>
    );
  }

  if (error && !Object.keys(schedule).some((d) => periods.some((p) => schedule[d]?.[p.id]))) {
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
      <style>{printStyles}</style>
      <div className="content-header no-print">
        <h1 className="page-title">برنامج التدريب</h1>
        <p className="page-subtitle">
          الجدول الأسبوعي للحصص التدريبية — {studentInfo.name} — {studentInfo.university_id}
        </p>
      </div>

      {!isEditable && (
        <div className="alert-custom alert-warning mb-3 no-print" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Lock size={18} />
          تعبئة برنامج التدريب مغلقة حالياً من قبل المنسق. يمكنك مشاهدة الجدول فقط.
        </div>
      )}

      {isEditable && (
        <div className="alert-custom alert-info mb-3 no-print" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Edit3 size={18} />
          تعبئة برنامج التدريب مفتوحة — يمكنك تعديل الجدول وحفظه.
        </div>
      )}

      {error && (
        <div className="alert-custom alert-danger mb-3" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div className="alert-custom alert-success mb-3 no-print" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* بطاقات المعلومات */}
      <div className="dashboard-grid mb-3 no-print">
        <div className="stat-card primary">
          <div className="stat-title">الطالب</div>
          <div className="stat-value" style={{ fontSize: "1.1rem" }}>{studentInfo.name}</div>
          <div className="stat-meta">{studentInfo.university_id}</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-title">جهة التدريب</div>
          <div className="stat-value" style={{ fontSize: "1.1rem" }}>{studentInfo.school}</div>
          <div className="stat-meta">المدرسة / المركز</div>
        </div>
        <div className="stat-card success">
          <div className="stat-title">الفترة التدريبية</div>
          <div className="stat-value" style={{ fontSize: "1rem" }}>{studentInfo.semester}</div>
          <div className="stat-meta">الفترة الحالية</div>
        </div>
        <div className="stat-card info">
          <div className="stat-title">خلايا معبأة</div>
          <div className="stat-value">{filledCount}</div>
          <div className="stat-meta">من {days.length * periods.length}</div>
        </div>
      </div>

      {/* نموذج برنامج التدريب */}
      <div id="printable-area" className="section-card">
        {/* Print-only header */}
        <div style={{ display: 'none' }} className="print-header">
          <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '18px' }}>نموذج برنامج التدريب</h1>
          <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '12px' }}>
            الطالب: {studentInfo.name} | الرقم الجامعي: {studentInfo.university_id} | جهة التدريب: {studentInfo.school}
          </p>
        </div>
        <div className="panel-header no-print" style={{ borderBottom: "2px solid var(--primary, #142a42)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #142a42 0%, #2a4a6a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="panel-title" style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--primary, #142a42)" }}>
                نموذج برنامج التدريب
              </h3>
              <p className="panel-subtitle" style={{ margin: "0.25rem 0 0 0", color: "#666", fontSize: "0.95rem" }}>
                الجدول الأسبوعي للحصص التدريبية (5 أيام × 7 حصص)
              </p>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {hasSavedProgram && (
              <button
                onClick={handlePrint}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#1565c0",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <Printer size={14} /> طباعة
              </button>
            )}
            <span
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: isEditable ? "#e8f5e9" : "#fff3e0",
                color: isEditable ? "#2e7d32" : "#ef6c00",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {isEditable ? (
                <><Edit3 size={14} /> قابل للتعديل</>
              ) : (
                <><Lock size={14} /> للعرض فقط</>
              )}
            </span>
          </div>
        </div>

        <div className="table-wrapper" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              textAlign: "center",
              fontSize: "0.95rem",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "16px 12px",
                    background: "linear-gradient(135deg, #142a42 0%, #2a4a6a 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem",
                    border: "none",
                    width: "100px",
                  }}
                >
                  اليوم / الحصة
                </th>
                {periods.map((period, idx) => (
                  <th
                    key={period.id}
                    style={{
                      padding: "16px 10px",
                      background: "linear-gradient(135deg, #142a42 0%, #2a4a6a 100%)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      border: "none",
                      borderRight: idx < periods.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none",
                    }}
                  >
                    {period.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIdx) => (
                <tr
                  key={day.id}
                  style={{
                    backgroundColor: dayIdx % 2 === 0 ? "#ffffff" : "#f8f9fa",
                  }}
                >
                  <td
                    style={{
                      padding: "18px 12px",
                      fontWeight: 700,
                      fontSize: "1rem",
                      background: "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)",
                      color: "var(--primary, #142a42)",
                      border: "1px solid #e0e0e0",
                      borderLeft: "4px solid var(--primary, #142a42)",
                    }}
                  >
                    {day.label}
                  </td>
                  {periods.map((period) => (
                    <td
                      key={`${day.id}-${period.id}`}
                      style={{
                        padding: "10px 8px",
                        border: "1px solid #e0e0e0",
                        backgroundColor: schedule[day.id]?.[period.id] ? "#e3f2fd" : "transparent",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {isEditable ? (
                        <input
                          type="text"
                          value={schedule[day.id]?.[period.id] || ""}
                          onChange={(e) => handleCellChange(day.id, period.id, e.target.value)}
                          placeholder="..."
                          style={{
                            width: "100%",
                            minHeight: "45px",
                            padding: "8px",
                            border: "2px solid transparent",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            textAlign: "center",
                            backgroundColor: "rgba(255,255,255,0.8)",
                            transition: "all 0.2s ease",
                            outline: "none",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#142a42";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 3px rgba(20,42,66,0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "transparent";
                            e.target.style.backgroundColor = "rgba(255,255,255,0.8)";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: schedule[day.id]?.[period.id] ? "#1565c0" : "#bbb",
                            fontWeight: schedule[day.id]?.[period.id] ? 500 : 400,
                          }}
                        >
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

        {/* أزرار التحكم */}
        {isEditable && (
          <div
            className="no-print"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.5rem",
              padding: "1rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
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
                borderRadius: "8px",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: saving ? 0.6 : 1,
                fontWeight: 500,
              }}
            >
              <RotateCcw size={16} /> إعادة تعيين
            </button>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "0.75rem 2rem",
                  backgroundColor: "var(--primary, #142a42)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  opacity: saving ? 0.6 : 1,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(20,42,66,0.3)",
                }}
              >
                {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                {saving ? "جاري الحفظ..." : "حفظ وإرسال للمنسق"}
              </button>
          </div>
        )}

        {/* ملاحظة */}
        <div className="no-print" style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} />
            <strong>ملاحظة:</strong> عند الحفظ يتم إضافة البرنامج تلقائياً لملف الإنجاز وإرساله للمنسق للمراجعة.
            المنسق يتحكم بفتح وإغلاق التعبئة.
          </p>
        </div>

      </div>
    </>
  );
}
