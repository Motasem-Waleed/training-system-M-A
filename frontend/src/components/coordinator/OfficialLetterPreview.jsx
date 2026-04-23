import { FileText, Printer } from "lucide-react";
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "../../config/coordinator/statusLabels";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";

export default function OfficialLetterPreview({
  batch,
  requests = [],
  letter = null,
  onSend,
  saving,
}) {
  if (!batch) return null;

  const statusLabel = BATCH_STATUS_LABELS[batch.status] || batch.status;
  const statusColors = BATCH_STATUS_COLORS[batch.status] || {
    bg: "#e9ecef",
    text: "#495057",
  };

  return (
    <div className="section-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h4 style={{ margin: 0 }}>
          <FileText size={18} style={{ verticalAlign: "middle", marginLeft: 6 }} />
          كتاب رسمي — دفعة #{batch.id}
        </h4>
        <span
          style={{
            background: statusColors.bg,
            color: statusColors.text,
            padding: "4px 12px",
            borderRadius: 6,
            fontWeight: 700,
            fontSize: "0.85rem",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="info-grid" style={{ marginBottom: 16 }}>
        <div className="info-card">
          <div className="info-content">
            <div className="info-label">الجهة الرسمية</div>
            <div className="info-value">
              {getGoverningBodyLabel(batch.governing_body)}
            </div>
          </div>
        </div>
        <div className="info-card">
          <div className="info-content">
            <div className="info-label">المديرية/المنطقة</div>
            <div className="info-value">{batch.directorate || "—"}</div>
          </div>
        </div>
        <div className="info-card">
          <div className="info-content">
            <div className="info-label">رقم الكتاب</div>
            <div className="info-value">
              {letter?.letter_number || batch.letter_number || "—"}
            </div>
          </div>
        </div>
        <div className="info-card">
          <div className="info-content">
            <div className="info-label">تاريخ الكتاب</div>
            <div className="info-value">
              {letter?.letter_date || batch.letter_date || "—"}
            </div>
          </div>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="table-wrapper" style={{ marginBottom: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الرقم الجامعي</th>
                <th>التخصص</th>
                <th>جهة التدريب</th>
                <th>نوع المسار</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const s0 = r.students?.[0];
                return (
                  <tr key={r.id}>
                    <td>{s0?.user?.name || r.requested_by?.name || "—"}</td>
                    <td>{s0?.user?.university_id || "—"}</td>
                    <td>{s0?.course?.name || "—"}</td>
                    <td>{r.training_site?.name || "—"}</td>
                    <td>{r.governing_body || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {letter?.content && (
        <div
          style={{
            background: "#f8f9fa",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            whiteSpace: "pre-wrap",
            fontSize: "0.95rem",
            lineHeight: 1.8,
          }}
        >
          <strong>محتوى الكتاب:</strong>
          <br />
          {letter.content}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {batch.status === "draft" && onSend && (
          <button
            className="btn-primary"
            onClick={onSend}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Send size={16} />
            {saving ? "جاري الإرسال..." : "إرسال الكتاب"}
          </button>
        )}
        <button
          className="btn-secondary"
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Printer size={16} />
          طباعة
        </button>
      </div>
    </div>
  );
}
