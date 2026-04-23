import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { sendTrainingRequestBatch } from "../../services/api";
import useCoordinatorBatches from "../../hooks/useCoordinatorBatches";
import {
  CoordinatorFilters,
  OfficialLetterPreview,
} from "../../components/coordinator";
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "../../config/coordinator/statusLabels";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";
import EmptyState from "../../components/common/EmptyState";

export default function CoordinatorOfficialLetters() {
  const {
    loading,
    error,
    batches,
    filters,
    setFilters,
    getBatchRequests,
    getBatchLetter,
    reload,
  } = useCoordinatorBatches();

  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchSendForm, setBatchSendForm] = useState({});

  const selectedBatch = selectedBatchId
    ? batches.find((b) => b.id === selectedBatchId)
    : null;

  const selectedBatchRequests = selectedBatchId
    ? getBatchRequests(selectedBatchId)
    : [];

  const selectedLetter = selectedBatchId
    ? getBatchLetter(selectedBatchId)
    : null;

  function setBatchSendField(batchId, key, value) {
    setBatchSendForm((prev) => ({
      ...prev,
      [batchId]: { ...(prev[batchId] || {}), [key]: value },
    }));
  }

  const handleSend = async (batchId) => {
    const data = batchSendForm[batchId] || {};
    await sendTrainingRequestBatch(batchId, {
      letter_number: data.letter_number,
      letter_date: data.letter_date,
      content: data.content,
    });
    reload();
  };

  return (
    <div className="enrollments-list">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>الكتب الرسمية والدفعات</h1>
            <p>عرض وإدارة دفعات الكتب الرسمية المرسلة للجهات الحكومية.</p>
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

      <CoordinatorFilters
        filters={filters}
        setFilters={setFilters}
        showGoverningBody
        showStatus
        showSearch
        statusOptions={Object.entries(BATCH_STATUS_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
      />

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginTop: 16 }}>
          <div className="section-card">
            <h4>قائمة الدفعات ({batches.length})</h4>
            {batches.length === 0 ? (
              <EmptyState title="لا توجد دفعات" description="لم تُنشأ أي دفعات كتب رسمية بعد." />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>رقم الدفعة</th>
                      <th>الجهة الرسمية</th>
                      <th>المديرية</th>
                      <th>عدد الطلبات</th>
                      <th>الحالة</th>
                      <th>رقم الكتاب</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => {
                      const statusLabel = BATCH_STATUS_LABELS[b.status] || b.status;
                      const statusColors = BATCH_STATUS_COLORS[b.status] || {
                        bg: "#e9ecef",
                        text: "#495057",
                      };
                      const isSelected = b.id === selectedBatchId;
                      return (
                        <tr
                          key={b.id}
                          onClick={() => setSelectedBatchId(b.id)}
                          style={{
                            cursor: "pointer",
                            background: isSelected ? "#e8f0fe" : undefined,
                          }}
                        >
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
                          <td>{b.letter_number || "—"}</td>
                          <td>
                            <button
                              className="btn-sm btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatchId(b.id);
                              }}
                            >
                              عرض
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            {selectedBatch ? (
              <OfficialLetterPreview
                batch={selectedBatch}
                requests={selectedBatchRequests}
                letter={selectedLetter}
                onSend={() => handleSend(selectedBatch.id)}
                saving={false}
              />
            ) : (
              <div className="section-card" style={{ textAlign: "center", padding: 40 }}>
                <p style={{ color: "var(--text-faint)" }}>اختر دفعة لعرض تفاصيل الكتاب الرسمي</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
