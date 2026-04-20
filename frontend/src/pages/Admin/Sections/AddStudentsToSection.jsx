import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSection, getStudents, enrollStudent } from "../../../services/api";

export default function AddStudentsToSection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sectionData, studentsData] = await Promise.all([
          getSection(id),
          getStudents({ per_page: 1000 }),
        ]);
        setSection(sectionData);
        const list = studentsData?.data ?? studentsData ?? [];
        setStudents(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "فشل تحميل البيانات" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const toggleStudent = (studentId) => {
    setSelectedIds(prev =>
      prev.includes(studentId) ? prev.filter(s => s !== studentId) : [...prev, studentId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIds.length) { alert("اختر طالباً واحداً على الأقل"); return; }
    setSaving(true);
    setMessage({ type: "", text: "" });
    const ok = [], fail = [];
    for (const studentId of selectedIds) {
      try {
        await enrollStudent({ section_id: Number(id), student_id: studentId });
        ok.push(studentId);
      } catch (err) {
        fail.push({ id: studentId, error: err.response?.data?.message || "فشل" });
      }
    }
    if (ok.length) setMessage({ type: "success", text: `تم تسجيل ${ok.length} طالب في الشعبة` });
    if (fail.length) setMessage({ type: "error", text: `فشل تسجيل ${fail.length} طالب` });
    setSaving(false);
    if (ok.length) setSelectedIds([]);
  };

  if (loading) return <div className="text-center">جاري التحميل...</div>;

  return (
    <div className="section-form">
      <div className="page-header">
        <h1>إضافة طلبة إلى: {section?.name || `شعبة #${id}`}</h1>
        <button onClick={() => navigate("/admin/sections")} className="btn-secondary">رجوع</button>
      </div>
      {message.text && <div className={`status-message ${message.type}`}>{message.text}</div>}
      <form onSubmit={handleSubmit}>
        <p>اختر الطلبة لإضافتهم إلى هذه الشعبة:</p>
        <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid #ddd", padding: 10 }}>
          {students.map(s => (
            <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
              <span>{s.name} — {s.university_id || s.email}</span>
            </label>
          ))}
          {students.length === 0 && <p className="text-soft">لا يوجد طلبة متاحون</p>}
        </div>
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "جاري التسجيل..." : `تسجيل ${selectedIds.length} طالب`}
          </button>
          <button type="button" onClick={() => navigate("/admin/sections")}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}
