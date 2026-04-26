import { useEffect, useState } from "react";
import {
  getMySiteStudents,
  createStudentEvaluation,
  getStudentEvaluationsByStudent,
} from "../../services/api";
import {
  Users,
  User,
  GraduationCap,
  Building2,
  MapPin,
  School,
  Star,
  MessageSquare,
  FileText,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const personName = (user) => user?.name ?? user?.data?.name ?? "";

const normalizeStudentFromRequest = (request) =>
  (request.students || []).map((student) => ({
    requestId: request.id,
    studentRowId: student.id,
    studentName: personName(student.user) || "طالب غير معروف",
    universityId: student.user?.university_id || student.user?.data?.university_id || "—",
    specialization: student.course?.name || student.course?.data?.name || "—",
    status: student.status_label || student.status || "قيد المراجعة",
    site: request.training_site?.name || request.trainingSite?.name || "—",
    siteLocation: request.training_site?.location || request.trainingSite?.location || "—",
    siteDirectorate: request.training_site?.directorate || request.trainingSite?.directorate || "—",
    period: request.training_period?.name || request.trainingPeriod?.name || "—",
  }));

export default function StudentEvaluation() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form state - matching the evaluation image exactly
  const [evaluation, setEvaluation] = useState({
    supervisor: "",
    attendance: "",
    cooperation_with_staff: "",
    professionalism: "",
    dealing_with_students: "",
    manners: "",
    participation_in_activities: "",
    school: "",
    comfort: "",
    professional_ethics: "",
    general_notes: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getMySiteStudents();
      
      // Transform the new API response to match the expected format
      const allStudents = (response.students || []).map((student) => ({
        studentRowId: student.id,
        studentName: student.student_name || "طالب غير معروف",
        universityId: student.university_id || "—",
        specialization: student.specialization || "—",
        status: student.status || "—",
        site: student.site || "—",
        siteLocation: student.site_location || "—",
        siteDirectorate: student.site_directorate || "—",
        period: student.period || "—",
        requestId: student.request_id,
      }));
      
      setStudents(allStudents);
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to load students:", error);
      setErrorMessage("تعذر تحميل بيانات الطلبة.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (studentId) => {
    const student = students.find((s) => s.studentRowId === parseInt(studentId));
    setSelectedStudent(student);
    setSavedMessage("");
    setErrorMessage("");
  };

  const handleEvaluationChange = (field, value) => {
    setEvaluation((prev) => ({ ...prev, [field]: value }));
    setSavedMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setErrorMessage("يرجى اختيار طالب أولاً.");
      return;
    }

    try {
      // Prepare evaluation data - matching image fields
      const evaluationData = {
        student_id: selectedStudent.studentRowId,
        training_request_student_id: selectedStudent.studentRowId,
        supervisor: evaluation.supervisor || null,
        attendance: evaluation.attendance || null,
        cooperation_with_staff: evaluation.cooperation_with_staff || null,
        professionalism: evaluation.professionalism || null,
        dealing_with_students: evaluation.dealing_with_students || null,
        manners: evaluation.manners || null,
        participation_in_activities: evaluation.participation_in_activities || null,
        school: evaluation.school || null,
        comfort: evaluation.comfort || null,
        professional_ethics: evaluation.professional_ethics || null,
        general_notes: evaluation.general_notes || null,
        evaluation_date: new Date().toISOString().split('T')[0],
      };

      await createStudentEvaluation(evaluationData);
      setSavedMessage("تم حفظ التقييم بنجاح.");
      setErrorMessage("");
      
      // Reset form - matching image fields
      setEvaluation({
        supervisor: "",
        attendance: "",
        cooperation_with_staff: "",
        professionalism: "",
        dealing_with_students: "",
        manners: "",
        participation_in_activities: "",
        school: "",
        comfort: "",
        professional_ethics: "",
        general_notes: "",
      });
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      if (error.response?.status === 422) {
        setErrorMessage(error.response.data.message || "تعذر حفظ التقييم.");
      } else {
        setErrorMessage("حدث خطأ أثناء حفظ التقييم.");
      }
      setSavedMessage("");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "3rem", color: "var(--text-soft)" }}>
        <Loader2 size={28} className="spin" />
        {"جاري تحميل بيانات الطلبة..."}
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <div className="hero-content">
          <div className="hero-icon" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d5f8a 100%)" }}>
            <Users size={44} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="hero-title">{"تقييم الطلبة"}</h1>
            <p className="hero-subtitle">
              {"اختر الطالب ثم قم بتعبئة نموذج التقييم"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {savedMessage && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.75rem 1rem", background: "#d1fae5", color: "#059669", borderRadius: 12, fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>
          <CheckCircle size={18} /> {savedMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.75rem 1rem", background: "#fee2e2", color: "#dc2626", borderRadius: 12, fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      {/* Student Selection */}
      <div className="section-card mb-4" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <Users size={20} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700 }}>{"اختيار الطالب"}</h4>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-faint)" }}>{"اختر الطالب الذي تريد تقييمه"}</p>
          </div>
        </div>

        <div style={{ position: "relative", maxWidth: 400 }}>
          <select
            value={selectedStudent?.studentRowId || ""}
            onChange={(e) => handleStudentSelect(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: "0.9rem",
              background: "#f8fafc",
              outline: "none",
              appearance: "none",
              cursor: "pointer",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          >
            <option value="">اختر الطالب...</option>
            {students.map((student) => (
              <option key={student.studentRowId} value={student.studentRowId}>
                {student.studentName} - {student.universityId}
              </option>
            ))}
          </select>
          <ChevronDown size={20} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>
      </div>

      {/* Student Info Card */}
      {selectedStudent && (
        <div className="section-card mb-4" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "12px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <User size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.2rem", fontWeight: 700 }}>{selectedStudent.studentName}</h4>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-faint)" }}>{"معلومات الطالب التدريبية"}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <GraduationCap size={16} style={{ color: "#64748b" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>الرقم الجامعي</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{selectedStudent.universityId}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={16} style={{ color: "#64748b" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>المساق</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{selectedStudent.specialization}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Building2 size={16} style={{ color: "#64748b" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>موقع التدريب</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{selectedStudent.site}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={16} style={{ color: "#64748b" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>الموقع</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{selectedStudent.siteLocation}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <School size={16} style={{ color: "#64748b" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>المديرية</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{selectedStudent.siteDirectorate}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Star size={16} style={{ color: "#64748b" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>فترة التدريب</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{selectedStudent.period}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Form */}
      {selectedStudent && (
        <form onSubmit={handleSubmit}>
          <div className="section-card mb-4" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <FileText size={20} />
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700 }}>{"نموذج تقييم أداء الطالب"}</h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-faint)" }}>{"يرجى تقييم أداء الطالب في جميع الجوانب"}</p>
              </div>
            </div>

            {/* Rating Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              {[
                { key: "supervisor", label: "المخبر" },
                { key: "attendance", label: "القوام" },
                { key: "cooperation_with_staff", label: "التعاون مع الهيئة" },
                { key: "professionalism", label: "التربحية" },
                { key: "dealing_with_students", label: "التعامل مع الطلبة" },
                { key: "manners", label: "العظمة" },
                { key: "participation_in_activities", label: "الخراجة في الأنشطة" },
                { key: "school", label: "المدرسة" },
                { key: "comfort", label: "الراحة" },
                { key: "professional_ethics", label: "أخلاقيات المهنة" },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>
                    {field.label}
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleEvaluationChange(field.key, rating)}
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          background: evaluation[field.key] === rating ? "#3b82f6" : "#f8fafc",
                          color: evaluation[field.key] === rating ? "white" : "#64748b",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (evaluation[field.key] !== rating) {
                            e.currentTarget.style.background = "#e2e8f0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (evaluation[field.key] !== rating) {
                            e.currentTarget.style.background = "#f8fafc";
                          }
                        }}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* General Notes */}
            <div style={{ marginTop: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>
                ملاحظات عامة
              </label>
              <textarea
                value={evaluation.general_notes}
                onChange={(e) => handleEvaluationChange("general_notes", e.target.value)}
                placeholder=""
                rows={5}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.9rem",
                  background: "#f8fafc",
                  resize: "vertical",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 2rem",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <CheckCircle size={18} />
                {"حفظ التقييم"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}