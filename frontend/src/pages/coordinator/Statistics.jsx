import { RefreshCw } from "lucide-react";
import useCoordinatorStatistics from "../../hooks/useCoordinatorStatistics";
import { STATUS_LABELS, STATUS_COLORS } from "../../config/coordinator/statusLabels";
import { BATCH_STATUS_LABELS } from "../../config/coordinator/statusLabels";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";
import EmptyState from "../../components/common/EmptyState";

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
    reload,
  } = useCoordinatorStatistics();

  return (
    <div className="sections-list">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>الإحصائيات</h1>
            <p>ملخص سريع لحالة الكتب الرسمية والتوزيع.</p>
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

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="stat-card primary">
              <div className="stat-title">الطلبة</div>
              <div className="stat-value">{totalStudents}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-title">جهات التدريب</div>
              <div className="stat-value">{totalSites}</div>
            </div>
            <div className="stat-card success">
              <div className="stat-title">تدريبات جارية</div>
              <div className="stat-value">{activeTrainings}</div>
            </div>
            <div className="stat-card info">
              <div className="stat-title">مرفوض</div>
              <div className="stat-value">{byStatus.get("rejected") || 0}</div>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="section-card">
              <h4>حسب حالة الكتاب</h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الحالة</th>
                      <th>العدد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(byStatus.entries()).map(([status, count]) => {
                      const colors = STATUS_COLORS[status] || {
                        bg: "#e9ecef",
                        text: "#495057",
                      };
                      return (
                        <tr key={status}>
                          <td>
                            <span
                              style={{
                                background: colors.bg,
                                color: colors.text,
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: "0.82rem",
                                fontWeight: 700,
                              }}
                            >
                              {STATUS_LABELS[status] || status}
                            </span>
                          </td>
                          <td>{count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section-card">
              <h4>حسب الجهة الرسمية</h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الجهة</th>
                      <th>العدد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(byGoverningBody.entries()).map(([gb, count]) => (
                      <tr key={gb}>
                        <td>{getGoverningBodyLabel(gb)}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="section-card">
              <h4>حسب القسم</h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>القسم</th>
                      <th>العدد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(byDepartment.entries()).map(([dept, count]) => (
                      <tr key={dept}>
                        <td>{dept}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section-card">
              <h4>حسب جهة التدريب</h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>جهة التدريب</th>
                      <th>العدد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(bySite.entries()).map(([site, count]) => (
                      <tr key={site}>
                        <td>{site}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="section-card">
            <h4>إحصائيات الدفعات</h4>
            <div className="kpi-row" style={{ marginBottom: 16 }}>
              <div className="kpi-box">
                <strong>{batchStats.total}</strong>
                <span>إجمالي الدفعات</span>
              </div>
              {Array.from(batchStats.byStatus.entries()).map(([status, count]) => (
                <div className="kpi-box" key={status}>
                  <strong>{count}</strong>
                  <span>{BATCH_STATUS_LABELS[status] || status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

