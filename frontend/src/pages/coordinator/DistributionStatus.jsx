import { RefreshCw } from "lucide-react";
import useCoordinatorRequests from "../../hooks/useCoordinatorRequests";
import { CoordinatorFilters, StatusBadge, DistributionStatusStepper } from "../../components/coordinator";
import { STATUS_LABELS } from "../../config/coordinator/statusLabels";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";
import EmptyState from "../../components/common/EmptyState";

export default function CoordinatorDistributionStatus() {
  const {
    loading,
    error,
    requests,
    filters,
    setFilters,
    reload,
    periods,
  } = useCoordinatorRequests();

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="enrollments-list">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>حالة التوزيع</h1>
            <p>تتبع حالة كل طلب عبر مراحل التوزيع من الإرسال حتى القبول أو الرفض.</p>
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
        showStatus
        showPeriod
        showSearch
        periods={periods}
        statusOptions={statusOptions}
      />

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : requests.length === 0 ? (
        <EmptyState title="لا توجد طلبات" description="لا يوجد طلبات تطابق الفلاتر المحددة." />
      ) : (
        <div className="activity-list" style={{ marginTop: 16 }}>
          {requests.map((r) => {
            const s0 = r.students?.[0];
            const studentName = s0?.user?.name || r.requested_by?.name || "—";
            const universityId = s0?.user?.university_id || "—";
            const courseName = s0?.course?.name || "—";
            const siteName = r.training_site?.name || "—";
            const governingBody = r.governing_body || null;

            return (
              <div className="activity-item" key={r.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <h6 style={{ margin: 0 }}>
                      {studentName} — {siteName}
                    </h6>
                    <div className="activity-meta">
                      رقم جامعي: {universityId} · المساق: {courseName}
                      {governingBody && (
                        <> · الجهة: {getGoverningBodyLabel(governingBody)}</>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={r.book_status} />
                </div>
                <DistributionStatusStepper
                  currentStatus={r.book_status}
                  governingBody={governingBody}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
