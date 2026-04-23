import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createUser, createEnrollment, getUsers } from "../../../services/api";
import * as XLSX from "xlsx";

export default function AddStudentsToSection() {
  const { id: sectionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [manualStudent, setManualStudent] = useState({ name: "", email: "", university_id: "" });
  const [file, setFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [results, setResults] = useState(null);

  // إضافة طالب يدوي
  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualStudent.name || !manualStudent.email || !manualStudent.university_id) {
      alert("يرجى ملء جميع الحقول");
      return;
    }
    setLoading(true);
    try {
      // البحث عن الطالب أو إنشاؤه
      const existing = await getUsers({ email: manualStudent.email });
      let userId;
      if (existing.data && existing.data.length > 0) {
        userId = existing.data[0].id;
      } else {
        const newUser = await createUser({
          name: manualStudent.name,
          email: manualStudent.email,
          university_id: manualStudent.university_id,
          password: "12345678",
          password_confirmation: "12345678",
          role_id: 2,
          status: "active",
        });
        userId = newUser.data.id;
      }
      // استخدام createEnrollment بدلاً من enrollStudentInSection
      await createEnrollment({
        user_id: userId,
        section_id: sectionId,
        academic_year: new Date().getFullYear(),
        semester: "first",
        status: "active"
      });
      alert("تمت إضافة الطالب بنجاح");
      setManualStudent({ name: "", email: "", university_id: "" });
    } catch (err) {
      alert("فشل إضافة الطالب: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // رفع ملف Excel
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const processExcel = async () => {
    if (!file) return alert("اختر ملف Excel أولاً");
    setBulkLoading(true);
    setResults(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const students = rows.map(row => ({
          name: row["الاسم الكامل"] || row["name"] || "",
          email: row["البريد الإلكتروني"] || row["email"] || "",
          university_id: String(row["الرقم الجامعي"] || row["university_id"] || ""),
        })).filter(s => s.name && s.email && s.university_id);

        if (students.length === 0) throw new Error("لا توجد بيانات صالحة");

        const successList = [], errorList = [];
        for (const s of students) {
          try {
            let userId;
            const existing = await getUsers({ email: s.email });
            if (existing.data && existing.data.length > 0) {
              userId = existing.data[0].id;
            } else {
              const newUser = await createUser({
                name: s.name,
                email: s.email,
                university_id: s.university_id,
                password: "12345678",
                password_confirmation: "12345678",
                role_id: 2,
                status: "active",
              });
              userId = newUser.data.id;
            }
            // استخدام createEnrollment بدلاً من enrollStudentInSection
            await createEnrollment({
              user_id: userId,
              section_id: sectionId,
              academic_year: new Date().getFullYear(),
              semester: "first",
              status: "active"
            });
            successList.push(s.email);
          } catch (err) {
            errorList.push({ email: s.email, error: err.response?.data?.message || err.message });
          }
        }
        setResults({ success: successList, errors: errorList });
        if (successList.length) alert(`تمت إضافة ${successList.length} طالب بنجاح`);
      } catch (err) {
        alert(err.message);
      } finally {
        setBulkLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="add-students-section">
      <div className="page-header">
        <h1>إضافة طلاب إلى الشعبة #{sectionId}</h1>
        <button onClick={() => navigate("/admin/sections")} className="btn-secondary">رجوع</button>
      </div>

      {/* إضافة يدوية */}
      <fieldset style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
        <legend style={{ fontWeight: "bold" }}>إضافة طالب يدوي</legend>
        <div className="form-row">
          <input type="text" placeholder="الاسم الكامل" value={manualStudent.name} onChange={(e) => setManualStudent({ ...manualStudent, name: e.target.value })} />
          <input type="email" placeholder="البريد الإلكتروني" value={manualStudent.email} onChange={(e) => setManualStudent({ ...manualStudent, email: e.target.value })} />
          <input type="text" placeholder="الرقم الجامعي" value={manualStudent.university_id} onChange={(e) => setManualStudent({ ...manualStudent, university_id: e.target.value })} />
          <button onClick={handleManualAdd} disabled={loading}>{loading ? "جاري..." : "إضافة"}</button>
        </div>
      </fieldset>

      {/* رفع Excel */}
      <fieldset style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
        <legend style={{ fontWeight: "bold" }}>رفع ملف Excel (عدة طلاب)</legend>
        <p>الأعمدة المطلوبة: الاسم الكامل، البريد الإلكتروني، الرقم الجامعي</p>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <button onClick={processExcel} disabled={bulkLoading} style={{ marginTop: "0.5rem" }}>
          {bulkLoading ? "جاري الرفع..." : "رفع وإضافة"}
        </button>
        {results && (
          <div>
            <div className="success">✅ نجح: {results.success.length}</div>
            {results.errors.length > 0 && (
              <div className="error">❌ فشل: {results.errors.map(e => e.email).join(", ")}</div>
            )}
          </div>
        )}
      </fieldset>
    </div>
  );
}
