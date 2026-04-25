import { useState } from "react";
import { BarChart3, Loader2, Users, Building2, BookOpen, XCircle, FileText, GraduationCap, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import useCoordinatorStatistics from "../../hooks/useCoordinatorStatistics";
import { STATUS_LABELS, STATUS_COLORS, BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "../../config/coordinator/statusLabels";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";
import EmptyState from "../../components/common/EmptyState";

const LIMIT = 5;

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div style={{
      background: gradient,
      borderRadius: 14,
      padding: 16,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: "rgba(255,255,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={22} />
      </div>
      <div>
        <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>{label}</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}

function StatSection({ icon: Icon, title, iconBg, items, renderLabel, renderCount, showAll, setShowAll }) {
  const visible = showAll ? items : items.slice(0, LIMIT);
  const hasMore = items.length > LIMIT;
  return (
    <div className="section-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div className="section-icon" style={{ background: iconBg }}>
          <Icon size={18} />
        </div>
        <h5 style={{ margin: 0 }}>{title}</h5>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((item, idx) => (
          <div key={idx} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 12px", background: "#f8f9fa", borderRadius: 10,
            border: "1px solid var(--border)",
          }}>
            {renderLabel(item)}
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{renderCount(item)}</span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button onClick={() => setShowAll(!showAll)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%", padding: 8, marginTop: 10,
          background: "transparent", border: "1px dashed var(--border)", borderRadius: 10,
          color: "var(--info)", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
        }}>
          {showAll ? <>إخفاء <ChevronUp size={16} /></> : <>عرض الكل <ChevronDown size={16} /></>}
        </button>
      )}
    </div>
  );
}

export default function CoordinatorStatistics() {
  const {
    loading,
    error,
    byStatus,
    byDepartment,
    bySite,
    byGoverningBody,
    batchStats,
    totalStudents,
    totalSites,
    activeTrainings,
  } = useCoordinatorStatistics();

  const [showAllStatus, setShowAllStatus] = useState(false);
  const [showAllDept, setShowAllDept] = useState(false);
  const [showAllSite, setShowAllSite] = useState(false);
  const [showAllGov, setShowAllGov] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <Loader2 size={40} className="spin" style={{ color: "var(--primary)", marginBottom: 12 }} />
        <p style={{ color: "var(--text-faint)", fontSize: "0.95rem" }}>جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <div className="hero-content">
          <div className="hero-icon">
            <BarChart3 size={44} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="hero-title">الإحصائيات</h1>
            <p className="hero-subtitle">
              ملخص سريع لحالة الكتب الرسمية والتوزيع والطلبة.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-custom alert-danger mb-3">
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="section-card mb-4">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <StatCard icon={Users} label="الطلبة" value={totalStudents} gradient="linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)" />
          <StatCard icon={Building2} label="جهات التدريب" value={totalSites} gradient="linear-gradient(135deg, var(--accent) 0%, #c49b66 100%)" />
          <StatCard icon={BookOpen} label="تدريبات جارية" value={activeTrainings} gradient="linear-gradient(135deg, var(--success) 0%, #5cb85c 100%)" />
          <StatCard icon={XCircle} label="مرفوض" value={byStatus.get("rejected") || 0} gradient="linear-gradient(135deg, var(--danger) 0%, #c9302c 100%)" />
        </div>
      </div>

      {/* Statistics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {/* By Status */}
        <StatSection
          icon={FileText}
          title="حسب حالة الكتاب"
          iconBg="linear-gradient(135deg, var(--info) 0%, #0aa2c0 100%)"
          items={Array.from(byStatus.entries())}
          showAll={showAllStatus}
          setShowAll={setShowAllStatus}
          renderLabel={([status]) => {
            const colors = STATUS_COLORS[status] || { bg: "#e9ecef", text: "#495057" };
            return (
              <span style={{
                background: colors.bg, color: colors.text,
                padding: "4px 12px", borderRadius: 99,
                fontSize: "0.78rem", fontWeight: 700,
              }}>
                {STATUS_LABELS[status] || status}
              </span>
            );
          }}
          renderCount={([, count]) => count}
        />

        {/* By Governing Body */}
        <StatSection
          icon={MapPin}
          title="حسب الجهة الرسمية"
          iconBg="linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
          items={Array.from(byGoverningBody.entries())}
          showAll={showAllGov}
          setShowAll={setShowAllGov}
          renderLabel={([gb]) => (
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-soft)" }}>
              {getGoverningBodyLabel(gb)}
            </span>
          )}
          renderCount={([, count]) => count}
        />

        {/* By Department */}
        <StatSection
          icon={GraduationCap}
          title="حسب القسم"
          iconBg="linear-gradient(135deg, var(--accent) 0%, #c49b66 100%)"
          items={Array.from(byDepartment.entries())}
          showAll={showAllDept}
          setShowAll={setShowAllDept}
          renderLabel={([dept]) => (
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-soft)" }}>{dept}</span>
          )}
          renderCount={([, count]) => count}
        />

        {/* By Training Site */}
        <StatSection
          icon={Building2}
          title="حسب جهة التدريب"
          iconBg="linear-gradient(135deg, var(--success) 0%, #5cb85c 100%)"
          items={Array.from(bySite.entries())}
          showAll={showAllSite}
          setShowAll={setShowAllSite}
          renderLabel={([site]) => (
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-soft)" }}>{site}</span>
          )}
          renderCount={([, count]) => count}
        />
      </div>

      {/* Batch Stats */}
      <div className="section-card mt-4">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div className="section-icon" style={{ background: "linear-gradient(135deg, #5b3a8c 0%, #8b5fcf 100%)" }}>
            <FileText size={18} />
          </div>
          <h5 style={{ margin: 0 }}>إحصائيات الدفعات</h5>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
          <div style={{
            padding: "14px", borderRadius: 12, border: "1px solid var(--border)",
            background: "#f8f9fa", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)" }}>{batchStats.total}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: 2 }}>إجمالي الدفعات</div>
          </div>
          {Array.from(batchStats.byStatus.entries()).map(([status, count]) => {
            const colors = BATCH_STATUS_COLORS[status] || { bg: "#e9ecef", text: "#495057" };
            return (
              <div key={status} style={{
                padding: "14px", borderRadius: 12,
                border: `1px solid ${colors.bg}`,
                background: colors.bg, textAlign: "center",
              }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: colors.text }}>{count}</div>
                <div style={{ fontSize: "0.78rem", color: colors.text, marginTop: 2, opacity: 0.8 }}>
                  {BATCH_STATUS_LABELS[status] || status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

