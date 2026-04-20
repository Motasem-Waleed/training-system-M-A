import { useEffect, useState } from "react";
import { getActivityLogs } from "../../../services/api";

export default function ActivityLogsList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ user_id: "", action: "" });

  useEffect(() => { fetchLogs(); }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getActivityLogs(filters);
      setLogs(data.data || data || []);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      setError(err.response?.data?.message || "فشل تحميل سجل النشاطات. تأكد من صلاحيات الأدمن.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>سجل النشاطات</h1>
      <div className="filters-bar">
        <input type="text" placeholder="معرف المستخدم" value={filters.user_id} onChange={e => setFilters({...filters, user_id: e.target.value})} />
        <input type="text" placeholder="الإجراء" value={filters.action} onChange={e => setFilters({...filters, action: e.target.value})} />
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
          سيتم تسجيل النشاطات تلقائياً عند إجراء عمليات POST/PUT/DELETE.
        </p>
      )}

      {!loading && logs.length > 0 && (
        <table className="data-table">
          <thead><tr><th>المستخدم</th><th>الإجراء</th><th>الوصف</th><th>IP</th><th>التاريخ</th></tr></thead>
          <tbody>{logs.map(log => (
            <tr key={log.id}>
              <td>{log.user?.name || log.user?.email || "—"}</td>
              <td>{log.action}</td>
              <td>{log.description}</td>
              <td>{log.ip_address}</td>
              <td>{log.created_at ? new Date(log.created_at).toLocaleString('ar-SA') : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}