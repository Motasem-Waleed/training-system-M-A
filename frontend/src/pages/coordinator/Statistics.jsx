import { useEffect, useMemo, useState } from "react";
import {
  getDashboardStats,
  getTrainingRequests,
  itemsFromPagedResponse,
} from "../../services/api";

const labelMap = {
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

export default function CoordinatorStatistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [sitesCount, setSitesCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);

  const byStatus = useMemo(() => {
    const map = new Map();
    for (const r of requests) {
      const s = r?.book_status || "unknown";
      map.set(s, (map.get(s) || 0) + 1);
    }
    return map;
  }, [requests]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [reqRes, stats] = await Promise.all([
          getTrainingRequests({ per_page: 200 }),
          getDashboardStats(),
        ]);

        const reqArr = itemsFromPagedResponse(reqRes);

        if (mounted) {
          setRequests(reqArr);
          setSitesCount(stats?.total_sites ?? 0);
          setStudentsCount(stats?.total_students ?? 0);
        }
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || "فشل تحميل الإحصائيات");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="sections-list">
      <div className="page-header">
        <div>
          <h1>الإحصائيات</h1>
          <p>ملخص سريع لحالة الكتب الرسمية والتوزيع.</p>
        </div>
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
              <div className="stat-title">الطلبة</div>
              <div className="stat-value">{studentsCount}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-title">جهات التدريب</div>
              <div className="stat-value">{sitesCount}</div>
            </div>
            <div className="stat-card success">
              <div className="stat-title">الكتب الرسمية</div>
              <div className="stat-value">{requests.length}</div>
            </div>
            <div className="stat-card info">
              <div className="stat-title">مرفوض</div>
              <div className="stat-value">{byStatus.get("rejected") || 0}</div>
            </div>
          </div>

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
                  {Array.from(byStatus.entries()).map(([status, count]) => (
                    <tr key={status}>
                      <td>{labelMap[status] || status}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

