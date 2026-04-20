import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSections, createUser } from "../../../services/api";
import * as XLSX from "xlsx";

export default function BulkAddStudents() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ success: [], errors: [] });
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const fetchSections = async () => {
      try { const res = await getSections(); const data = res?.data || res; setSections(Array.isArray(data) ? data : []); }
      catch (err) { console.error(err); }
    };
    fetchSections();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults({ success: [], errors: [] });
  };

  const processExcel = async () => {
    if (!file) { alert("اختر ملف Excel أولاً"); return; }
    setLoading(true);
    setResults({ success: [], errors: [] });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (!rows.length) { alert("الملف فارغ"); setLoading(false); return; }

        const sectionMap = {};
        sections.forEach(s => { sectionMap[s.name.trim()] = s.id; });

        const ok = [], fail = [];
        for (const row of rows) {
          const clean = {};
          Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
          const student = {
            name: clean["الاسم الكامل"] || clean["الاسم"] || clean["name"] || "",
            email: clean["البريد الإلكتروني"] || clean["email"] || "",
            password: clean["كلمة المرور"] || "12345678",
            password_confirmation: clean["كلمة المرور"] || "12345678",
            university_id: String(clean["الرقم الجامعي"] || clean["university_id"] || ""),
            major: clean["التخصص"] || clean["major"] || "",
            department_id: "",
            role_id: 2,
            status: "active",
          };
          if (!student.name || !student.email) { fail.push({ email: student.email || "غير معروف", error: "الاسم أو البريد مفقود" }); continue; }
          try { await createUser(student); ok.push(student.email); }
          catch (e) { fail.push({ email: student.email, error: e.response?.data?.message || e.message }); }
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
        <h1>إضافة طلبة جماعياً</h1>
        <button onClick={() => navigate("/admin/sections")} className="btn-secondary">رجوع</button>
      </div>
      <div className="bulk-section">
        <p>الأعمدة: <strong>الاسم الكامل</strong>، <strong>البريد الإلكتروني</strong>، <strong>الرقم الجامعي</strong>، <strong>التخصص</strong>، <strong>كلمة المرور</strong> (اختياري)</p>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <button onClick={processExcel} disabled={loading} className="btn-primary">
          {loading ? "جاري الرفع..." : "رفع والإضافة"}
        </button>
        {results.success.length > 0 && <div className="success-box">✅ تمت إضافة {results.success.length} طالب</div>}
        {results.errors.length > 0 && <div className="error-box">❌ فشلت إضافة {results.errors.length} طالب<ul>{results.errors.map((e, i) => <li key={i}><strong>{e.email}</strong> : {e.error}</li>)}</ul></div>}
      </div>
    </div>
  );
}
