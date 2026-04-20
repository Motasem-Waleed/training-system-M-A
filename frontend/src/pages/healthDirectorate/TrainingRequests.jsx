import { useEffect, useState } from "react";
import { apiClient } from "../../services/api";

export default function HealthDirectorateTrainingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/training-requests", {
        params: { book_status: "sent_to_directorate", governing_body: "ministry_of_health" }
      });
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.post(`/training-requests/${id}/directorate-approve`, { status: "approved" });
      alert("تمت الموافقة بنجاح");
      setSelectedRequest(null);
      setDecision("");
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "فشلت العملية");
    }
  };

  const handleReject = async (id) => {
    try {
      await apiClient.post(`/training-requests/${id}/directorate-approve`, {
        status: "rejected",
        rejection_reason: rejectionReason
      });
      alert("تم الرفض بنجاح");
      setSelectedRequest(null);
      setDecision("");
      setRejectionReason("");
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "فشلت العملية");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent_to_directorate: { bg: "#fff3cd", text: "#856404", label: "بانتظار المديرية" },
      directorate_approved: { bg: "#d4edda", text: "#155724", label: "معتمد من المديرية" },
      rejected: { bg: "#f8d7da", text: "#721c24", label: "مرفوض" },
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
      <h2>طلبات التدريب - وزارة الصحة</h2>
      
      {loading ? (
        <p>جاري التحميل...</p>
      ) : requests.length === 0 ? (
        <p className="text-muted">لا توجد طلبات بانتظار الموافقة</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>الطالب</th>
              <th>موقع التدريب</th>
              <th>الفترة</th>
              <th>الحالة</th>
              <th>تاريخ الإرسال</th>
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
                <td>{req.sent_to_directorate_at ? new Date(req.sent_to_directorate_at).toLocaleDateString("ar-SA") : "—"}</td>
                <td>
                  <button className="btn btn-sm btn-success me-1" onClick={() => { setSelectedRequest(req); setDecision("approve"); }}>
                    موافقة
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => { setSelectedRequest(req); setDecision("reject"); }}>
                    رفض
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedRequest && decision === "approve" && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">تأكيد الموافقة على الطلب #{selectedRequest.id}</h5>
                <button className="btn-close" onClick={() => setSelectedRequest(null)}></button>
              </div>
              <div className="modal-body">
                <p>هل أنت متأكد من الموافقة على هذا الطلب؟</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>إلغاء</button>
                <button className="btn btn-success" onClick={() => handleApprove(selectedRequest.id)}>
                  تأكيد الموافقة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRequest && decision === "reject" && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">رفض الطلب #{selectedRequest.id}</h5>
                <button className="btn-close" onClick={() => setSelectedRequest(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">سبب الرفض</label>
                  <textarea className="form-control" rows="3" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>إلغاء</button>
                <button className="btn btn-danger" onClick={() => handleReject(selectedRequest.id)} disabled={!rejectionReason}>
                  تأكيد الرفض
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
