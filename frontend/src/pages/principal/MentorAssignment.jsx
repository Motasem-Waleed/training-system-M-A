import { useEffect, useMemo, useState } from "react";
import {
  getSchoolManagerMentorRequests,
  getSchoolManagerTeachers,
  itemsFromPagedResponse,
  schoolManagerApproveRequest,
} from "../../services/api";

const teacherId = (user) =>
  user?.id ?? user?.data?.id ?? null;

const personName = (user) =>
  user?.name ?? user?.data?.name ?? "";

const normalizeRowsFromRequest = (request) =>
  (request.students || []).map((student) => {
    const mentor = student.assigned_teacher || student.assignedTeacher;
    const mid = teacherId(mentor);
    return {
      requestId: request.id,
      studentRowId: student.id,
      studentName: personName(student.user) || "طالب غير معروف",
      universityId: student.user?.university_id || student.user?.data?.university_id || "—",
      specialization:
        student.course?.name || student.course?.data?.name || "—",
      status: student.status_label || student.status || "قيد المراجعة",
      mentorId: mid ? String(mid) : "",
      notes: student.notes || "",
    };
  });

export default function MentorAssignment() {
  const [requests, setRequests] = useState([]);
  const [rows, setRows] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingRequestId, setSavingRequestId] = useState(null);

  const rowsByRequest = useMemo(() => {
    const map = {};
    rows.forEach((row) => {
      if (!map[row.requestId]) map[row.requestId] = [];
      map[row.requestId].push(row);
    });
    return map;
  }, [rows]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, teachersRes] = await Promise.all([
        getSchoolManagerMentorRequests({ per_page: 100 }),
        getSchoolManagerTeachers(),
      ]);

      const list = itemsFromPagedResponse(requestsRes);
      setRequests(list);

      const teacherList = itemsFromPagedResponse(teachersRes);
      setTeachers(teacherList);

      setRows(list.flatMap(normalizeRowsFromRequest));
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to load mentor assignment data:", error);
      setErrorMessage("تعذر تحميل بيانات التعيين.");
    } finally {
      setLoading(false);
    }
  };

  const handleMentorChange = (studentRowId, mentorIdVal) => {
    setRows((prev) =>
      prev.map((row) =>
        row.studentRowId === studentRowId ? { ...row, mentorId: mentorIdVal } : row
      )
    );
    setSavedMessage("");
  };

  const handleNotesChange = (studentRowId, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.studentRowId === studentRowId ? { ...row, notes: value } : row
      )
    );
    setSavedMessage("");
  };

  const handleRequestApprove = async (requestId) => {
    const requestRows = rowsByRequest[requestId] || [];
    if (!requestRows.length) return;

    const hasUnassigned = requestRows.some((row) => !row.mentorId);
    if (hasUnassigned) {
      setErrorMessage("يجب تعيين معلم مرشد لكل طالب قبل اعتماد الطلب.");
      return;
    }

    try {
      setSavingRequestId(requestId);
      setSavedMessage("");
      setErrorMessage("");
      await schoolManagerApproveRequest(requestId, {
        status: "approved",
        students: requestRows.map((row) => ({
          id: row.studentRowId,
          assigned_teacher_id: Number(row.mentorId),
        })),
      });
      setSavedMessage("تم اعتماد الطلب وتعيين المعلمين المرشدين بنجاح.");
      await fetchData();
    } catch (error) {
      console.error("Failed to approve request:", error);
      setErrorMessage(error?.response?.data?.message || "تعذر اعتماد الطلب.");
    } finally {
      setSavingRequestId(null);
    }
  };

  const handleRequestReject = async (requestId) => {
    const reason = window.prompt("اكتب سبب الرفض:");
    if (!reason?.trim()) return;

    try {
      setSavingRequestId(requestId);
      setSavedMessage("");
      setErrorMessage("");
      await schoolManagerApproveRequest(requestId, {
        status: "rejected",
        rejection_reason: reason.trim(),
      });
      setSavedMessage("تم رفض الطلب وتسجيل السبب.");
      await fetchData();
    } catch (error) {
      console.error("Failed to reject request:", error);
      setErrorMessage(error?.response?.data?.message || "تعذر رفض الطلب.");
    } finally {
      setSavingRequestId(null);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">طلبات التدريب — مراجعة وتعيين المرشد</h1>
        <p className="page-subtitle">
          تظهر هنا الطلبات المرسلة إلى جهة التدريب التابعة لك. راجع بيانات كل طالب، عيّن المعلم
          المرشد، ثم اعتمد الطلب أو ارفضه مع توضيح السبب.
        </p>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="alert-custom alert-info">جاري تحميل البيانات...</div>
        ) : requests.length === 0 ? (
          <div className="alert-custom alert-info">
            لا توجد طلبات بحالة «مرسل إلى جهة التدريب» حالياً. عند وصول كتاب من المديرية أو الجهة
            الصحية سيظهر الطلب هنا.
          </div>
        ) : (
          requests.map((req) => {
            const site = req.training_site || req.trainingSite;
            const period = req.training_period || req.trainingPeriod;
            const reqRows = rowsByRequest[req.id] || [];

            return (
              <div
                key={req.id}
                className="section-card mb-3"
                style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="panel-header" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 className="panel-title" style={{ marginBottom: 6 }}>
                      طلب تدريب #{req.id}
                      {req.letter_number ? ` — ${req.letter_number}` : ""}
                    </h3>
                    <p className="panel-subtitle" style={{ margin: 0 }}>
                      <strong>جهة التدريب:</strong> {site?.name || "—"}
                      {site?.location ? ` — ${site.location}` : ""}
                      <br />
                      <strong>المديرية:</strong> {site?.directorate || "—"} —{" "}
                      <strong>الجهة الرسمية:</strong>{" "}
                      {req.governing_body === "ministry_of_health"
                        ? "وزارة الصحة"
                        : req.governing_body === "directorate_of_education"
                          ? "التربية والتعليم"
                          : req.governing_body || "—"}
                      {period?.name ? (
                        <>
                          <br />
                          <strong>فترة التدريب:</strong> {period.name}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="badge-custom badge-warning">
                      {req.book_status_label || req.book_status}
                    </span>
                    <button
                      type="button"
                      className="btn-success-custom btn-sm-custom"
                      disabled={savingRequestId === req.id}
                      onClick={() => handleRequestApprove(req.id)}
                    >
                      قبول وتعيين المرشدين
                    </button>
                    <button
                      type="button"
                      className="btn-danger-custom btn-sm-custom"
                      disabled={savingRequestId === req.id}
                      onClick={() => handleRequestReject(req.id)}
                    >
                      رفض الطلب
                    </button>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>الرقم الجامعي</th>
                        <th>المساق</th>
                        <th>حالة السجل</th>
                        <th>المعلم المرشد</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center" }}>
                            لا يوجد طلاب مرتبطون بهذا الطلب
                          </td>
                        </tr>
                      ) : (
                        reqRows.map((student) => (
                          <tr key={student.studentRowId}>
                            <td className="fw-bold">{student.studentName}</td>
                            <td>{student.universityId}</td>
                            <td>{student.specialization}</td>
                            <td>
                              <span className="badge-custom badge-info">{student.status}</span>
                            </td>
                            <td style={{ minWidth: 220 }}>
                              <select
                                value={student.mentorId}
                                onChange={(e) =>
                                  handleMentorChange(student.studentRowId, e.target.value)
                                }
                                className="form-select-custom"
                              >
                                <option value="">اختر المعلم المرشد</option>
                                {teachers.map((mentor) => (
                                  <option key={mentor.id} value={mentor.id}>
                                    {mentor.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ minWidth: 200 }}>
                              <textarea
                                value={student.notes}
                                onChange={(e) =>
                                  handleNotesChange(student.studentRowId, e.target.value)
                                }
                                placeholder="ملاحظات داخلية (اختياري)"
                                className="form-textarea-custom"
                                rows={2}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}

        {savedMessage ? (
          <div className="alert-custom alert-success mt-3">{savedMessage}</div>
        ) : null}
        {errorMessage ? (
          <div className="alert-custom alert-danger mt-3">{errorMessage}</div>
        ) : null}
      </div>
    </>
  );
}
