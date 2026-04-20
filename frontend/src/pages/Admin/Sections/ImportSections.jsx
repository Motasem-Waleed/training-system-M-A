import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { createSection } from "../../../services/api";

export default function ImportSections() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ success: 0, errors: [] });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults({ success: 0, errors: [] });
  };

  const processExcel = async () => {
    if (!file) { alert("اختر ملف Excel أولاً"); return; }
    setLoading(true);
    setResults({ success: 0, errors: [] });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (!rows.length) { alert("الملف فارغ"); setLoading(false); return; }

        let ok = 0;
        const fail = [];
        for (const row of rows) {
          const clean = {};
          Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
          const name = clean["اسم الشعبة"] || clean["الشعبة"] || clean["name"] || "";
          if (!name) { fail.push({ name: `صف ${ok + fail.length + 2}`, error: "اسم الشعبة مطلوب" }); continue; }
          try {
            await createSection({ name, course_id: clean["رقم المساق"] || clean["course_id"] || "" });
            ok++;
          } catch (e) {
            fail.push({ name, error: e.response?.data?.message || e.message });
          }
        }
        setResults({ success: ok, errors: fail });
        if (ok) setFile(null);
      } catch (err) { alert("خطأ: " + err.message); }
      finally { setLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="section-form">
      <div className="page-header">
        <h1>استيراد شعب من ملف Excel</h1>
        <button onClick={() => navigate("/admin/sections")} className="btn-secondary">رجوع</button>
      </div>
      <div className="bulk-section">
        <p>الأعمدة المطلوبة: <strong>اسم الشعبة</strong>، <strong>رقم المساق</strong> (اختياري)</p>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <button onClick={processExcel} disabled={loading} className="btn-primary">
          {loading ? "جاري الاستيراد..." : "استيراد"}
        </button>
        {results.success > 0 && <div className="success-box">✅ تم استيراد {results.success} شعبة</div>}
        {results.errors.length > 0 && <div className="error-box">❌ فشل استيراد {results.errors.length} شعبة<ul>{results.errors.map((e, i) => <li key={i}><strong>{e.name}</strong> : {e.error}</li>)}</ul></div>}
      </div>
    </div>
  );
}
