import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getBackupDetails } from "../../../services/api";

export default function BackupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const result = await getBackupDetails(id);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("فشل تحميل تفاصيل النسخة الاحتياطية");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div>جاري تحميل التفاصيل...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>تفاصيل النسخة الاحتياطية</h1>
        <button onClick={() => navigate("/admin/backups")} className="btn-secondary">
          رجوع إلى القائمة
        </button>
      </div>

      <div className="backup-info">
        <p><strong>اسم الملف:</strong> {data.name}</p>
        <p><strong>تاريخ الإنشاء:</strong> {new Date(data.created_at).toLocaleString()}</p>
        <p><strong>الحجم:</strong> {data.size} bytes</p>
        <p><strong>النوع:</strong> {data.type}</p>
        {data.notes && <p><strong>ملاحظة:</strong> {data.notes}</p>}
      </div>

      <hr />
      <h3>محتويات النسخة</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>اسم الجدول</th>
            <th>عدد السجلات</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {data.tables && data.tables.length > 0 ? (
            data.tables.map((table, idx) => (
              <tr key={idx}>
                <td>{table.name}</td>
                <td>{table.count}</td>
                <td>
                  <Link 
                    to={`/admin/backups/${id}/table/${encodeURIComponent(table.name)}`}
                    target="_blank"
                    className="btn-sm"
                  >
                    عرض البيانات
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">لا توجد معلومات عن الجداول</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
