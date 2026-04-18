import { useEffect, useState } from "react";
import {
  directorateApprove,
  getTrainingRequests,
  sendToSchool,
} from "../../services/api";

function rows(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function HealthDirectorateDashboard() {
  const [incoming, setIncoming] = useState([]);
  const [toForward, setToForward] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendForms, setSendForms] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [inc, fwd] = await Promise.all([
        getTrainingRequests({
          book_status: "sent_to_health_ministry",
          governing_body: "ministry_of_health",
          per_page: 100,
        }),
        getTrainingRequests({
          book_status: "directorate_approved",
          governing_body: "ministry_of_health",
          per_page: 100,
        }),
      ]);
      setIncoming(rows(inc));
      setToForward(rows(fwd));
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل طلبات وزارة الصحة.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const setSendField = (id, key, value) => {
    setSendForms((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: value },
    }));
  };

  const approve = async (id) => {
    try {
      await directorateApprove(id, { status: "approved" });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشلت الموافقة");
    }
  };

  const reject = async (id) => {
    const rejection_reason = window.prompt("سبب الرفض؟");
    if (!rejection_reason) return;
    try {
      await directorateApprove(id, { status: "rejected", rejection_reason });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل الرفض");
    }
  };

  const forwardToFacility = async (id) => {
    const f = sendForms[id] || {};
    try {
      await sendToSchool(id, {
        letter_number: f.letter_number,
        letter_date: f.letter_date,
        content: f.content || "تحويل الطلب إلى جهة التدريب الصحية.",
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل إرسال الكتاب لجهة التدريب");
    }
  };

  return (
    <div className="content-header" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 className="page-title">لوحة وزارة الصحة / المديرية الصحية</h1>
      <p className="page-subtitle">
        استلام الدفعات المرسلة من الكلية، الموافقة أو الرفض، ثم تحويل الطلبات إلى المصحات أو المراكز
        التابعة.
      </p>

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : (
        <>
          {error ? (
            <div className="section-card">
              <p className="text-danger">{error}</p>
            </div>
          ) : null}

          <div className="section-card">
            <h3 className="panel-title">طلبات بانتظار مراجعة وزارة الصحة</h3>
            <p className="panel-subtitle">الحالة: مرسل لوزارة الصحة</p>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>جهة التدريب</th>
                    <th>الطالب</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {incoming.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center" }}>
                        لا توجد طلبات حالياً
                      </td>
                    </tr>
                  ) : (
                    incoming.map((r) => {
                      const s0 = r.students?.[0];
                      return (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.training_site?.name || "—"}</td>
                          <td>{s0?.user?.name || r.requested_by?.name || "—"}</td>
                          <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn-sm-custom btn-success-custom"
                              onClick={() => approve(r.id)}
                            >
                              موافقة
                            </button>
                            <button
                              type="button"
                              className="btn-sm-custom btn-danger-custom"
                              onClick={() => reject(r.id)}
                            >
                              رفض
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section-card">
            <h3 className="panel-title">تحويل إلى جهة التدريب (بعد الموافقة)</h3>
            <p className="panel-subtitle">الحالة: موافقة الجهة الرسمية — أرسل الكتاب إلى المصحة/المركز</p>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>جهة التدريب</th>
                    <th>بيانات الكتاب</th>
                  </tr>
                </thead>
                <tbody>
                  {toForward.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center" }}>
                        لا توجد طلبات جاهزة للتحويل
                      </td>
                    </tr>
                  ) : (
                    toForward.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.training_site?.name || "—"}</td>
                        <td style={{ minWidth: 280 }}>
                          <div style={{ display: "grid", gap: 8 }}>
                            <input
                              className="form-input-custom"
                              placeholder="رقم الكتاب"
                              value={sendForms[r.id]?.letter_number || ""}
                              onChange={(e) =>
                                setSendField(r.id, "letter_number", e.target.value)
                              }
                            />
                            <input
                              type="date"
                              className="form-input-custom"
                              value={sendForms[r.id]?.letter_date || ""}
                              onChange={(e) =>
                                setSendField(r.id, "letter_date", e.target.value)
                              }
                            />
                            <textarea
                              className="form-textarea-custom"
                              rows={2}
                              placeholder="محتوى الكتاب"
                              value={sendForms[r.id]?.content || ""}
                              onChange={(e) =>
                                setSendField(r.id, "content", e.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="btn-primary-custom"
                              onClick={() => forwardToFacility(r.id)}
                            >
                              إرسال لجهة التدريب
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
