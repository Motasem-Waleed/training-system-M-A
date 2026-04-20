import { useEffect, useState } from "react";
import {
  directorateApprove,
  getTrainingRequests,
  sendToSchool,
} from "../../services/api";
import { siteLabels } from "../../utils/roles";

const OfficialLetters = ({ siteType = "school" }) => {
  const labels = siteLabels(siteType);
  const isHealth = siteType === "health_center";
  
  // Dynamic configuration from siteLabels
  const governingBody = labels.governingBody;
  const directorateName = labels.directorateName;
  const incomingTitle = "📥 طلبات التدريب الواردة من المنسق (بانتظار القرار)";
  const approvedTitle = `✅ الطلبات المعتمدة (جاهزة للإرسال إلى ${labels.siteName})`;
  const sendButtonLabel = `📤 إرسال لـ${labels.managerLabel}`;
  const successSendMessage = `تم إرسال الطلب إلى ${labels.managerLabel} بنجاح.`;
  const pageSubtitle = isHealth
    ? "متابعة الكتب الرسمية، اعتمادها، تحديث حالتها، وإرسالها إلى المراكز الصحية."
    : "متابعة الكتب الرسمية، اعتمادها، تحديث حالتها، وإرسالها إلى المدارس.";

  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [requestDecision, setRequestDecision] = useState({});
  const [requestReason, setRequestReason] = useState({});
  const [requestSavingId, setRequestSavingId] = useState(null);
  const [sendFormMap, setSendFormMap] = useState({});
  const [sendingToSchoolId, setSendingToSchoolId] = useState(null);

  useEffect(() => {
    fetchTrainingRequests();
  }, []);

  const fetchTrainingRequests = async () => {
    try {
      setLoading(true);
      const [incomingRes, approvedRes] = await Promise.all([
        getTrainingRequests({ book_status: "sent_to_directorate", governing_body: governingBody, per_page: 100 }),
        getTrainingRequests({ book_status: "directorate_approved", governing_body: governingBody, per_page: 100 }),
      ]);
      setIncomingRequests(Array.isArray(incomingRes?.data) ? incomingRes.data : []);
      setApprovedRequests(Array.isArray(approvedRes?.data) ? approvedRes.data : []);
    } catch (error) {
      console.error("Failed to load training requests:", error);
      setErrorMessage("تعذر تحميل طلبات التدريب.");
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatusClass = (bookStatus) => {
    if (bookStatus === "directorate_approved") return "badge-custom badge-success";
    if (bookStatus === "sent_to_school") return "badge-custom badge-info";
    if (bookStatus === "rejected") return "badge-custom badge-danger";
    return "badge-custom badge-warning";
  };

  const handleRequestDecision = async (requestId) => {
    const decision = requestDecision[requestId];
    if (!decision) {
      setErrorMessage("اختر القرار للطلب قبل الحفظ.");
      return;
    }
    if (decision === "rejected" && !requestReason[requestId]?.trim()) {
      setErrorMessage("سبب الرفض مطلوب عند رفض طلب التدريب.");
      return;
    }

    try {
      setRequestSavingId(requestId);
      setSavedMessage("");
      setErrorMessage("");
      await directorateApprove(requestId, {
        status: decision,
        rejection_reason: decision === "rejected" ? requestReason[requestId] : "",
      });
      setSavedMessage(`تم تحديث قرار ${directorateName} على الطلب.`);
      await fetchTrainingRequests();
    } catch (error) {
      console.error("Failed to decide training request:", error);
      setErrorMessage(error?.response?.data?.message || "تعذر حفظ القرار.");
    } finally {
      setRequestSavingId(null);
    }
  };

  const handleSendFieldChange = (requestId, field, value) => {
    setSendFormMap((prev) => ({
      ...prev,
      [requestId]: {
        letter_number: prev[requestId]?.letter_number || "",
        letter_date: prev[requestId]?.letter_date || new Date().toISOString().slice(0, 10),
        content: prev[requestId]?.content || "",
        [field]: value,
      },
    }));
  };

  const handleSendToSchool = async (request) => {
    const form = sendFormMap[request.id] || {};
    
    const errors = [];
    if (!form.letter_number?.trim()) errors.push("رقم الكتاب");
    if (!form.letter_date) errors.push("تاريخ الكتاب");
    if (!form.content?.trim()) errors.push("محتوى الكتاب");
    
    if (errors.length > 0) {
      setErrorMessage(`يرجى تعبئة: ${errors.join("، ")}`);
      return;
    }

    try {
      setSendingToSchoolId(request.id);
      setSavedMessage("");
      setErrorMessage("");
      
      await sendToSchool(request.id, {
        letter_number: form.letter_number.trim(),
        letter_date: form.letter_date,
        content: form.content.trim()
      });
      
      setSavedMessage(successSendMessage);
      await fetchTrainingRequests();
    } catch (error) {
      console.error("Failed to send request:", error);
      setErrorMessage(error?.response?.data?.message || "تعذر إرسال الطلب.");
    } finally {
      setSendingToSchoolId(null);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">الكتب الرسمية — {directorateName}</h1>
        <p className="page-subtitle">
          {pageSubtitle}
        </p>
      </div>

      {/* Incoming Requests - Need Decision */}
      <div className="section-card mt-3">
        <h4>{incomingTitle}</h4>
        <div className="table-wrapper">
          <table className="table-custom">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>الموقع التدريبي</th>
                <th>الطالب</th>
                <th>المساق</th>
                <th>حالة الكتاب</th>
                <th>قرار المديرية</th>
                <th>سبب الرفض</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {incomingRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.letter_number || `#${request.id}`}</td>
                  <td>{request.training_site?.data?.name || request.training_site?.name || "—"}</td>
                  <td>{request.training_request_students?.[0]?.user?.name || "—"}</td>
                  <td>{request.training_request_students?.[0]?.course?.name || "—"}</td>
                  <td>
                    <span className={getRequestStatusClass(request.book_status)}>
                      {request.book_status_label || request.book_status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select-custom mb-2"
                      value={requestDecision[request.id] || ""}
                      onChange={(e) =>
                        setRequestDecision((prev) => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">اختر القرار</option>
                      <option value="approved">✅ قبول</option>
                      <option value="rejected">❌ رفض</option>
                    </select>
                  </td>
                  <td>
                    <textarea
                      className="form-textarea-custom"
                      placeholder="سبب الرفض (إجباري عند الرفض)"
                      value={requestReason[request.id] || ""}
                      onChange={(e) =>
                        setRequestReason((prev) => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))
                      }
                      disabled={(requestDecision[request.id] || "") !== "rejected"}
                      rows={2}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-primary-custom btn-sm-custom"
                      onClick={() => handleRequestDecision(request.id)}
                      disabled={requestSavingId === request.id}
                    >
                      {requestSavingId === request.id ? "جاري الحفظ..." : "💾 حفظ القرار"}
                    </button>
                  </td>
                </tr>
              ))}
              {incomingRequests.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    لا توجد طلبات واردة بانتظار القرار حاليًا
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approved Requests - Ready to Send to School */}
      <div className="section-card mt-3">
        <h4>{approvedTitle}</h4>
        <div className="table-wrapper">
          <table className="table-custom">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>الموقع التدريبي</th>
                <th>الطالب</th>
                <th>المساق</th>
                <th>تاريخ الموافقة</th>
                <th>بيانات كتاب الإرسال</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {approvedRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.letter_number || `#${request.id}`}</td>
                  <td>{request.training_site?.data?.name || request.training_site?.name || "—"}</td>
                  <td>{request.training_request_students?.[0]?.user?.name || "—"}</td>
                  <td>{request.training_request_students?.[0]?.course?.name || "—"}</td>
                  <td>{request.directorate_approved_at ? new Date(request.directorate_approved_at).toLocaleDateString('ar-SA') : "—"}</td>
                  <td>
                    <input
                      type="text"
                      className="form-control-custom mb-2"
                      placeholder="رقم كتاب الإرسال"
                      value={sendFormMap[request.id]?.letter_number || ""}
                      onChange={(e) =>
                        handleSendFieldChange(request.id, "letter_number", e.target.value)
                      }
                    />
                    <input
                      type="date"
                      className="form-control-custom mb-2"
                      value={
                        sendFormMap[request.id]?.letter_date ||
                        new Date().toISOString().slice(0, 10)
                      }
                      onChange={(e) =>
                        handleSendFieldChange(request.id, "letter_date", e.target.value)
                      }
                    />
                    <textarea
                      className="form-textarea-custom mb-2"
                      placeholder="محتوى كتاب الإرسال"
                      value={sendFormMap[request.id]?.content || ""}
                      onChange={(e) =>
                        handleSendFieldChange(request.id, "content", e.target.value)
                      }
                      rows={2}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-success-custom btn-sm-custom"
                      onClick={() => {
                        console.log("Button clicked! request.id:", request.id);
                        console.log("Form data:", sendFormMap[request.id]);
                        handleSendToSchool(request);
                      }}
                      disabled={sendingToSchoolId === request.id}
                      style={{ cursor: sendingToSchoolId === request.id ? "not-allowed" : "pointer" }}
                    >
                      {sendingToSchoolId === request.id
                        ? "⏳ جاري الإرسال..."
                        : sendButtonLabel}
                    </button>
                  </td>
                </tr>
              ))}
              {approvedRequests.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    لا توجد طلبات معتمدة جاهزة للإرسال حاليًا
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default OfficialLetters;