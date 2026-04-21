import { useEffect, useState } from "react";
import { apiClient } from "../../services/api";

export default function CoordinatorTrainingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/training-requests", {
        params: { book_status: "sent_to_coordinator" }
      });
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id) => {
    try {
      await apiClient.post(`/training-requests/${id}/coordinator-review`, {
        decision,
        reason: decision !== "prelim_approved" ? reason : undefined
      });
      alert("تمت المراجعة بنجاح");
      setSelectedRequest(null);
      setDecision("");
      setReason("");
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "فشلت المراجعة");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent_to_coordinator: { bg: "#fff3cd", text: "#856404", label: "بانتظار المنسق" },
      prelim_approved: { bg: "#d4edda", text: "#155724", label: "معتمد مبدئياً" },
      coordinator_rejected: { bg: "#f8d7da", text: "#721c24", label: "مرفوض من المنسق" },
      needs_edit: { bg: "#d1ecf1", text: "#0c5460", label: "يحتاج تعديل" },
    };
    const badge = badges[status] || { bg: "#e9ecef", text: "#6c757d", label: status };
    return (
      <span style={{ background: badge.bg, color: badge.text, padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="container-fluid py-4">
      <h2>طلبات التدريب بانتظار المراجعة</h2>
      
      {loading ? (
        <p>جاري التحميل...</p>
      ) : requests.length === 0 ? (
        <p className="text-muted">لا توجد طلبات بانتظار المراجعة</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>الطالب</th>
              <th>موقع التدريب</th>
              <th>الفترة</th>
              <th>الحالة</th>
              <th>تاريخ التقديم</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.requested_by?.name || "—"}</td>
                <td>{req.training_site?.name || "—"}</td>
                <td>{req.training_period?.name || "—"}</td>
                <td>{getStatusBadge(req.book_status)}</td>
                <td>{req.requested_at ? new Date(req.requested_at).toLocaleDateString("ar-SA") : "—"}</td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => setSelectedRequest(req)}>
                    مراجعة
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedRequest && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">مراجعة طلب التدريب #{selectedRequest.id}</h5>
                <button className="btn-close" onClick={() => setSelectedRequest(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">القرار</label>
                  <select className="form-select" value={decision} onChange={(e) => setDecision(e.target.value)}>
                    <option value="">اختر القرار...</option>
                    <option value="prelim_approved">اعتماد مبدئي</option>
                    <option value="needs_edit">يحتاج تعديل</option>
                    <option value="rejected">رفض</option>
                  </select>
                </div>
                {decision !== "prelim_approved" && decision !== "" && (
                  <div className="mb-3">
                    <label className="form-label">السبب</label>
                    <textarea className="form-control" rows="3" value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>إلغاء</button>
                <button className="btn btn-primary" onClick={() => handleReview(selectedRequest.id)} disabled={!decision}>
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
