const CARDS = [
  { key: "sections_count", label: "الشعب المشرف عليها", icon: "📚", color: "#4361ee", bg: "#eef0ff" },
  { key: "students_count", label: "الطلبة المشرف عليهم", icon: "👥", color: "#3a0ca3", bg: "#ede7f6" },
  { key: "visits_this_week", label: "زيارات مجدولة هذا الأسبوع", icon: "🗓️", color: "#f72585", bg: "#fce4ec" },
  { key: "unreviewed_logs", label: "سجلات يومية غير مراجعة", icon: "📝", color: "#ff9800", bg: "#fff3e0" },
  { key: "absence_alerts", label: "طلبة بغياب أو تأخر", icon: "⚠️", color: "#dc3545", bg: "#ffebee" },
  { key: "incomplete_portfolios", label: "ملفات إنجاز غير مكتملة", icon: "📁", color: "#6f42c1", bg: "#ede7f6" },
  { key: "pending_task_reviews", label: "مهام بانتظار التقييم", icon: "✅", color: "#0d6efd", bg: "#e3f2fd" },
  { key: "unevaluated_students", label: "طلبة بدون تقييم نهائي", icon: "📊", color: "#20c997", bg: "#e0f7fa" },
];

export default function DashboardSummary({ stats, loading }) {
  if (!stats) return null;
  const supervisor = stats.supervisor_profile || {};
  const department = stats.department_summary?.department || supervisor.department || "غير محدد";
  const statusDistribution = Array.isArray(stats.academic_status_distribution)
    ? stats.academic_status_distribution
    : [];

  return (
    <>
      <div className="section-card" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "0.82rem", color: "#666", marginBottom: "4px" }}>المشرف الأكاديمي</div>
          <h2 style={{ margin: 0, fontSize: "1.35rem" }}>{supervisor.name || "—"}</h2>
          <div style={{ color: "#666", marginTop: "4px" }}>القسم: {department}</div>
        </div>
        <div style={{ minWidth: "220px" }}>
          <div style={{ fontSize: "0.82rem", color: "#666", marginBottom: "8px" }}>توزيع حالات الطلاب</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {statusDistribution.length ? statusDistribution.map((item) => (
              <span key={item.status} style={{ padding: "4px 10px", borderRadius: "16px", background: "#f8f9fa", border: "1px solid #e9ecef", fontSize: "0.78rem" }}>
                {item.label}: {item.count}
              </span>
            )) : <span style={{ color: "#999" }}>لا توجد حالات بعد</span>}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {CARDS.map((card) => {
          const value = stats[card.key] ?? 0;
          const isUrgent = ["absence_alerts", "unreviewed_logs", "unevaluated_students"].includes(card.key) && value > 0;
          return (
            <div
              key={card.key}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                border: `1px solid ${isUrgent ? card.color + "40" : "#e9ecef"}`,
                borderRight: isUrgent ? `4px solid ${card.color}` : undefined,
                display: "flex",
                alignItems: "center",
                gap: "16px",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "4px" }}>{card.label}</div>
                <div style={{ fontSize: "1.6rem", fontWeight: "700", color: card.color }}>
                  {loading ? "—" : value}
                </div>
              </div>
              {isUrgent && (
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: card.color,
                    animation: "pulse 2s infinite",
                  }}
                />
              )}
            </div>
          );
        })}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </>
  );
}
