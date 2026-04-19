import { useEffect, useMemo, useState } from "react";
import {
  createEvaluation,
  getCurrentUser,
  getEvaluationTemplates,
  getTrainingAssignments,
} from "../../services/api";

const TraineeStudents = () => {
  const [studentsData, setStudentsData] = useState([]);
  const [template, setTemplate] = useState(null);
  const [scoresByStudent, setScoresByStudent] = useState({});
  const [schoolInfo, setSchoolInfo] = useState({
    name: "—",
    directorate: "—",
    location: "—",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [userRes, assignmentsRes] = await Promise.all([
        getCurrentUser(),
        getTrainingAssignments({ per_page: 200 }),
      ]);
      const user = userRes?.data || userRes || {};
      const trainingSite = user.training_site?.data || user.training_site || {};
      const allAssignments = Array.isArray(assignmentsRes?.data)
        ? assignmentsRes.data
        : Array.isArray(assignmentsRes)
        ? assignmentsRes
        : [];
      const schoolAssignments = allAssignments.filter((assignment) => {
        const assignmentSiteId =
          assignment.training_site?.data?.id || assignment.training_site?.id;
        return trainingSite?.id ? assignmentSiteId === trainingSite.id : true;
      });

      let principalTemplate = null;
      try {
        const templatesRes = await getEvaluationTemplates();
        const templateList = Array.isArray(templatesRes?.data)
          ? templatesRes.data
          : [];
        principalTemplate =
          templateList.find((item) => item.form_type === "evaluation") || null;
      } catch (templateError) {
        console.error("Failed to load evaluation templates:", templateError);
      }

      const students = schoolAssignments
        .map((assignment) => {
          const enrollment = assignment.enrollment?.data || assignment.enrollment || {};
          const student = enrollment.user?.data || enrollment.user || {};
          const section = enrollment.section?.data || enrollment.section || {};
          const course = enrollment.section?.data?.course?.data ||
            enrollment.section?.course?.data ||
            enrollment.section?.course ||
            {};
          const mentor = assignment.teacher?.data || assignment.teacher || {};
          return {
            id: assignment.id,
            assignmentId: assignment.id,
            name: student.name || "—",
            universityNumber: student.university_id || "—",
            universityName: "جامعة الخليل",
            academicYear: enrollment.academic_year || section.academic_year || "—",
            semester:
              enrollment.semester ||
              section.semester ||
              "—",
            mentorName: mentor.name || "—",
            specialization: course.name || "—",
            directorate: trainingSite.directorate || "—",
            schoolName: trainingSite.name || "—",
            schoolAddress: trainingSite.location || "—",
          };
        })
        .filter((item) => item.name !== "—");

      setStudentsData(students);
      setSelectedStudentId(students[0]?.id || null);
      setTemplate(principalTemplate);
      setSchoolInfo({
        name: trainingSite.name || "—",
        directorate: trainingSite.directorate || "—",
        location: trainingSite.location || "—",
      });
      if (!students.length) {
        setErrorMessage("لا يوجد طلبة متدربون معتمدون في المدرسة حاليًا.");
      } else {
        setErrorMessage("");
      }
    } catch (error) {
      console.error("Failed to load trainee students:", error);
      setErrorMessage("تعذر تحميل بيانات الطلبة المتدربين.");
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = useMemo(
    () =>
      studentsData.find((student) => student.id === selectedStudentId) ||
      studentsData[0] ||
      null,
    [studentsData, selectedStudentId]
  );

  const selectedScores = useMemo(
    () => scoresByStudent[selectedStudentId] || {},
    [scoresByStudent, selectedStudentId]
  );

  const handleStudentChange = (e) => {
    const value = e.target.value;
    setSelectedStudentId(value ? Number(value) : null);
    setSavedMessage("");
  };

  const handleNotesChange = (itemId, value) => {
    setScoresByStudent((prev) => ({
      ...prev,
      [selectedStudentId]: {
        ...(prev[selectedStudentId] || {}),
        [itemId]: value,
      },
    }));
    setSavedMessage("");
  };

  const handleGeneralNotesChange = (value) => {
    setScoresByStudent((prev) => ({
      ...prev,
      [selectedStudentId]: {
        ...(prev[selectedStudentId] || {}),
        __generalNotes: value,
      },
    }));
    setSavedMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !template) {
      setErrorMessage("لا يمكن حفظ التقييم لعدم توفر القالب أو بيانات الطالب.");
      return;
    }

    try {
      setSaving(true);
      setSavedMessage("");
      setErrorMessage("");
      const items = template.items || [];
      const scoresPayload = items.map((item) => ({
        item_id: item.id,
        response_text: selectedScores[item.id] || "",
        score:
          item.field_type === "score"
            ? Number(selectedScores[item.id] || 0)
            : null,
      }));

      await createEvaluation({
        training_assignment_id: selectedStudent.assignmentId,
        template_id: template.id,
        scores: scoresPayload,
        notes: selectedScores.__generalNotes || null,
      });
      setSavedMessage("تم حفظ تقييم الطالب بنجاح.");
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      setErrorMessage(error?.response?.data?.message || "تعذر حفظ التقييم.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="trainee-students-page">
      <div className="content-header">
        <h1 className="page-title">الطلبة المتدربون وتقييمهم</h1>
        <p className="page-subtitle">
          عرض بيانات الطلبة المتدربين داخل المدرسة وتعبئة نموذج التقييم.
        </p>
      </div>

      <div className="section-card trainee-card mb-3">
        <h4>اختيار الطالب المتدرب</h4>
        {loading ? (
          <div className="alert-custom alert-info">جاري تحميل الطلبة...</div>
        ) : null}
        {errorMessage ? (
          <div className="alert-custom alert-danger">{errorMessage}</div>
        ) : null}

        <div className="row">
          <div className="col-md-6">
            <label className="form-label-custom">اختر الطالب المتدرب</label>
            <select
              value={selectedStudentId ?? ""}
              onChange={handleStudentChange}
              className="form-select-custom"
              disabled={!studentsData.length}
            >
              <option value="">اختر الطالب المتدرب</option>
              {studentsData.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedStudent ? (
        <div className="section-card trainee-card mb-3">
          <h4>بيانات الطالب المتدرب</h4>

          <div className="table-wrapper trainee-table-wrapper">
            <table className="table-custom trainee-info-table">
              <tbody>
                <tr>
                  <th>اسم الطالب</th>
                  <td>{selectedStudent.name}</td>
                  <th>جامعة الخليل</th>
                  <td>{selectedStudent.universityName}</td>
                  <th>العام الدراسي</th>
                  <td>{selectedStudent.academicYear}</td>
                  <th>الفصل الدراسي</th>
                  <td>{selectedStudent.semester}</td>
                </tr>
                <tr>
                  <th>اسم المعلم المقيم</th>
                  <td>{selectedStudent.mentorName}</td>
                  <th>اسم المدرسة</th>
                  <td>{schoolInfo.name || selectedStudent.schoolName}</td>
                  <th>المديرية</th>
                  <td>{schoolInfo.directorate || selectedStudent.directorate}</td>
                  <th>عنوان المدرسة</th>
                  <td>{schoolInfo.location || selectedStudent.schoolAddress}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="section-card trainee-card">
        <h4>نموذج التقييم</h4>
        {!template ? (
          <div className="alert-custom alert-warning mb-3">
            لا يوجد قالب تقييم معرف حاليًا. يرجى إنشاء قالب من إدارة النظام.
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="table-wrapper trainee-table-wrapper">
            <table className="table-custom trainee-evaluation-table">
              <thead>
                <tr>
                  <th>المحور</th>
                  <th>التقدير</th>
                  <th>الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {(template?.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="fw-bold">{item.title}</td>
                    <td className="evaluation-score-cell">
                      {item.field_type === "score" ? (
                        <input
                          type="number"
                          min="0"
                          max={item.max_score ?? 100}
                          value={selectedScores[item.id] || ""}
                          onChange={(e) =>
                            handleNotesChange(item.id, e.target.value)
                          }
                          placeholder={`أدخل درجة من 0 إلى ${item.max_score ?? 100}`}
                          className="form-control-custom"
                        />
                      ) : (
                        <span className="evaluation-na">—</span>
                      )}
                    </td>
                    <td style={{ minWidth: "280px" }}>
                      {item.field_type === "score" ? (
                        <span className="evaluation-hint">
                          أدخل الملاحظات العامة أسفل الجدول.
                        </span>
                      ) : (
                        <textarea
                          value={selectedScores[item.id] || ""}
                          onChange={(e) =>
                            handleNotesChange(item.id, e.target.value)
                          }
                          placeholder="اكتب الملاحظات"
                          className="form-textarea-custom"
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {!template?.items?.length ? (
                  <tr>
                    <td colSpan="3" className="text-center">
                      لا توجد بنود ضمن قالب التقييم الحالي.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <label className="form-label-custom">ملاحظات عامة</label>
            <textarea
              value={selectedScores.__generalNotes || ""}
              onChange={(e) => handleGeneralNotesChange(e.target.value)}
              placeholder="اكتب ملاحظات عامة حول أداء الطالب"
              className="form-textarea-custom"
            />
          </div>

          {savedMessage && (
            <div className="alert-custom alert-success mt-3">
              {savedMessage}
            </div>
          )}
          {errorMessage && (
            <div className="alert-custom alert-danger mt-3">
              {errorMessage}
            </div>
          )}

          <div className="mt-3">
            <button
              type="submit"
              className="btn-primary-custom"
              disabled={saving || !selectedStudent || !template}
            >
              {saving ? "جاري الحفظ..." : "حفظ التقييم"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TraineeStudents;