import { Eye, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";

export default function RequestsTable({
  requests = [],
  onReview,
  onView,
  saving = false,
  showActions = true,
  showCheckbox = false,
  selectedForBatch = {},
  onToggleSelect,
}) {
  if (requests.length === 0) {
    return (
      <div className="section-card" style={{ textAlign: "center", padding: 24 }}>
        <p style={{ color: "var(--text-faint)", margin: 0 }}>لا توجد طلبات</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {showCheckbox && <th></th>}
            <th>الطالب</th>
            <th>الرقم الجامعي</th>
            <th>المساق</th>
            <th>جهة التدريب</th>
            <th>الجهة الرسمية</th>
            <th>الحالة</th>
            {showActions && <th>إجراء</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const s0 = r.students?.[0];
            return (
              <tr key={r.id}>
                {showCheckbox && (
                  <td>
                    <input
                      type="checkbox"
                      checked={!!selectedForBatch[r.id]}
                      onChange={(e) =>
                        onToggleSelect?.(r.id, e.target.checked)
                      }
                    />
                  </td>
                )}
                <td>{s0?.user?.name || r.requested_by?.name || "—"}</td>
                <td>{s0?.user?.university_id || "—"}</td>
                <td>{s0?.course?.name || "—"}</td>
                <td>{r.training_site?.name || "—"}</td>
                <td>
                  {getGoverningBodyLabel(r.governing_body) || "—"}
                </td>
                <td>
                  <StatusBadge status={r.book_status} />
                </td>
                {showActions && (
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {onView && (
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => onView(r)}
                        disabled={saving}
                        style={{ display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Eye size={14} />
                        عرض
                      </button>
                    )}
                    {onReview && (
                      <>
                        <button
                          className="btn-sm btn-primary"
                          disabled={saving}
                          onClick={() => onReview(r.id, "prelim_approved")}
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <CheckCircle2 size={14} />
                          اعتماد
                        </button>
                        <button
                          className="btn-sm btn-secondary"
                          disabled={saving}
                          onClick={() => onReview(r.id, "needs_edit")}
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <AlertTriangle size={14} />
                          تعديل
                        </button>
                        <button
                          className="btn-sm btn-secondary"
                          disabled={saving}
                          onClick={() => onReview(r.id, "rejected")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: "var(--danger)",
                          }}
                        >
                          <XCircle size={14} />
                          رفض
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
