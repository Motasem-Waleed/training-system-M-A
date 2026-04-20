import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { createSection } from "../../../services/api";

export default function BulkUploadSections() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ success: [], errors: [] });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults({ success: [], errors: [] });
  };

  const processExcel = async () => {
    if (!file) { alert("الرجاء اختيار ملف Excel أولاً"); return; }
    setLoading(true);
    setResults({ success: [], errors: [] });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (!rows.length) { alert("الملف فارغ"); setLoading(false); return; }

        const sections = rows.map(row => {
          const clean = {};
          Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
          return {
            name: clean["اسم الشعبة"] || clean["الشعبة"] || clean["name"] || "",
            course_id: clean["رقم المساق"] || clean["course_id"] || "",
            semester: clean["الفصل"] || clean["semester"] || "",
          };
        });

        const valid = [], invalid = [];
        sections.forEach((s, i) => {
          if (!s.name) invalid.push({ row: i + 2, error: "اسم الشعبة مطلوب" });
          else valid.push(s);
        });

        if (invalid.length) alert("بيانات ناقصة:\n" + invalid.map(s => `الصف ${s.row}: ${s.error}`).join("\n"));
        if (!valid.length) { setLoading(false); return; }

        const ok = [], fail = [];
        for (const s of valid) {
          try { await createSection(s); ok.push(s.name); }
          catch (e) { fail.push({ name: s.name, error: e.response?.data?.message || e.message }); }
        }
        setResults({ success: ok, errors: fail });
        if (ok.length) setFile(null);
      } catch (err) { alert("خطأ: " + err.message); }
      finally { setLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="section-form">
      <div className="page-header">
        <h1>رفع شعب من ملف Excel</h1>
        <button onClick={() => navigate("/admin/sections")} className="btn-secondary">رجوع</button>
      </div>
      <div className="bulk-section">
        <p>قم بتحميل ملف Excel يحتوي على الأعمدة التالية:</p>
        <ul>
          <li><strong>اسم الشعبة</strong> (مطلوب)</li>
          <li><strong>رقم المساق</strong> (اختياري)</li>
          <li><strong>الفصل</strong> (اختياري)</li>
        </ul>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <button onClick={processExcel} disabled={loading} className="btn-primary">
          {loading ? "جاري الرفع..." : "رفع والإضافة"}
        </button>
        {results.success.length > 0 && <div className="success-box">✅ تمت إضافة {results.success.length} شعبة: {results.success.join("، ")}</div>}
        {results.errors.length > 0 && <div className="error-box">❌ فشلت إضافة {results.errors.length} شعبة<ul>{results.errors.map((e, i) => <li key={i}><strong>{e.name}</strong> : {e.error}</li>)}</ul></div>}
      </div>
    </div>
  );
}
