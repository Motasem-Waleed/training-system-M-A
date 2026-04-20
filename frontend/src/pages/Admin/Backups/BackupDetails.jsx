import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBackup } from "../../../services/api";

export default function BackupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [backup, setBackup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBackup = async () => {
      try {
        const data = await getBackup(id);
        setBackup(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBackup();
  }, [id]);

  if (loading) return <div className="text-center">جاري التحميل...</div>;
  if (!backup) return <div className="text-danger">لم يتم العثور على النسخة الاحتياطية</div>;

  const tables = backup.tables || [];

  return (
    <div className="backup-details">
      <div className="page-header">
        <h1>تفاصيل النسخة الاحتياطية</h1>
        <button onClick={() => navigate("/admin/backups")} className="btn-secondary">رجوع</button>
      </div>

      <div className="section-card" style={{ padding: 20 }}>
        <h3>{backup.name || backup.filename || `نسخة #${id}`}</h3>
        <p className="text-soft">تاريخ الإنشاء: {backup.created_at || "—"}</p>
        <p className="text-soft">الحجم: {backup.size || "—"}</p>

        {tables.length > 0 && (
          <>
            <h5 style={{ marginTop: 16 }}>الجداول المتضمنة ({tables.length})</h5>
            <table className="data-table">
              <thead>
                <tr><th>اسم الجدول</th><th>عدد السجلات</th><th>عرض</th></tr>
              </thead>
              <tbody>
                {tables.map(t => (
                  <tr key={t.name || t.table_name}>
                    <td>{t.name || t.table_name}</td>
                    <td>{t.rows || t.count || "—"}</td>
                    <td>
                      <button
                        className="btn-sm"
                        onClick={() => navigate(`/admin/backups/${id}/table/${t.name || t.table_name}`)}
                      >
                        عرض البيانات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
