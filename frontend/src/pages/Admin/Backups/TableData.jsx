import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBackupTableData } from "../../../services/api";

export default function TableData() {
  const { id, tableName } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBackupTableData(id, tableName);
        const list = Array.isArray(data) ? data : data?.data || data?.rows || [];
        setRows(list);
        if (list.length > 0) setColumns(Object.keys(list[0]));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, tableName]);

  if (loading) return <div className="text-center">جاري التحميل...</div>;

  return (
    <div className="table-data">
      <div className="page-header">
        <h1>بيانات جدول: {tableName}</h1>
        <button onClick={() => navigate(`/admin/backups/${id}`)} className="btn-secondary">رجوع</button>
      </div>

      {rows.length === 0 ? (
        <p className="text-soft">لا توجد بيانات في هذا الجدول</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>{columns.map(col => <td key={col}>{row[col] ?? "—"}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
