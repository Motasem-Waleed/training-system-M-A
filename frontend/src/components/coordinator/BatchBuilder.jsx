import { FileText, Send } from "lucide-react";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";
import StatusBadge from "./StatusBadge";

export default function BatchBuilder({
  groups = [],
  onCreateBatchForGroup,
  saving,
}) {
  if (groups.length === 0) {
    return (
      <div className="section-card">
        <h4>كتب رسمية — تجميع حسب المديرية</h4>
        <p style={{ color: "var(--text-faint)", margin: 0 }}>
          لا توجد طلبات معتمدة مبدئيًا لتجميعها في كتب رسمية.
        </p>
      </div>
    );
  }

  return (
    <div className="section-card">
      <h4 style={{ marginBottom: 16 }}>كتب رسمية — تجميع حسب المديرية</h4>
      <p style={{ color: "var(--text-faint)", marginBottom: 16, fontSize: "0.9rem" }}>
        الطلبات المعتمدة مبدئيًا مُجمّعة تلقائيًا حسب الجهة الرسمية والمديرية.
        أنشئ كتابًا رسميًا لكل مجموعة ثم أرسله للجهة المعنية.
      </p>

      {groups.map((group, idx) => {
        const groupLabel =
          group.directorate
            ? `${getGoverningBodyLabel(group.governing_body)} — ${group.directorate}`
            : getGoverningBodyLabel(group.governing_body);

        return (
          <div
            key={`${group.governing_body}-${group.directorate}-${idx}`}
            style={{
              border: "1px solid var(--border-color, #dee2e6)",
              borderRadius: 8,
              padding: 16,
              marginBottom: idx < groups.length - 1 ? 16 : 0,
              background: "var(--card-bg, #fff)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <h5 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={18} />
                  {groupLabel}
                </h5>
                <span style={{ fontSize: "0.82rem", color: "var(--text-faint)" }}>
                  {group.requests.length} طلب معتمد
                </span>
              </div>
              <button
                className="btn-primary"
                disabled={saving}
                onClick={() =>
                  onCreateBatchForGroup(
                    group.governing_body,
                    group.directorate,
                    group.requests.map((r) => r.id)
                  )
                }
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Send size={14} />
                {saving ? "جاري الإنشاء..." : `إنشاء كتاب رسمي (${group.requests.length})`}
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الطالب</th>
                    <th>الرقم الجامعي</th>
                    <th>المساق</th>
                    <th>جهة التدريب</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {group.requests.map((r) => {
                    const s0 = r.students?.[0];
                    return (
                      <tr key={r.id}>
                        <td>{s0?.user?.name || r.requested_by?.name || "—"}</td>
                        <td>{s0?.user?.university_id || "—"}</td>
                        <td>{s0?.course?.name || "—"}</td>
                        <td>{r.training_site?.name || "—"}</td>
                        <td>
                          <StatusBadge status={r.book_status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
