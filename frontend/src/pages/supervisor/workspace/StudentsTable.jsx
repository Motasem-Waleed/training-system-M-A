import { useMemo } from "react";

// Health indicator component
const HealthIndicator = ({ status }) => {
  const config = {
    healthy: { color: "#28a745", bg: "#e8f5e9", icon: "🟢", label: "سليم" },
    warning: { color: "#ffc107", bg: "#fff8e1", icon: "🟡", label: "تنبيه" },
    critical: { color: "#dc3545", bg: "#ffebee", icon: "🔴", label: "حرج" },
  };
  const c = config[status] || config.healthy;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        borderRadius: "16px",
        fontSize: "0.78rem",
        fontWeight: "600",
        color: c.color,
        backgroundColor: c.bg,
        border: `1px solid ${c.color}30`,
      }}
    >
      {c.icon} {c.label}
    </span>
  );
};

// Mini status badge
const MiniBadge = ({ status, label }) => {
  if (!status) return <span style={{ color: "#999" }}>—</span>;
  const colors = {
    complete: "#28a745",
    incomplete: "#dc3545",
    pending: "#ffc107",
    good: "#28a745",
    needs_review: "#fd7e14",
    missing: "#dc3545",
    submitted: "#17a2b8",
    graded: "#28a745",
    scheduled: "#6f42c1",
    done: "#28a745",
    none: "#999",
  };
  const color = colors[status] || "#999";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "10px",
        fontSize: "0.72rem",
        fontWeight: "600",
        color,
        backgroundColor: color + "15",
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
};

export default function StudentsTable({ students, searchTerm, filterSection, filterStatus, onSelectStudent }) {
  const normalized = useMemo(
    () =>
      students.map((s) => {
        const id = s.student_id ?? s.id;
        const rateRaw = s.attendance_status_summary;
        const attendance_rate =
          s.attendance_rate != null
            ? s.attendance_rate
            : rateRaw && rateRaw !== "n/a"
              ? parseFloat(String(rateRaw).replace("%", ""))
              : null;
        return {
          ...s,
          id,
          section_name: s.section_name ?? s.section,
          site_name: s.site_name ?? s.training_site,
          mentor_name: s.mentor_name ?? s.field_supervisor_name,
          health_status:
            s.health_status ??
            (s.risk_level === "critical" ? "critical" : s.risk_level === "medium" ? "warning" : "healthy"),
          attendance_rate: Number.isFinite(attendance_rate) ? attendance_rate : null,
          logs_status:
            s.logs_status ?? (typeof s.daily_log_status_summary === "number" && s.daily_log_status_summary > 0 ? "good" : "needs_review"),
          portfolio_status:
            s.portfolio_status ?? (typeof s.portfolio_completion === "number" && s.portfolio_completion > 0 ? "complete" : "incomplete"),
          evaluation_status:
            s.evaluation_status ?? (s.academic_evaluation_status === "final" ? "graded" : "pending"),
        };
      }),
    [students]
  );

  const filtered = useMemo(() => {
    let list = [...normalized];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.university_id || "").toLowerCase().includes(q) ||
          (s.site_name || "").toLowerCase().includes(q)
      );
    }

    if (filterSection) {
      list = list.filter((s) => String(s.section_id) === String(filterSection));
    }

    if (filterStatus) {
      list = list.filter((s) => s.health_status === filterStatus);
    }

    return list;
  }, [normalized, searchTerm, filterSection, filterStatus]);

  if (!normalized.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
        <h4 style={{ color: "#666" }}>لا يوجد طلبة مشرف عليهم</h4>
        <p style={{ color: "#999", fontSize: "0.9rem" }}>
          سيظهر الطلبة هنا بعد تعيينك كمشرف أكاديمي عليهم
        </p>
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🔍</div>
        <p style={{ color: "#666" }}>لا توجد نتائج مطابقة للبحث</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table" style={{ minWidth: "1100px" }}>
        <thead>
          <tr>
            <th>الطالب</th>
            <th>الرقم الجامعي</th>
            <th>الشعبة</th>
            <th>جهة التدريب</th>
            <th>المشرف الميداني</th>
            <th>الحضور</th>
            <th>السجلات</th>
            <th>الإنجاز</th>
            <th>المهام</th>
            <th>التقييم</th>
            <th>الحالة</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => onSelectStudent(s.id)}>
              <td>
                <div style={{ fontWeight: "600" }}>{s.name || "—"}</div>
                <div style={{ fontSize: "0.75rem", color: "#999" }}>{s.specialization || ""}</div>
              </td>
              <td>{s.university_id || "—"}</td>
              <td>{s.section_name || "—"}</td>
              <td>{s.site_name || "—"}</td>
              <td>{s.mentor_name || "—"}</td>
              <td>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: s.attendance_rate >= 80 ? "#28a745" : s.attendance_rate >= 60 ? "#ffc107" : "#dc3545" }}>
                    {s.attendance_rate != null ? `${s.attendance_rate}%` : "—"}
                  </span>
                </div>
              </td>
              <td>
                <MiniBadge
                  status={s.logs_status || "none"}
                  label={s.logs_status === "good" ? "مكتمل" : s.logs_status === "needs_review" ? "بانتظار" : s.logs_status === "missing" ? "ناقص" : "—"}
                />
              </td>
              <td>
                <MiniBadge
                  status={s.portfolio_status || "none"}
                  label={s.portfolio_status === "complete" ? "مكتمل" : s.portfolio_status === "incomplete" ? "ناقص" : "—"}
                />
              </td>
              <td>
                <MiniBadge
                  status={s.tasks_status || "none"}
                  label={s.tasks_status === "complete" ? "مكتمل" : s.tasks_status === "pending" ? "بانتظار" : "—"}
                />
              </td>
              <td>
                <MiniBadge
                  status={s.evaluation_status || "none"}
                  label={s.evaluation_status === "graded" ? "مقيّم" : s.evaluation_status === "pending" ? "بانتظار" : "—"}
                />
              </td>
              <td>
                <HealthIndicator status={s.health_status || "healthy"} />
              </td>
              <td>
                <button
                  className="btn-sm-custom btn-primary-custom"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStudent(s.id);
                  }}
                >
                  فتح الملف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
