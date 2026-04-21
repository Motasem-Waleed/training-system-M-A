import { useEffect, useState } from "react";
import { getActivityLogs } from "../../../services/api";

const PAGE_LABELS = [
  { pattern: /^\/admin\/training-sites/, label: "تم عرض صفحة مواقع التدريب" },
  { pattern: /^\/admin\/courses/, label: "تم عرض قائمة المساقات" },
  { pattern: /^\/admin\/users/, label: "تم عرض قائمة المستخدمين" },
  { pattern: /^\/admin\/activity-logs/, label: "تم عرض سجل النشاطات" },
  { pattern: /^\/dashboard/, label: "تم عرض لوحة التحكم" },
];

const API_LABELS = [
  { pattern: /^api\/training-sites/, label: "تم الوصول إلى بيانات مواقع التدريب" },
  { pattern: /^api\/courses/, label: "تم الوصول إلى بيانات المساقات" },
  { pattern: /^api\/users/, label: "تم الوصول إلى بيانات المستخدمين" },
  { pattern: /^api\/activity-logs/, label: "تم الوصول إلى سجل النشاطات" },
];

const resolvePathLabel = (path, labels, fallbackPrefix) => {
  if (!path) return "—";
  const match = labels.find((item) => item.pattern.test(path));
  return match ? match.label : `${fallbackPrefix} ${path}`;
};

const getActivityDescription = (log) => {
  if (log?.action === "ui.page_visit") {
    return resolvePathLabel(log?.new_data?.path, PAGE_LABELS, "Visited page:");
  }

  if (log?.action?.startsWith("http.")) {
    return resolvePathLabel(log?.route, API_LABELS, "API request:");
  }

  return log?.description || "—";
};

export default function ActivityLogsList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ user_id: "", action: "" });

  useEffect(() => {
    fetchLogs(true);
    const timer = setInterval(() => fetchLogs(false), 3000);
    return () => clearInterval(timer);
  }, [filters]);

  const fetchLogs = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    if (showLoader) setError("");
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => String(value ?? "").trim() !== "")
      );
      const data = await getActivityLogs({ per_page: 50, ...activeFilters });
      const normalizedLogs = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setLogs(normalizedLogs);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      setError(err.response?.data?.message || "فشل تحميل سجل النشاطات. تأكد من صلاحيات الأدمن.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  return (
    <div>
      <h1>سجل النشاطات</h1>
      <div className="filters-bar">
        <input
          id="activity-log-user-id"
          name="activity_log_user_id"
          type="text"
          placeholder="معرف المستخدم"
          value={filters.user_id}
          onChange={e => setFilters({...filters, user_id: e.target.value})}
        />
        <input
          id="activity-log-action"
          name="activity_log_action"
          type="text"
          placeholder="الإجراء"
          value={filters.action}
          onChange={e => setFilters({...filters, action: e.target.value})}
        />
      </div>

      {loading && <p className="text-center">جاري التحميل...</p>}

      {error && (
        <div className="status-message error" style={{ margin: "10px 0" }}>
          ❌ {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <p className="text-soft text-center" style={{ padding: "20px" }}>
          لا توجد نشاطات مسجلة حالياً.<br />
          سيتم تسجيل النشاطات تلقائياً على مستوى الطلبات وتغييرات البيانات.
        </p>
      )}

      {!loading && logs.length > 0 && (
        <table className="data-table">
          <thead><tr><th>المستخدم</th><th>الإجراء</th><th>الوصف</th><th>الحالة</th><th>المدة</th><th>IP</th><th>التاريخ</th></tr></thead>
          <tbody>{logs.map(log => (
            <tr key={log.id}>
              <td>{log.user?.name || log.user?.email || "—"}</td>
              <td>{log.action}</td>
              <td>{getActivityDescription(log)}</td>
              <td>{log?.new_data?.status_code ?? "—"}</td>
              <td>{log?.new_data?.duration_ms ? `${log.new_data.duration_ms}ms` : "—"}</td>
              <td>{log.ip_address}</td>
              <td>{log.created_at ? new Date(log.created_at).toLocaleString('ar-SA') : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}