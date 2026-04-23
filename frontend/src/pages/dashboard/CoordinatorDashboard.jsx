import { Link } from "react-router-dom";
import { RefreshCw, ArrowLeft } from "lucide-react";
import useCoordinatorDashboard from "../../hooks/useCoordinatorDashboard";
import { CoordinatorStatsCards } from "../../components/coordinator";
import { STATUS_LABELS } from "../../config/coordinator/statusLabels";
import { getGoverningBodyLabel } from "../../config/coordinator/governingBodies";
import EmptyState from "../../components/common/EmptyState";

export default function CoordinatorDashboard() {
  const {
    loading,
    error,
    recentRequests,
    recentBatches,
    reload,
    pendingReview,
    prelimApproved,
    openBatches,
    needsEdit,
    rejectedRequests,
    sentToEducation,
    sentToHealth,
    approvedByBody,
    rejectedByBody,
  } = useCoordinatorDashboard();

  const sentBatches = recentBatches.filter((b) => b.status === "sent").length;

  return (
    <>
      <div className="content-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">مساحة عمل المنسق</h1>
          <p className="page-subtitle">
            متابعة طلبات التدريب، التوزيع، والدفعات المرسلة للجهات الرسمية.
          </p>
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

      {error && (
        <div className="section-card" style={{ marginBottom: 16 }}>
          <p className="text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : (
        <>
          <CoordinatorStatsCards
            pendingReview={pendingReview}
            prelimApproved={prelimApproved}
            needsEdit={needsEdit}
            openBatches={openBatches}
            sentToEducation={sentToEducation}
            sentToHealth={sentToHealth}
            approvedByBody={approvedByBody}
            rejectedRequests={rejectedRequests}
            rejectedByBody={rejectedByBody}
            sentBatches={sentBatches}
          />

          <div className="dashboard-row">
            <div className="section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>أحدث طلبات التدريب</h4>
                <Link to="/coordinator/training-requests" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.9rem" }}>
                  عرض الكل <ArrowLeft size={14} />
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <EmptyState title="لا توجد طلبات" description="لم ترد طلبات تدريب بعد." />
              ) : (
                <div className="activity-list">
                  {recentRequests.map((r) => {
                    const s0 = r.students?.[0];
                    const title =
                      s0?.user?.name || r.requested_by?.name || `طلب #${r.id}`;
                    const site = r.training_site?.name || "—";
                    const statusLabel =
                      STATUS_LABELS[r.book_status] || r.book_status;
                    return (
                      <div className="activity-item" key={r.id}>
                        <h6>
                          {title} — {site}
                        </h6>
                        <p>{statusLabel}</p>
                        <div className="activity-meta">
                          {r.governing_body && (
                            <span>{getGoverningBodyLabel(r.governing_body)} · </span>
                          )}
                          {r.requested_at &&
                            new Date(r.requested_at).toLocaleDateString("ar-SA")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="btn-primary" to="/coordinator/training-requests">
                  مراجعة الطلبات
                </Link>
                <Link className="btn-secondary" to="/coordinator/distribution">
                  التوزيع والدفعات
                </Link>
                <Link className="btn-secondary" to="/coordinator/official-letters">
                  الكتب الرسمية
                </Link>
              </div>
            </div>

            <div>
              <div className="announcement-box" style={{ marginBottom: 16 }}>
                <h5>تنبيه</h5>
                <p>
                  راجع الطلبات الواردة في صفحة طلبات التدريب، ثم اعتمدها مبدئيًا
                  أو اطلب التعديل قبل تجميع الدفعات وإرسالها للمديرية أو الجهة
                  المعنية.
                </p>
              </div>

              <div className="section-card">
                <h4>أحدث الدفعات</h4>
                {recentBatches.length === 0 ? (
                  <EmptyState title="لا توجد دفعات" description="لم تُنشأ دفعات بعد." />
                ) : (
                  <div className="activity-list">
                    {recentBatches.slice(0, 5).map((b) => (
                      <div className="activity-item" key={b.id}>
                        <h6>دفعة #{b.id}</h6>
                        <p>
                          {getGoverningBodyLabel(b.governing_body)}
                          {b.directorate ? ` — ${b.directorate}` : ""}
                        </p>
                        <div className="activity-meta">
                          {b.items_count ?? 0} طلب · {b.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  to="/coordinator/official-letters"
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.9rem", marginTop: 12 }}
                >
                  عرض كل الدفعات <ArrowLeft size={14} />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
