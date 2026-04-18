import { useEffect, useState } from "react";
import { getOfficialLetters, receiveOfficialLetter } from "../../services/api";

const normalizeLetter = (item) => ({
  id: item.id,
  subject:
    item.training_request?.data?.letter_number ||
    item.training_request?.letter_number ||
    item.letter_number ||
    "بدون عنوان",
  sender: item.sent_by?.data?.name || item.sent_by?.name || "غير محدد",
  date: item.letter_date || item.created_at || "—",
  status: item.status || "sent_to_school",
  status_label: item.status_label || "مرسل للمدرسة",
});

const OfficialLetters = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const data = await getOfficialLetters({ type: "to_school", per_page: 100 });
      const list = Array.isArray(data?.data) ? data.data : [];
      setLetters(list.map(normalizeLetter));
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to load school letters:", error);
      setErrorMessage("تعذر تحميل الكتب الرسمية.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "sent_to_school") return "badge-custom badge-info";
    if (status === "school_received") return "badge-custom badge-success";
    if (status === "completed") return "badge-custom badge-soft";
    return "badge-custom badge-warning";
  };

  const handleReceive = async (letter) => {
    try {
      setSavingId(letter.id);
      setSavedMessage("");
      setErrorMessage("");
      await receiveOfficialLetter(letter.id, {
        received_at: new Date().toISOString(),
        status: "school_received",
      });
      setSavedMessage("تم استلام الكتاب وتحديث حالته بنجاح.");
      await fetchLetters();
    } catch (error) {
      console.error("Failed to receive official letter:", error);
      setErrorMessage(error?.response?.data?.message || "تعذر استلام الكتاب.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">الكتب الرسمية</h1>
        <p className="page-subtitle">
          متابعة الكتب الرسمية الواردة من المديرية أو الكلية وإدارة حالتها.
        </p>
      </div>

      <div className="section-card">
        <h4>إدارة الكتب الرسمية</h4>
        {loading ? (
          <div className="alert-custom alert-info">جاري تحميل الكتب الرسمية...</div>
        ) : (
          <div className="table-wrapper">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>عنوان الكتاب</th>
                  <th>الجهة المرسلة</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {letters.map((letter) => (
                  <tr key={letter.id}>
                    <td className="fw-bold">{letter.subject}</td>
                    <td>{letter.sender}</td>
                    <td>{letter.date}</td>
                    <td>
                      <span className={getStatusClass(letter.status)}>
                        {letter.status_label}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-primary-custom btn-sm-custom"
                        onClick={() => handleReceive(letter)}
                        disabled={savingId === letter.id || letter.status === "school_received"}
                      >
                        {savingId === letter.id
                          ? "جاري التحديث..."
                          : letter.status === "school_received"
                          ? "تم الاستلام"
                          : "تأكيد الاستلام"}
                      </button>
                    </td>
                  </tr>
                ))}

                {letters.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center">
                      لا توجد كتب رسمية حاليًا
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {savedMessage && (
          <div className="alert-custom alert-success mt-3">{savedMessage}</div>
        )}
        {errorMessage && (
          <div className="alert-custom alert-danger mt-3">{errorMessage}</div>
        )}
      </div>
    </>
  );
};

export default OfficialLetters;