import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDashboardStats,
  getTrainingAssignments,
  getTasks,
  itemsFromPagedResponse,
} from "../../services/api";

export default function MentorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignTotal, setAssignTotal] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [st, assignRes, taskRes] = await Promise.all([
          getDashboardStats(),
          getTrainingAssignments({ per_page: 5 }),
          getTasks({ per_page: 5 }),
        ]);
        if (!mounted) return;
        setStats(st);
        const aItems = itemsFromPagedResponse(assignRes);
        setAssignments(aItems);
        setAssignTotal(
          typeof assignRes?.meta?.total === "number" ? assignRes.meta.total : aItems.length
        );
        const tItems = itemsFromPagedResponse(taskRes);
        setTasksTotal(
          typeof taskRes?.meta?.total === "number" ? taskRes.meta.total : tItems.length
        );
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || "فشل تحميل لوحة المعلم المرشد");
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
    <>
      <div className="content-header">
        <h1 className="page-title">لوحة المعلم المرشد</h1>
        <p className="page-subtitle">
          متابعة طلبة التدريب المرتبطين بك، المهام، الحضور، والتقييمات في جهة التدريب.
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
              <div className="stat-title">طلبة التدريب (تعييناتك)</div>
              <div className="stat-value">{stats?.my_students ?? "—"}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-title">تدريبات جارية (النظام)</div>
              <div className="stat-value">{stats?.active_trainings ?? "—"}</div>
            </div>
            <div className="stat-card success">
              <div className="stat-title">مهام أضفتها</div>
              <div className="stat-value">{tasksTotal}</div>
            </div>
            <div className="stat-card info">
              <div className="stat-title">تعييناتك</div>
              <div className="stat-value">{assignTotal}</div>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="section-card">
              <h4>أحدث تعيينات التدريب</h4>
              {assignments.length === 0 ? (
                <p className="text-soft">لا توجد تعيينات مرتبطة بحسابك حالياً.</p>
              ) : (
                <div className="activity-list">
                  {assignments.map((a) => {
                    const stu = a.enrollment?.user;
                    return (
                      <div className="activity-item" key={a.id}>
                        <h6>{stu?.name || "طالب"}</h6>
                        <p>
                          {a.training_site?.name || "جهة التدريب"} —{" "}
                          {a.status_label || a.status}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="btn-primary-custom btn-sm-custom" to="/mentor/students">
                  كل الطلبة
                </Link>
                <Link className="btn-outline-custom btn-sm-custom" to="/mentor/tasks">
                  المهام
                </Link>
                <Link className="btn-outline-custom btn-sm-custom" to="/mentor/attendance">
                  الحضور
                </Link>
              </div>
            </div>

            <div className="announcement-box">
              <h5>اختصارات سريعة</h5>
              <p>
                راجع جدولك الأسبوعي في جهة التدريب، وسجّل ملاحظاتك على التقييمات والمهام
                لمتابعة تقدم الطلبة.
              </p>
              <div className="quick-actions-grid" style={{ marginTop: 12 }}>
                <Link className="quick-action-btn" to="/mentor/schedule">
                  الجدول الأسبوعي
                </Link>
                <Link className="quick-action-btn" to="/mentor/evaluations">
                  التقييمات
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
