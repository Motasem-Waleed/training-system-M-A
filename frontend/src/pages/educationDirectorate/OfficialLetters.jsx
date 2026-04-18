import { useEffect, useState } from "react";
import {
  approveOfficialLetter,
  directorateApprove,
  getOfficialLetters,
  getTrainingRequests,
  sendToSchool,
} from "../../services/api";

const normalizeLetter = (item) => ({
  id: item.id,
  title:
    item.training_request?.title ||
    item.letter_number ||
    item.type_label ||
    "بدون عنوان",
  receiver:
    item.training_site?.name ||
    item.received_by?.data?.name ||
    item.received_by?.name ||
    "غير محدد",
  date: item.letter_date || item.created_at || "—",
  status: item.status || "sent_to_directorate",
  status_label: item.status_label || "مرسل للمديرية",
  rejection_reason: item.rejection_reason || "",
});

const OfficialLetters = () => {
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState([]);
  const [decisionMap, setDecisionMap] = useState({});
  const [reasonMap, setReasonMap] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestDecision, setRequestDecision] = useState({});
  const [requestReason, setRequestReason] = useState({});
  const [requestSavingId, setRequestSavingId] = useState(null);
  const [sendFormMap, setSendFormMap] = useState({});
  const [sendingToSchoolId, setSendingToSchoolId] = useState(null);

  useEffect(() => {
    fetchLetters();
    fetchTrainingRequests();
  }, []);

  const fetchLetters = async () => {
    try {
      setLoading(true);

      const data = await getOfficialLetters();

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setLetters(list.map(normalizeLetter));
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to load official letters:", error);
      setErrorMessage("تعذر تحميل الكتب الرسمية.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingRequests = async () => {
    try {
      const data = await getTrainingRequests({ per_page: 100 });
      const list = Array.isArray(data?.data) ? data.data : [];
      setRequests(list);
    } catch (error) {
      console.error("Failed to load training requests:", error);
    }
  };

  const handleDecisionChange = (id, value) => {
    setDecisionMap((prev) => ({ ...prev, [id]: value }));
    setSavedMessage("");
    setErrorMessage("");
  };

  const handleReasonChange = (id, value) => {
    setReasonMap((prev) => ({ ...prev, [id]: value }));
    setSavedMessage("");
    setErrorMessage("");
  };

  const handleApprove = async (letter) => {
    const decision = decisionMap[letter.id];
    if (!decision) {
      setErrorMessage("اختر القرار قبل الحفظ.");
      return;
    }

    if (decision === "rejected" && !reasonMap[letter.id]?.trim()) {
      setErrorMessage("سبب الرفض مطلوب عند اختيار الرفض.");
      return;
    }

    try {
      setSavingId(letter.id);
      setSavedMessage("");
      setErrorMessage("");

      await approveOfficialLetter(letter.id, {
        status: decision,
        rejection_reason: decision === "rejected" ? reasonMap[letter.id] : "",
      });

      setSavedMessage("تم تحديث حالة الكتاب بنجاح.");
      setDecisionMap((prev) => ({ ...prev, [letter.id]: "" }));
      setReasonMap((prev) => ({ ...prev, [letter.id]: "" }));
      await fetchLetters();
    } catch (error) {
      console.error("Failed to save official letters:", error);
      setErrorMessage(
        error?.response?.data?.message || "تعذر تحديث حالة الكتاب الرسمي."
      );
    } finally {
      setSavingId(null);
    }
  };

  const getBadgeClass = (status) => {
    if (status === "directorate_approved") return "badge-custom badge-success";
    if (status === "sent_to_school" || status === "school_received") {
      return "badge-custom badge-info";
    }
    if (status === "completed") return "badge-custom badge-soft";
    if (status === "rejected") return "badge-custom badge-danger";
    return "badge-custom badge-warning";
  };

  const getRequestStatusClass = (bookStatus) => {
    if (bookStatus === "directorate_approved") return "badge-custom badge-success";
    if (bookStatus === "sent_to_school") return "badge-custom badge-info";
    if (bookStatus === "rejected") return "badge-custom badge-danger";
    return "badge-custom badge-warning";
  };

  const canBeDecided = (bookStatus) => bookStatus === "sent_to_directorate";

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
      setSavedMessage("تم تحديث قرار مديرية التربية على الطلب.");
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
        letter_date:
          prev[requestId]?.letter_date ||
          new Date().toISOString().slice(0, 10),
        content: prev[requestId]?.content || "",
        [field]: value,
      },
    }));
  };

  const handleSendToSchool = async (request) => {
    const form = sendFormMap[request.id] || {};
    if (!form.letter_number || !form.letter_date || !form.content) {
      setErrorMessage("يرجى تعبئة رقم الكتاب وتاريخه ومحتواه قبل الإرسال للمدرسة.");
      return;
    }

    try {
      setSendingToSchoolId(request.id);
      setSavedMessage("");
      setErrorMessage("");
      await sendToSchool(request.id, form);
      setSavedMessage("تم إرسال الطلب إلى مدراء المدارس بنجاح.");
      await fetchTrainingRequests();
    } catch (error) {
      console.error("Failed to send request to school:", error);
      setErrorMessage(error?.response?.data?.message || "تعذر إرسال الطلب للمدرسة.");
    } finally {
      setSendingToSchoolId(null);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">الكتب الرسمية</h1>
        <p className="page-subtitle">
          متابعة الكتب الرسمية، اعتمادها، تحديث حالتها، وإرسالها إلى المدارس.
        </p>
      </div>

      <div className="section-card">
        <h4>إدارة الكتب الرسمية</h4>

        {loading ? (
          <div className="alert-custom alert-info">جاري تحميل الكتب الرسمية...</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>عنوان الكتاب</th>
                    <th>الجهة المستلمة</th>
                    <th>التاريخ</th>
                    <th>الحالة الحالية</th>
                    <th>القرار</th>
                    <th>سبب الرفض</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {letters.map((letter) => (
                    <tr key={letter.id}>
                      <td>{letter.title}</td>
                      <td>{letter.receiver}</td>
                      <td>{letter.date}</td>
                      <td>
                        <span className={getBadgeClass(letter.status)}>
                          {letter.status_label}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select-custom"
                          value={decisionMap[letter.id] || ""}
                          onChange={(e) =>
                            handleDecisionChange(letter.id, e.target.value)
                          }
                        >
                          <option value="">اختر القرار</option>
                          <option value="approved">موافقة</option>
                          <option value="rejected">رفض</option>
                        </select>
                      </td>
                      <td>
                        <textarea
                          className="form-textarea-custom"
                          value={reasonMap[letter.id] || letter.rejection_reason || ""}
                          onChange={(e) =>
                            handleReasonChange(letter.id, e.target.value)
                          }
                          placeholder="اكتب سبب الرفض عند الحاجة"
                          disabled={(decisionMap[letter.id] || "") !== "rejected"}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-primary-custom btn-sm-custom"
                          onClick={() => handleApprove(letter)}
                          disabled={savingId === letter.id}
                        >
                          {savingId === letter.id ? "جاري الحفظ..." : "حفظ"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {letters.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center">
                        لا توجد كتب رسمية مسجلة حاليًا
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
          </>
        )}
      </div>

      <div className="section-card mt-3">
        <h4>طلبات التدريب الواردة من المنسق</h4>
        <div className="table-wrapper">
          <table className="table-custom">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>الموقع التدريبي</th>
                <th>حالة الكتاب</th>
                <th>سبب الرفض</th>
                <th>قرار المديرية</th>
                <th>إرسال للمدرسة</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.letter_number || `#${request.id}`}</td>
                  <td>{request.training_site?.data?.name || request.training_site?.name || "—"}</td>
                  <td>
                    <span className={getRequestStatusClass(request.book_status)}>
                      {request.book_status_label || request.book_status}
                    </span>
                  </td>
                  <td>{request.rejection_reason || "—"}</td>
                  <td>
                    {canBeDecided(request.book_status) ? (
                      <>
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
                          <option value="approved">قبول</option>
                          <option value="rejected">رفض</option>
                        </select>
                        <textarea
                          className="form-textarea-custom mb-2"
                          placeholder="سبب الرفض (إجباري عند الرفض)"
                          value={requestReason[request.id] || ""}
                          onChange={(e) =>
                            setRequestReason((prev) => ({
                              ...prev,
                              [request.id]: e.target.value,
                            }))
                          }
                          disabled={(requestDecision[request.id] || "") !== "rejected"}
                        />
                        <button
                          type="button"
                          className="btn-primary-custom btn-sm-custom"
                          onClick={() => handleRequestDecision(request.id)}
                          disabled={requestSavingId === request.id}
                        >
                          {requestSavingId === request.id ? "جاري الحفظ..." : "حفظ القرار"}
                        </button>
                      </>
                    ) : (
                      <span className="text-muted">تم اتخاذ القرار مسبقًا</span>
                    )}
                  </td>
                  <td>
                    {request.book_status === "directorate_approved" ? (
                      <>
                        <input
                          type="text"
                          className="form-control-custom mb-2"
                          placeholder="رقم كتاب الإرسال للمدرسة"
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
                          placeholder="محتوى كتاب الإرسال للمدرسة"
                          value={sendFormMap[request.id]?.content || ""}
                          onChange={(e) =>
                            handleSendFieldChange(request.id, "content", e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="btn-secondary-custom btn-sm-custom"
                          onClick={() => handleSendToSchool(request)}
                          disabled={sendingToSchoolId === request.id}
                        >
                          {sendingToSchoolId === request.id
                            ? "جاري الإرسال..."
                            : "إرسال لمدير المدرسة"}
                        </button>
                      </>
                    ) : request.book_status === "sent_to_school" ? (
                      <span className="text-success">تم الإرسال</span>
                    ) : (
                      <span className="text-muted">متاح بعد قبول المديرية</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">
                    لا توجد طلبات تدريب واردة حاليًا
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