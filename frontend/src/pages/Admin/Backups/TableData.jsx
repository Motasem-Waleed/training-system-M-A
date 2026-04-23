import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBackupTableData } from "../../../services/api";

export default function TableData() {
  const { id, tableName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getBackupTableData(id, tableName);
        if (result.data && result.data.length > 0) {
          setColumns(Object.keys(result.data[0]));
          setData(result.data);
        } else {
          setColumns([]);
          setData([]);
        }
      } catch (err) {
        console.error(err);
        setError("فشل تحميل بيانات الجدول");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, tableName]);

  if (loading) return <div>جاري تحميل البيانات...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>بيانات الجدول: {tableName}</h1>
        <button onClick={() => navigate(-1)} className="btn-secondary">رجوع</button>
      </div>

      {data.length === 0 ? (
        <p>لا توجد بيانات في هذا الجدول</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col, i) => (
                    <td key={i}>
                      {typeof row[col] === "object"
                        ? JSON.stringify(row[col])
                        : row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
