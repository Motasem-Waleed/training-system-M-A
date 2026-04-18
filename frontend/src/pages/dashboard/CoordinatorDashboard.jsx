import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDashboardStats,
  getTrainingRequests,
  itemsFromPagedResponse,
} from "../../services/api";

const statusLabels = {
  draft: "مسودة",
  sent_to_coordinator: "مرسل للمنسق",
  coordinator_under_review: "قيد مراجعة المنسق",
  needs_edit: "بحاجة تعديل",
  coordinator_rejected: "مرفوض من المنسق",
  prelim_approved: "معتمد مبدئيًا",
  batched_pending_send: "مجمّع بانتظار الإرسال",
  sent_to_directorate: "مرسل للمديرية",
  directorate_approved: "موافقة المديرية",
  sent_to_school: "مرسل للمدرسة",
  rejected: "مرفوض",
  school_approved: "موافقة المدرسة",
  sent_to_health_ministry: "مرسل لوزارة الصحة",
};

export default function CoordinatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [st, reqRes] = await Promise.all([
          getDashboardStats(),
          getTrainingRequests({ per_page: 8 }),
        ]);
        if (!mounted) return;
        setStats(st);
        setRecentRequests(itemsFromPagedResponse(reqRes));
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || "فشل تحميل لوحة المنسق");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const pendingReview = stats?.coordinator_pending_review ?? 0;
  const prelimApproved = stats?.coordinator_prelim_approved ?? 0;
  const openBatches = stats?.coordinator_open_batches ?? 0;

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">لوحة تحكم منسق التدريب</h1>
        <p className="page-subtitle">
          متابعة طلبات التدريب، التوزيع، والدفعات المرسلة للجهات الرسمية.
        </p>
      </div>

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : error ? (
        <div className="section-card">
          <p className="text-danger">{error}</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="stat-card primary">
              <div className="stat-title">الطلبة (النظام)</div>
              <div className="stat-value">{stats?.total_students ?? "—"}</div>
            </div>

            <div className="stat-card accent">
              <div className="stat-title">جهات التدريب</div>
              <div className="stat-value">{stats?.total_sites ?? "—"}</div>
            </div>

            <div className="stat-card success">
              <div className="stat-title">تدريبات جارية</div>
              <div className="stat-value">{stats?.active_trainings ?? "—"}</div>
            </div>

            <div className="stat-card info">
              <div className="stat-title">بانتظار مراجعة المنسق</div>
              <div className="stat-value">{pendingReview}</div>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="section-card">
              <h4>أحدث طلبات التدريب</h4>
              <p style={{ marginBottom: 12, color: "var(--muted, #666)" }}>
                معتمد مبدئيًا: {prelimApproved} · دفعات مسودة: {openBatches}
              </p>
              <div className="activity-list">
                {recentRequests.length === 0 ? (
                  <p className="text-muted">لا توجد طلبات بعد.</p>
                ) : (
                  recentRequests.map((r) => {
                    const s0 = r.students?.[0];
                    const title =
                      s0?.user?.name ||
                      r.requested_by?.name ||
                      `طلب #${r.id}`;
                    const site = r.training_site?.name || "—";
                    const st =
                      statusLabels[r.book_status] ||
                      r.book_status_label ||
                      r.book_status;
                    return (
                      <div className="activity-item" key={r.id}>
                        <h6>
                          {title} — {site}
                        </h6>
                        <p>{st}</p>
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="btn-primary" to="/coordinator/distribution">
                  التوزيع ومراجعة الطلبات
                </Link>
                <Link className="btn-secondary" to="/coordinator/students">
                  قائمة الطلبة
                </Link>
                <Link className="btn-secondary" to="/coordinator/statistics">
                  الإحصائيات
                </Link>
              </div>
            </div>

            <div className="announcement-box">
              <h5>تنبيه</h5>
              <p>
                راجع الطلبات الواردة في صفحة التوزيع، ثم اعتمدها مبدئيًا أو اطلب
                التعديل قبل تجميع الدفعات وإرسالها للمديرية أو الجهة المعنية.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
