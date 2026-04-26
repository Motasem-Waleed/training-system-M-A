import { useState } from "react";
import { FileText, Send, Users, GraduationCap, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "../../config/coordinator/statusLabels";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";
import StatusBadge from "./StatusBadge";

export default function OfficialLetterPreview({
  batch,
  requests = [],
  letter = null,
  onSend,
  saving,
}) {
  const [showAllStudents, setShowAllStudents] = useState(false);

  if (!batch) return null;

  // Use provided requests prop, or fallback to embedded batch data
  const displayRequests = requests.length > 0 ? requests : (batch.training_requests || batch.trainingRequests || batch.requests || batch.items || []);

  const visibleRequests = showAllStudents ? displayRequests : displayRequests.slice(0, 5);
  const hasMoreStudents = displayRequests.length > 5;

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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="section-icon" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)" }}>
            <FileText size={20} />
          </div>
          <h4 style={{ margin: 0 }}>كتاب رسمي — دفعة #{batch.id}</h4>
        </div>
        <span
          style={{
            background: statusColors.bg,
            color: statusColors.text,
            padding: "4px 12px",
            borderRadius: 99,
            fontWeight: 700,
            fontSize: "0.78rem",
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

      {/* Students Section */}
      {displayRequests.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--info) 0%, #0aa2c0 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Users size={16} />
            </div>
            <h5 style={{ margin: 0, fontSize: "0.95rem" }}>الطلاب في الدفعة</h5>
            <span style={{
              background: "rgba(59, 130, 182, 0.1)",
              color: "var(--info)",
              padding: "2px 10px",
              borderRadius: 99,
              fontSize: "0.78rem",
              fontWeight: 700,
            }}>
              {displayRequests.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleRequests.map((r) => {
              const s0 = r.students?.[0];
              const studentName = s0?.user?.name || r.requested_by?.name || "—";
              const universityId = s0?.user?.university_id || "—";
              const courseName = s0?.course?.name || "—";
              const siteName = r.training_site?.name || r.training_site?.label || "—";
              const phone = s0?.user?.phone || "";
              const email = s0?.user?.email || "";
              return (
                <div
                  key={r.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "#fff",
                    transition: "var(--transition)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, var(--accent) 0%, #c49b66 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "0.82rem",
                        fontWeight: 800,
                      }}>
                        {studentName.charAt(0)}
                      </div>
                      <div>
                        <h6 style={{ margin: 0, fontSize: "0.9rem" }}>{studentName}</h6>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>
                          {universityId}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={r.book_status} />
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: "0.82rem", color: "var(--text-soft)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <GraduationCap size={13} style={{ color: "var(--accent)" }} />
                      {courseName}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <FileText size={13} style={{ color: "var(--info)" }} />
                      {siteName}
                    </span>
                    {phone && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Phone size={13} style={{ color: "var(--success)" }} />
                        {phone}
                      </span>
                    )}
                    {email && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Mail size={13} style={{ color: "var(--warning)" }} />
                        {email}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {displayRequests.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: 20,
          borderRadius: 12,
          background: "#fbfcfe",
          border: "1px dashed var(--border)",
          marginBottom: 16,
        }}>
          <p style={{ color: "var(--text-faint)", margin: 0, fontSize: "0.88rem" }}>لا توجد طلبات في هذه الدفعة</p>
        </div>
      )}

      {hasMoreStudents && (
        <button
          onClick={() => setShowAllStudents(!showAllStudents)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "10px",
            marginTop: 8,
            background: "transparent",
            border: "1px dashed var(--border)",
            borderRadius: 10,
            color: "var(--info)",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {showAllStudents ? (
            <>
              إخفاء <ChevronUp size={16} />
            </>
          ) : (
            <>
              عرض الكل ({displayRequests.length - 5} إضافي) <ChevronDown size={16} />
            </>
          )}
        </button>
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
            className="btn-primary-custom"
            onClick={onSend}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Send size={16} />
            {saving ? "جاري الإرسال..." : "إرسال الكتاب"}
          </button>
        )}
      </div>
    </div>
  );
}
