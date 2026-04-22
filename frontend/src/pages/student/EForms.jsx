import { useEffect, useState } from "react";
import { getStudentEForms, saveStudentTrainingProgram, saveStudentEForm, addPortfolioEntry } from "../../services/api";
import { Loader2, Save, Plus, Trash2, RotateCcw } from "lucide-react";

// CSS Animation for smooth form appearance
const fadeInStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

const availableForms = [
  { key: "weekly_reflection", title: "نموذج التأمل الأسبوعي" },
  { key: "field_visit_summary", title: "نموذج ملخص الزيارة الميدانية" },
  { key: "learning_experience_review", title: "نموذج نقد خبرات التعلم" },
  { key: "weekly_brief_report", title: "تقرير مختصر أسبوعي" },
  { key: "weekly_full_report", title: "التقرير الأسبوعي" },
  { key: "classes_count", title: "عدد الحصص التي درسها الطالب" },
];

export default function EForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedForm, setSelectedForm] = useState("");

  // Teaching sessions state (الحصص النوعية)
  const [teachingSessions, setTeachingSessions] = useState([
    { id: 1, grade: "", subject: "", topic: "", sessionsCount: "" },
    { id: 2, grade: "", subject: "", topic: "", sessionsCount: "" },
    { id: 3, grade: "", subject: "", topic: "", sessionsCount: "" },
    { id: 4, grade: "", subject: "", topic: "", sessionsCount: "" },
    { id: 5, grade: "", subject: "", topic: "", sessionsCount: "" },
  ]);

  // Learning experience review state (نقد خبرات التعلم)
  const [learningExperience, setLearningExperience] = useState({
    plansAndObjectives: "",
    lessonImplementation: "",
    introduction: "",
    presentation: "",
    closure: "",
    classroomManagement: "",
    studentMotivation: "",
    methodsAndApproaches: "",
    teachingAids: "",
    evaluationAndTesting: "",
    teacherRoles: ""
  });

  // Weekly report state (التقرير الأسبوعي)
  const [weeklyReport, setWeeklyReport] = useState({
    course: "",
    morningAssembly: "",
    duty: "",
    implementedLessons: "",
    teachingAids: "",
    activities: "",
    meetings: ""
  });

  // Weekly brief report state (التقرير المختصر الأسبوعي)
  const [weeklyBriefReport, setWeeklyBriefReport] = useState({
    // القسم الأول: التخطيط والتحضير
    lessonsTaught: "",
    worksheetsCount: "",
    teachingMaterials: "",
    otherWorks: "",
    // القسم الثاني: العمل والإنجاز الصفي
    observedStrengths: "",
    coTeachingReflection: "",
    selfTeachingReflection: "",
    // القسم الثالث: الجوانب السلوكي والمهني
    studentAttendance: "",
    studentDiscipline: "",
    studentInteraction: "",
    schoolSupport: "",
    professionalRelations: "",
    // القسم الرابع: التقييم والتأمل الذاتي
    strengthsThisWeek: "",
    areasForImprovement: "",
    supervisorSupportNeeds: ""
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudentEForms();
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setForms(list);
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل النماذج.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getFormStatus = (formKey) => {
    const form = forms.find(f => f.form_key === formKey);
    if (!form) return { status: "new", label: "جديد" };
    if (form.status === "submitted") return { status: "submitted", label: "مرسل" };
    if (form.status === "draft") return { status: "draft", label: "مسودة" };
    return { status: "new", label: "جديد" };
  };

  const handleFormSelect = (formKey) => {
    if (!formKey) return;
    // Load existing data if available
    const existingForm = forms.find(f => f.form_key === formKey);
    if (existingForm?.form_data) {
      if (formKey === "learning_experience_review") {
        setLearningExperience(prev => ({ ...prev, ...existingForm.form_data }));
      } else if (formKey === "weekly_full_report") {
        setWeeklyReport(prev => ({ ...prev, ...existingForm.form_data }));
      } else if (formKey === "weekly_brief_report") {
        setWeeklyBriefReport(prev => ({ ...prev, ...existingForm.form_data }));
      }
    }
    // For other forms, show alert (will be implemented later)
    if (formKey !== "classes_count" && formKey !== "learning_experience_review" && formKey !== "weekly_full_report" && formKey !== "weekly_brief_report") {
      alert(`سيتم فتح: ${availableForms.find(f => f.key === formKey)?.title}`);
    }
  };

  // Weekly brief report handlers
  const updateWeeklyBriefReport = (field, value) => {
    setWeeklyBriefReport(prev => ({ ...prev, [field]: value }));
  };

  const resetWeeklyBriefReport = () => {
    setWeeklyBriefReport({
      lessonsTaught: "",
      worksheetsCount: "",
      teachingMaterials: "",
      otherWorks: "",
      observedStrengths: "",
      coTeachingReflection: "",
      selfTeachingReflection: "",
      studentAttendance: "",
      studentDiscipline: "",
      studentInteraction: "",
      schoolSupport: "",
      professionalRelations: "",
      strengthsThisWeek: "",
      areasForImprovement: "",
      supervisorSupportNeeds: ""
    });
  };

  // Weekly report handlers
  const updateWeeklyReport = (field, value) => {
    setWeeklyReport(prev => ({ ...prev, [field]: value }));
  };

  const resetWeeklyReport = () => {
    setWeeklyReport({
      course: "",
      morningAssembly: "",
      duty: "",
      implementedLessons: "",
      teachingAids: "",
      activities: "",
      meetings: ""
    });
  };

  // Learning experience handlers
  const updateLearningExperience = (field, value) => {
    setLearningExperience(prev => ({ ...prev, [field]: value }));
  };

  const resetLearningExperience = () => {
    setLearningExperience({
      plansAndObjectives: "",
      lessonImplementation: "",
      introduction: "",
      presentation: "",
      closure: "",
      classroomManagement: "",
      studentMotivation: "",
      methodsAndApproaches: "",
      teachingAids: "",
      evaluationAndTesting: "",
      teacherRoles: ""
    });
  };

  // Teaching sessions handlers
  const addTeachingSession = () => {
    const newId = teachingSessions.length > 0 ? Math.max(...teachingSessions.map(s => s.id)) + 1 : 1;
    setTeachingSessions([...teachingSessions, { id: newId, grade: "", subject: "", topic: "", sessionsCount: "" }]);
  };

  const deleteTeachingSession = (id) => {
    if (teachingSessions.length > 1) {
      setTeachingSessions(teachingSessions.filter(session => session.id !== id));
    }
  };

  const updateTeachingSession = (id, field, value) => {
    setTeachingSessions(teachingSessions.map(session =>
      session.id === id ? { ...session, [field]: value } : session
    ));
  };

  const resetTeachingSessions = () => {
    setTeachingSessions([
      { id: 1, grade: "", subject: "", topic: "", sessionsCount: "" },
      { id: 2, grade: "", subject: "", topic: "", sessionsCount: "" },
      { id: 3, grade: "", subject: "", topic: "", sessionsCount: "" },
      { id: 4, grade: "", subject: "", topic: "", sessionsCount: "" },
      { id: 5, grade: "", subject: "", topic: "", sessionsCount: "" },
    ]);
  };

  // Helper function to add form entry to portfolio
  const addToPortfolio = async (formKey, formData, formTitle) => {
    try {
      const dateStr = new Date().toLocaleDateString('ar-SA');
      const fd = new FormData();
      fd.append("title", `${formTitle} - ${dateStr}`);
      fd.append("content", JSON.stringify(formData, null, 2));
      // Add metadata as JSON
      fd.append("metadata", JSON.stringify({
        form_key: formKey,
        saved_at: new Date().toISOString(),
        type: "e-form"
      }));
      await addPortfolioEntry(fd);
    } catch (e) {
      console.error("Failed to add to portfolio:", e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (selectedForm === "classes_count") {
        // Save teaching sessions (number of classes)
        await saveStudentTrainingProgram({
          schedule: {},
          teachingSessions
        });
        // Add to portfolio
        await addToPortfolio("classes_count", teachingSessions, "عدد الحصص التي درسها الطالب");
        setSuccess("تم حفظ عدد الحصص وإضافته للملف الإنجازي بنجاح!");
      } else if (selectedForm === "learning_experience_review") {
        // Save learning experience review
        await saveStudentEForm({
          form_key: "learning_experience_review",
          form_data: learningExperience,
          status: "draft"
        });
        // Add to portfolio
        await addToPortfolio("learning_experience_review", learningExperience, "نموذج نقد خبرات التعلم");
        setSuccess("تم حفظ نموذج نقد خبرات التعلم وإضافته للملف الإنجازي بنجاح!");
      } else if (selectedForm === "weekly_full_report") {
        // Save weekly full report
        await saveStudentEForm({
          form_key: "weekly_full_report",
          form_data: weeklyReport,
          status: "draft"
        });
        // Add to portfolio
        await addToPortfolio("weekly_full_report", weeklyReport, "التقرير الأسبوعي");
        setSuccess("تم حفظ التقرير الأسبوعي وإضافته للملف الإنجازي بنجاح!");
      } else if (selectedForm === "weekly_brief_report") {
        // Save weekly brief report
        await saveStudentEForm({
          form_key: "weekly_brief_report",
          form_data: weeklyBriefReport,
          status: "draft"
        });
        // Add to portfolio
        await addToPortfolio("weekly_brief_report", weeklyBriefReport, "التقرير المختصر الأسبوعي");
        setSuccess("تم حفظ التقرير المختصر وإضافته للملف الإنجازي بنجاح!");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "فشل حفظ النموذج.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{fadeInStyles}</style>
      <div className="content-header">
        <h1 className="page-title">النماذج والتقارير</h1>
        <p className="page-subtitle">اختر النموذج أو التقرير المطلوب تعبئته.</p>
      </div>

      {error ? <div className="alert-custom alert-danger mb-3">{error}</div> : null}
      {success ? <div className="alert-custom alert-success mb-3">{success}</div> : null}

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : (
        <div className="section-card">
          <div className="panel-header mb-3">
            <h3 className="panel-title">قائمة النماذج والتقارير المتاحة</h3>
            <p className="panel-subtitle">اختر النموذج من القائمة أدناه</p>
          </div>

          <div style={{ maxWidth: "600px" }}>
            <div style={{ position: "relative" }}>
              <select
                className="form-control-custom"
                value={selectedForm}
                onChange={(e) => {
                  const formKey = e.target.value;
                  setSelectedForm(formKey);
                  if (formKey) {
                    handleFormSelect(formKey);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "1rem 3rem 1rem 1rem",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  backgroundColor: "white",
                  cursor: "pointer",
                  appearance: "none",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--primary, #007bff)";
                  e.target.style.boxShadow = "0 4px 16px rgba(0,123,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                }}
              >
                <option value="">-- اختر النموذج --</option>
                {availableForms.map((f) => {
                  const status = getFormStatus(f.key);
                  return (
                    <option key={f.key} value={f.key}>
                      {f.title} {status.status !== "new" ? `(${status.label})` : ""}
                    </option>
                  );
                })}
              </select>
              <div style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#666"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            {selectedForm === "classes_count" && (
              <div style={{
                marginTop: "2rem",
                animation: "fadeIn 0.4s ease-out",
                maxWidth: "100%"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "16px 16px 0 0",
                  padding: "1.5rem 2rem",
                  color: "white"
                }}>
                  <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>عدد الحصص التي درسها الطالب</h4>
                  <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
                    تسجيل الحصص النوعية التي قام الطالب بتدريسها خلال فترة التدريب
                  </p>
                </div>

                <div style={{
                  backgroundColor: "white",
                  borderRadius: "0 0 16px 16px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  padding: "1.5rem",
                  border: "1px solid #e8e8e8",
                  borderTop: "none"
                }}>
                  <div className="table-wrapper" style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        textAlign: "center",
                        borderRadius: "12px",
                        overflow: "hidden"
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={{
                            padding: "16px 12px",
                            fontWeight: 600,
                            backgroundColor: "#f8f9fa",
                            color: "#495057",
                            borderBottom: "2px solid #dee2e6",
                            fontSize: "0.95rem"
                          }}>
                            الصف
                          </th>
                          <th style={{
                            padding: "16px 12px",
                            fontWeight: 600,
                            backgroundColor: "#f8f9fa",
                            color: "#495057",
                            borderBottom: "2px solid #dee2e6",
                            fontSize: "0.95rem"
                          }}>
                            المقرر الذي قمت بدراسته
                          </th>
                          <th style={{
                            padding: "16px 12px",
                            fontWeight: 600,
                            backgroundColor: "#f8f9fa",
                            color: "#495057",
                            borderBottom: "2px solid #dee2e6",
                            fontSize: "0.95rem"
                          }}>
                            الموضوع
                          </th>
                          <th style={{
                            padding: "16px 12px",
                            fontWeight: 600,
                            backgroundColor: "#f8f9fa",
                            color: "#495057",
                            borderBottom: "2px solid #dee2e6",
                            fontSize: "0.95rem"
                          }}>
                            عدد الحصص
                          </th>
                          <th style={{
                            padding: "16px 12px",
                            fontWeight: 600,
                            backgroundColor: "#f8f9fa",
                            color: "#495057",
                            borderBottom: "2px solid #dee2e6",
                            fontSize: "0.95rem",
                            width: "60px"
                          }}>
                            حذف
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachingSessions.map((session, index) => (
                          <tr
                            key={session.id}
                            style={{
                              backgroundColor: index % 2 === 0 ? "white" : "#fafbfc",
                              transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f0f4f8";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#fafbfc";
                            }}
                          >
                            <td style={{ padding: "12px", borderBottom: "1px solid #e9ecef" }}>
                              <input
                                type="text"
                                value={session.grade}
                                onChange={(e) => updateTeachingSession(session.id, "grade", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  border: "1.5px solid #e0e0e0",
                                  borderRadius: "8px",
                                  textAlign: "center",
                                  fontSize: "0.9rem",
                                  transition: "all 0.2s",
                                  backgroundColor: "white"
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = "var(--primary, #007bff)";
                                  e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = "#e0e0e0";
                                  e.target.style.boxShadow = "none";
                                }}
                                placeholder="الصف"
                              />
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid #e9ecef" }}>
                              <input
                                type="text"
                                value={session.subject}
                                onChange={(e) => updateTeachingSession(session.id, "subject", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  border: "1.5px solid #e0e0e0",
                                  borderRadius: "8px",
                                  textAlign: "center",
                                  fontSize: "0.9rem",
                                  transition: "all 0.2s",
                                  backgroundColor: "white"
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = "var(--primary, #007bff)";
                                  e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = "#e0e0e0";
                                  e.target.style.boxShadow = "none";
                                }}
                                placeholder="المقرر"
                              />
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid #e9ecef" }}>
                              <input
                                type="text"
                                value={session.topic}
                                onChange={(e) => updateTeachingSession(session.id, "topic", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  border: "1.5px solid #e0e0e0",
                                  borderRadius: "8px",
                                  textAlign: "center",
                                  fontSize: "0.9rem",
                                  transition: "all 0.2s",
                                  backgroundColor: "white"
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = "var(--primary, #007bff)";
                                  e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = "#e0e0e0";
                                  e.target.style.boxShadow = "none";
                                }}
                                placeholder="الموضوع"
                              />
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid #e9ecef" }}>
                              <input
                                type="number"
                                min="0"
                                value={session.sessionsCount}
                                onChange={(e) => updateTeachingSession(session.id, "sessionsCount", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  border: "1.5px solid #e0e0e0",
                                  borderRadius: "8px",
                                  textAlign: "center",
                                  fontSize: "0.9rem",
                                  transition: "all 0.2s",
                                  backgroundColor: "white"
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = "var(--primary, #007bff)";
                                  e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = "#e0e0e0";
                                  e.target.style.boxShadow = "none";
                                }}
                                placeholder="0"
                              />
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid #e9ecef" }}>
                              <button
                                onClick={() => deleteTeachingSession(session.id)}
                                disabled={teachingSessions.length <= 1}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: teachingSessions.length <= 1 ? "not-allowed" : "pointer",
                                  color: teachingSessions.length <= 1 ? "#ccc" : "#dc3545",
                                  opacity: teachingSessions.length <= 1 ? 0.5 : 1,
                                  padding: "8px",
                                  borderRadius: "6px",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  if (teachingSessions.length > 1) {
                                    e.currentTarget.style.backgroundColor = "#ffebee";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }}
                                title="حذف الصف"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e9ecef"
                  }}>
                    <button
                      onClick={addTeachingSession}
                      style={{
                        padding: "0.875rem 1.5rem",
                        backgroundColor: "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        transition: "all 0.2s",
                        boxShadow: "0 2px 8px rgba(34,197,94,0.3)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#16a34a";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(34,197,94,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#22c55e";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(34,197,94,0.3)";
                      }}
                    >
                      <Plus size={18} /> إضافة صف جديد
                    </button>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={resetTeachingSessions}
                        disabled={saving}
                        style={{
                          padding: "0.875rem 1.5rem",
                          backgroundColor: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: saving ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.95rem",
                          fontWeight: 500,
                          opacity: saving ? 0.6 : 1,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!saving) {
                            e.currentTarget.style.backgroundColor = "#4b5563";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#6b7280";
                        }}
                      >
                        <RotateCcw size={18} /> إعادة تعيين
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                          padding: "0.875rem 2rem",
                          backgroundColor: "var(--primary, #007bff)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: saving ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          opacity: saving ? 0.6 : 1,
                          transition: "all 0.2s",
                          boxShadow: "0 2px 8px rgba(0,123,255,0.3)"
                        }}
                        onMouseEnter={(e) => {
                          if (!saving) {
                            e.currentTarget.style.backgroundColor = "#0056b3";
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,123,255,0.4)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--primary, #007bff)";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,123,255,0.3)";
                        }}
                      >
                        {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                        {saving ? "جاري الحفظ..." : "حفظ النموذج"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedForm === "weekly_full_report" && (
              <div style={{
                marginTop: "2rem",
                animation: "fadeIn 0.4s ease-out",
                maxWidth: "100%"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  borderRadius: "16px 16px 0 0",
                  padding: "1.5rem 2rem",
                  color: "white"
                }}>
                  <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>التقرير الأسبوعي</h4>
                  <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
                    تقرير الطالب الأسبوعي عن الأنشطة والمهام المنفذة
                  </p>
                </div>

                <div style={{
                  backgroundColor: "white",
                  borderRadius: "0 0 16px 16px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  padding: "1.5rem",
                  border: "1px solid #e8e8e8",
                  borderTop: "none"
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                    gap: "1.25rem"
                  }}>
                    {[
                      { key: "course", label: "المساق" },
                      { key: "morningAssembly", label: "الطابور الصباحي" },
                      { key: "duty", label: "المناوبة" },
                      { key: "implementedLessons", label: "الحصص التي نفذها (كلي – جزئي – أوراق العمل)" },
                      { key: "teachingAids", label: "الوسائل التي أعدها" },
                      { key: "activities", label: "الأنشطة التي قام بها" },
                      { key: "meetings", label: "حضور الاجتماعات" }
                    ].map((field) => (
                      <div key={field.key} style={{ display: "flex", flexDirection: "column" }}>
                        <label style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#495057",
                          marginBottom: "0.5rem"
                        }}>
                          {field.label}
                        </label>
                        <textarea
                          value={weeklyReport[field.key]}
                          onChange={(e) => updateWeeklyReport(field.key, e.target.value)}
                          rows={4}
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1.5px solid #e0e0e0",
                            borderRadius: "10px",
                            fontSize: "0.9rem",
                            resize: "vertical",
                            transition: "all 0.2s",
                            backgroundColor: "white",
                            fontFamily: "inherit"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "var(--primary, #007bff)";
                            e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e0e0e0";
                            e.target.style.boxShadow = "none";
                          }}
                          placeholder={`اكتب ${field.label}...`}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e9ecef"
                  }}>
                    <button
                      onClick={resetWeeklyReport}
                      disabled={saving}
                      style={{
                        padding: "0.875rem 1.5rem",
                        backgroundColor: "#6b7280",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        opacity: saving ? 0.6 : 1,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = "#4b5563";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#6b7280";
                      }}
                    >
                      <RotateCcw size={18} /> إعادة تعيين
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: "0.875rem 2rem",
                        backgroundColor: "var(--primary, #007bff)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        opacity: saving ? 0.6 : 1,
                        transition: "all 0.2s",
                        boxShadow: "0 2px 8px rgba(0,123,255,0.3)"
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = "#0056b3";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,123,255,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--primary, #007bff)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,123,255,0.3)";
                      }}
                    >
                      {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                      {saving ? "جاري الحفظ..." : "حفظ التقرير"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedForm === "weekly_brief_report" && (
              <div style={{
                marginTop: "2rem",
                animation: "fadeIn 0.4s ease-out",
                maxWidth: "100%"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  borderRadius: "16px 16px 0 0",
                  padding: "1.5rem 2rem",
                  color: "white"
                }}>
                  <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>التقرير المختصر الأسبوعي</h4>
                  <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
                    تقرير شامل عن الأنشطة والمهام والتأمل الذاتي للأسبوع
                  </p>
                </div>

                <div style={{
                  backgroundColor: "white",
                  borderRadius: "0 0 16px 16px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  padding: "1.5rem",
                  border: "1px solid #e8e8e8",
                  borderTop: "none"
                }}>
                  {/* القسم الأول: التخطيط والتحضير */}
                  <div style={{ marginBottom: "2rem" }}>
                    <h5 style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#495057",
                      marginBottom: "1rem",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#e9ecef",
                      borderRadius: "8px",
                      borderRight: "4px solid #fa709a"
                    }}>
                      القسم الأول: العمل والإنجاز اللاصفي (خارج الغرفة الصفية) - التخطيط والتحضير
                    </h5>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "1rem"
                    }}>
                      {[
                        { key: "lessonsTaught", label: "أسماء المباحث والدروس التي نفذتها خلال هذا الأسبوع" },
                        { key: "worksheetsCount", label: "عدد أوراق العمل التي عملتها هذا الأسبوع وعناوينها" },
                        { key: "teachingMaterials", label: "أسماء أبرز الوسائل التعليمية قمت بإعدادها وتوظيفها" },
                        { key: "otherWorks", label: "أسماء أعمال أخرى أعددتها (مقاطع فيديو، نشرات، اختبارات، خطط علاجية...)" }
                      ].map((field) => (
                        <div key={field.key} style={{ display: "flex", flexDirection: "column" }}>
                          <label style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#495057",
                            marginBottom: "0.5rem"
                          }}>
                            {field.label}
                          </label>
                          <textarea
                            value={weeklyBriefReport[field.key]}
                            onChange={(e) => updateWeeklyBriefReport(field.key, e.target.value)}
                            rows={3}
                            style={{
                              width: "100%",
                              padding: "10px",
                              border: "1.5px solid #e0e0e0",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              resize: "vertical",
                              transition: "all 0.2s",
                              backgroundColor: "white",
                              fontFamily: "inherit"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "var(--primary, #007bff)";
                              e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e0e0e0";
                              e.target.style.boxShadow = "none";
                            }}
                            placeholder="..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* القسم الثاني: العمل والإنجاز الصفي */}
                  <div style={{ marginBottom: "2rem" }}>
                    <h5 style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#495057",
                      marginBottom: "1rem",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#e9ecef",
                      borderRadius: "8px",
                      borderRight: "4px solid #fee140"
                    }}>
                      القسم الثاني: العمل والإنجاز الصفي (داخل الغرفة الصفية)
                    </h5>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "1rem"
                    }}>
                      {[
                        { key: "observedStrengths", label: "ما أعجبك من مشاهدتك للمعلم المرشد" },
                        { key: "coTeachingReflection", label: "انعكاس على مشاركتك في إعطاء مواقف تعليمية مع المعلم المرشد" },
                        { key: "selfTeachingReflection", label: "تقييمك الذاتي لحصة صفية كاملة نفذتها" }
                      ].map((field) => (
                        <div key={field.key} style={{ display: "flex", flexDirection: "column" }}>
                          <label style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#495057",
                            marginBottom: "0.5rem"
                          }}>
                            {field.label}
                          </label>
                          <textarea
                            value={weeklyBriefReport[field.key]}
                            onChange={(e) => updateWeeklyBriefReport(field.key, e.target.value)}
                            rows={3}
                            style={{
                              width: "100%",
                              padding: "10px",
                              border: "1.5px solid #e0e0e0",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              resize: "vertical",
                              transition: "all 0.2s",
                              backgroundColor: "white",
                              fontFamily: "inherit"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "var(--primary, #007bff)";
                              e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e0e0e0";
                              e.target.style.boxShadow = "none";
                            }}
                            placeholder="..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* القسم الثالث: الجوانب السلوكي والمهني */}
                  <div style={{ marginBottom: "2rem" }}>
                    <h5 style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#495057",
                      marginBottom: "1rem",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#e9ecef",
                      borderRadius: "8px",
                      borderRight: "4px solid #11998e"
                    }}>
                      القسم الثالث: الجوانب السلوكي والمهني
                    </h5>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "1rem"
                    }}>
                      {[
                        { key: "studentAttendance", label: "التزام الطلبة بالدوام والزي المدرسي" },
                        { key: "studentDiscipline", label: "احترام الطلبة للقوانين والأنظمة ولوائح السلوك والانضباط" },
                        { key: "studentInteraction", label: "تعاون وتفاعل الطلبة معك في الحصص الصفية" },
                        { key: "schoolSupport", label: "أتاحة المدرسة الفرصة للتدريب بفاعلية والحصول على أقصى فائدة" },
                        { key: "professionalRelations", label: "علاقتك المهنية مع ذوي العلاقة في المدرسة وتقبلهم لك" }
                      ].map((field) => (
                        <div key={field.key} style={{ display: "flex", flexDirection: "column" }}>
                          <label style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#495057",
                            marginBottom: "0.5rem"
                          }}>
                            {field.label}
                          </label>
                          <textarea
                            value={weeklyBriefReport[field.key]}
                            onChange={(e) => updateWeeklyBriefReport(field.key, e.target.value)}
                            rows={3}
                            style={{
                              width: "100%",
                              padding: "10px",
                              border: "1.5px solid #e0e0e0",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              resize: "vertical",
                              transition: "all 0.2s",
                              backgroundColor: "white",
                              fontFamily: "inherit"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "var(--primary, #007bff)";
                              e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e0e0e0";
                              e.target.style.boxShadow = "none";
                            }}
                            placeholder="..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* القسم الرابع: التقييم والتأمل الذاتي */}
                  <div style={{ marginBottom: "2rem" }}>
                    <h5 style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#495057",
                      marginBottom: "1rem",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#e9ecef",
                      borderRadius: "8px",
                      borderRight: "4px solid #667eea"
                    }}>
                      القسم الرابع: التقييم والتأمل الذاتي
                    </h5>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "1rem"
                    }}>
                      {[
                        { key: "strengthsThisWeek", label: "أهم جوانب القوة والنجاح التي تميزت بها هذا الأسبوع" },
                        { key: "areasForImprovement", label: "الجوانب التي تحتاج لتحسين وتطوير مستقبلاً" },
                        { key: "supervisorSupportNeeds", label: "ما الذي تريد من مشرفك أن يساعدك فيه ليتطور أداؤك" }
                      ].map((field) => (
                        <div key={field.key} style={{ display: "flex", flexDirection: "column" }}>
                          <label style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#495057",
                            marginBottom: "0.5rem"
                          }}>
                            {field.label}
                          </label>
                          <textarea
                            value={weeklyBriefReport[field.key]}
                            onChange={(e) => updateWeeklyBriefReport(field.key, e.target.value)}
                            rows={3}
                            style={{
                              width: "100%",
                              padding: "10px",
                              border: "1.5px solid #e0e0e0",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              resize: "vertical",
                              transition: "all 0.2s",
                              backgroundColor: "white",
                              fontFamily: "inherit"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "var(--primary, #007bff)";
                              e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e0e0e0";
                              e.target.style.boxShadow = "none";
                            }}
                            placeholder="..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e9ecef"
                  }}>
                    <button
                      onClick={resetWeeklyBriefReport}
                      disabled={saving}
                      style={{
                        padding: "0.875rem 1.5rem",
                        backgroundColor: "#6b7280",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        opacity: saving ? 0.6 : 1,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = "#4b5563";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#6b7280";
                      }}
                    >
                      <RotateCcw size={18} /> إعادة تعيين
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: "0.875rem 2rem",
                        backgroundColor: "var(--primary, #007bff)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        opacity: saving ? 0.6 : 1,
                        transition: "all 0.2s",
                        boxShadow: "0 2px 8px rgba(0,123,255,0.3)"
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = "#0056b3";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,123,255,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--primary, #007bff)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,123,255,0.3)";
                      }}
                    >
                      {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                      {saving ? "جاري الحفظ..." : "حفظ التقرير"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedForm === "learning_experience_review" && (
              <div style={{
                marginTop: "2rem",
                animation: "fadeIn 0.4s ease-out",
                maxWidth: "100%"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  borderRadius: "16px 16px 0 0",
                  padding: "1.5rem 2rem",
                  color: "white"
                }}>
                  <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>نموذج نقد خبرات التعلم</h4>
                  <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
                    تقييم وتقويم الخبرات التعليمية المكتسبة خلال فترة التدريب
                  </p>
                </div>

                <div style={{
                  backgroundColor: "white",
                  borderRadius: "0 0 16px 16px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  padding: "1.5rem",
                  border: "1px solid #e8e8e8",
                  borderTop: "none"
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1rem"
                  }}>
                    {[
                      { key: "plansAndObjectives", label: "الخطط والأهداف" },
                      { key: "lessonImplementation", label: "تنفيذ الدرس" },
                      { key: "introduction", label: "التمهيد" },
                      { key: "presentation", label: "العرض" },
                      { key: "closure", label: "الخاتمة والغلق" },
                      { key: "classroomManagement", label: "إدارة الصف" },
                      { key: "studentMotivation", label: "إثارة الدافعية عند الطلبة" },
                      { key: "methodsAndApproaches", label: "الطرائق والأساليب المتبعة" },
                      { key: "teachingAids", label: "إعداد الوسائل التعليمية وتفعيلها" },
                      { key: "evaluationAndTesting", label: "التقييم والاختبارات ومراعاة مبادئ القياس والتقويم" },
                      { key: "teacherRoles", label: "الأدوار التي يقوم بها المعلم إضافة إلى عملية التدريس" }
                    ].map((field) => (
                      <div key={field.key} style={{ display: "flex", flexDirection: "column" }}>
                        <label style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#495057",
                          marginBottom: "0.5rem"
                        }}>
                          {field.label}
                        </label>
                        <textarea
                          value={learningExperience[field.key]}
                          onChange={(e) => updateLearningExperience(field.key, e.target.value)}
                          rows={3}
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1.5px solid #e0e0e0",
                            borderRadius: "10px",
                            fontSize: "0.9rem",
                            resize: "vertical",
                            transition: "all 0.2s",
                            backgroundColor: "white",
                            fontFamily: "inherit"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "var(--primary, #007bff)";
                            e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e0e0e0";
                            e.target.style.boxShadow = "none";
                          }}
                          placeholder={`اكتب ملاحظاتك عن ${field.label}...`}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e9ecef"
                  }}>
                    <button
                      onClick={resetLearningExperience}
                      disabled={saving}
                      style={{
                        padding: "0.875rem 1.5rem",
                        backgroundColor: "#6b7280",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        opacity: saving ? 0.6 : 1,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = "#4b5563";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#6b7280";
                      }}
                    >
                      <RotateCcw size={18} /> إعادة تعيين
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: "0.875rem 2rem",
                        backgroundColor: "var(--primary, #007bff)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        opacity: saving ? 0.6 : 1,
                        transition: "all 0.2s",
                        boxShadow: "0 2px 8px rgba(0,123,255,0.3)"
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = "#0056b3";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,123,255,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--primary, #007bff)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,123,255,0.3)";
                      }}
                    >
                      {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                      {saving ? "جاري الحفظ..." : "حفظ النموذج"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
