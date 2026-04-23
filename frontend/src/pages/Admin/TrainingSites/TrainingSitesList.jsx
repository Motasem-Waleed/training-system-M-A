import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrainingSites, deleteTrainingSite } from "../../../services/api";

export default function TrainingSitesList() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const data = await getTrainingSites();
      setSites(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف موقع التدريب؟")) {
      await deleteTrainingSite(id);
      fetchSites();
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>مواقع التدريب</h1>
        <div>
          <Link to="/admin/training-sites/create" className="btn-primary">+ إضافة موقع</Link>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الموقع</th>
            <th>المديرية</th>
            <th>النوع</th>
            <th>السعة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.location}</td>
              <td>{s.directorate_label || s.directorate}</td>
              <td>{s.site_type_label || s.site_type}</td>
              <td>{s.capacity}</td>
              <td>
                <Link to={`/admin/training-sites/edit/${s.id}`} className="btn-sm">تعديل</Link>
                <button onClick={() => handleDelete(s.id)} className="btn-sm danger">حذف</button>
              </td>
            </tr>
          ))}
          {sites.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center">لا توجد مواقع تدريب</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}