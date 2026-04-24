import { useState } from "react";
import { RefreshCw } from "lucide-react";
import useCoordinatorDistribution from "../../hooks/useCoordinatorDistribution";
import {
  RequestsTable,
  RequestReviewDrawer,
  BatchBuilder,
  CoordinatorFilters,
} from "../../components/coordinator";
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "../../config/coordinator/statusLabels";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";
import { STATUS_LABELS } from "../../config/coordinator/statusLabels";
import EmptyState from "../../components/common/EmptyState";

export default function CoordinatorTrainingRequests() {
  const {
    loading,
    saving,
    error,
    success,
    setSuccess,
    batches,
    incomingRequests,
    prelimApproved,
    coordinatorRejected,
    prelimApprovedByGroup,
    reviewDecision,
    createBatchForGroup,
    sendBatch,
    reload,
    sites,
  } = useCoordinatorDistribution();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [batchSendForm, setBatchSendForm] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  const handleView = (req) => {
    setSelectedRequest(req);
    setDrawerOpen(true);
  };

  const handleReview = async (id, decision, reason) => {
    try {
      await reviewDecision(id, decision, reason);
      setDrawerOpen(false);
      setSelectedRequest(null);
    } catch {
      // error handled in hook
    }
  };

  function setBatchSendField(batchId, key, value) {
    setBatchSendForm((prev) => ({
      ...prev,
      [batchId]: { ...(prev[batchId] || {}), [key]: value },
    }));
  }

  async function handleSendBatch(batchId) {
    const data = batchSendForm[batchId] || {};
    const payload = {
      letter_number: data.letter_number?.trim() || "",
      letter_date: data.letter_date || "",
      content: data.content?.trim() || "",
    };

    if (!payload.letter_number || !payload.letter_date || !payload.content) {
      return;
    }

    const sent = await sendBatch(batchId, payload);
    if (!sent) return;

    setBatchSendForm((prev) => {
      const next = { ...prev };
      delete next[batchId];
      return next;
    });
  }

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const filteredIncoming = filters.status
    ? incomingRequests.filter((r) => r.book_status === filters.status)
    : incomingRequests;

  const filteredSearch = filters.search
    ? filteredIncoming.filter((r) => {
        const s0 = r.students?.[0];
        const name = s0?.user?.name || r.requested_by?.name || "";
        const uid = s0?.user?.university_id || "";
        const site = r.training_site?.name || "";
        const q = filters.search.toLowerCase();
        return (
          name.toLowerCase().includes(q) ||
          uid.toLowerCase().includes(q) ||
          site.toLowerCase().includes(q)
        );
      })
    : filteredIncoming;

  return (
    <div className="enrollments-list">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>طلبات التدريب والتوزيع</h1>
            <p>مراجعة الطلبات، اعتمادها، تجميعها في كتب رسمية حسب المديرية، وإرسالها للجهات الرسمية.</p>
          </div>
          <button
            className="btn-secondary"
            onClick={reload}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            تحديث
          </button>
        </div>
      </div>

      {error && (
        <div className="section-card" style={{ marginBottom: 12 }}>
          <p className="text-danger">{error}</p>
        </div>
      )}

      {success && (
        <div className="section-card" style={{ marginBottom: 12, background: "#d4edda" }}>
          <p style={{ color: "#155724", margin: 0 }}>{success}</p>
        </div>
      )}

      <CoordinatorFilters
        filters={filters}
        setFilters={setFilters}
        showStatus
        showSearch
        statusOptions={statusOptions}
      />

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : (
        <>
          {/* المرحلة ١: طلبات واردة */}
          <div className="section-card" style={{ marginTop: 16 }}>
            <h4>طلبات واردة ({filteredSearch.length})</h4>
            {filteredSearch.length === 0 ? (
              <EmptyState title="لا توجد طلبات واردة" description="جميع الطلبات تمت مراجعتها." />
            ) : (
              <RequestsTable
                requests={filteredSearch}
                onReview={handleReview}
                onView={handleView}
                saving={saving}
              />
            )}
          </div>

          {/* المرحلة ٢: معتمد مبدئيًا — تجميع كتب رسمية */}
          <div style={{ marginTop: 16 }}>
            <BatchBuilder
              groups={prelimApprovedByGroup}
              onCreateBatchForGroup={createBatchForGroup}
              saving={saving}
            />
          </div>

          {/* المرحلة ٣: مرفوضة */}
          {coordinatorRejected.length > 0 && (
            <div className="section-card" style={{ marginTop: 16 }}>
              <h4>مرفوضة ({coordinatorRejected.length})</h4>
              <RequestsTable
                requests={coordinatorRejected}
                onView={handleView}
                showActions={false}
                saving={saving}
              />
            </div>
          )}

          {/* المرحلة ٤: دفعات الإرسال */}
          <div className="section-card" style={{ marginTop: 16 }}>
            <h4>دفعات الإرسال</h4>
            {batches.length === 0 ? (
              <EmptyState title="لا توجد دفعات" description="لم تُنشأ دفعات بعد." />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>رقم الدفعة</th>
                      <th>الجهة الرسمية</th>
                      <th>المديرية/المنطقة</th>
                      <th>عدد الطلبات</th>
                      <th>الحالة</th>
                      <th>إرسال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => {
                      const statusLabel = BATCH_STATUS_LABELS[b.status] || b.status;
                      const statusColors = BATCH_STATUS_COLORS[b.status] || { bg: "#e9ecef", text: "#495057" };
                      const batchDraft = batchSendForm[b.id] || {};
                      const isBatchFormComplete = Boolean(
                        batchDraft.letter_number?.trim() &&
                        batchDraft.letter_date &&
                        batchDraft.content?.trim()
                      );
                      return (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td>{getGoverningBodyLabel(b.governing_body)}</td>
                          <td>{b.directorate || "—"}</td>
                          <td>{b.items_count ?? "—"}</td>
                          <td>
                            <span
                              style={{
                                background: statusColors.bg,
                                color: statusColors.text,
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: "0.82rem",
                                fontWeight: 700,
                              }}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td style={{ minWidth: 320 }}>
                            {b.status === "draft" ? (
                              <div style={{ display: "grid", gap: 8 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                  <input
                                    placeholder="رقم الكتاب"
                                    value={batchSendForm[b.id]?.letter_number || ""}
                                    onChange={(e) =>
                                      setBatchSendField(b.id, "letter_number", e.target.value)
                                    }
                                  />
                                  <input
                                    type="date"
                                    value={batchSendForm[b.id]?.letter_date || ""}
                                    onChange={(e) =>
                                      setBatchSendField(b.id, "letter_date", e.target.value)
                                    }
                                  />
                                </div>
                                <textarea
                                  placeholder="محتوى الكتاب"
                                  value={batchSendForm[b.id]?.content || ""}
                                  onChange={(e) =>
                                    setBatchSendField(b.id, "content", e.target.value)
                                  }
                                  rows={2}
                                />
                                <button
                                  className="btn-sm btn-primary"
                                  onClick={() => handleSendBatch(b.id)}
                                  disabled={saving || !isBatchFormComplete}
                                  title={
                                    isBatchFormComplete
                                      ? "إرسال الدفعة"
                                      : "أدخل رقم الكتاب وتاريخه ومحتواه قبل الإرسال"
                                  }
                                >
                                  إرسال الدفعة
                                </button>
                              </div>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <RequestReviewDrawer
        request={selectedRequest}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRequest(null);
        }}
        onReview={handleReview}
        saving={saving}
        sites={sites}
      />
    </div>
  );
}
