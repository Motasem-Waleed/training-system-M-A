import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEnrollment, createEnrollment, updateEnrollment, getSections, getStudents } from "../../../services/api";

export default function EnrollmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    user_id: "",
    section_id: "",
    academic_year: new Date().getFullYear(),
    semester: "first",
    status: "active",
    final_grade: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب قائمة الشعب (sections)
        const sectionsData = await getSections();
        setSections(sectionsData.data || []);

        // جلب قائمة الطلاب (users with role student)
        const studentsData = await getStudents(); // getStudents already filters for role_id: 2
        setStudents(studentsData.data || []);

        if (id) {
          const enrollmentData = await getEnrollment(id);
          setForm({
            user_id: enrollmentData.user_id,
            section_id: enrollmentData.section_id,
            academic_year: enrollmentData.academic_year,
            semester: enrollmentData.semester,
            status: enrollmentData.status,
            final_grade: enrollmentData.final_grade || "",
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      if (id) {
        await updateEnrollment(id, form);
      } else {
        await createEnrollment(form);
      }
      navigate("/admin/enrollments");
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert("حدث خطأ أثناء حفظ التسجيل");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enrollment-form">
      <div className="page-header">
        <h1>{id ? "تعديل تسجيل" : "تسجيل طالب في شعبة"}</h1>
        <button onClick={() => navigate("/admin/enrollments")} className="btn-secondary">رجوع</button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label>الطالب *</label>
            <select name="user_id" value={form.user_id} onChange={handleChange} required>
              <option value="">اختر الطالب</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name} ({student.university_id})</option>
              ))}
            </select>
            {errors.user_id && <span className="error">{errors.user_id[0]}</span>}
          </div>

          <div className="form-group">
            <label>الشعبة *</label>
            <select name="section_id" value={form.section_id} onChange={handleChange} required>
              <option value="">اختر الشعبة</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name} - {section.course?.name} ({section.academic_year})
                </option>
              ))}
            </select>
            {errors.section_id && <span className="error">{errors.section_id[0]}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>السنة الأكاديمية *</label>
            <input type="number" name="academic_year" value={form.academic_year} onChange={handleChange} required />
            {errors.academic_year && <span className="error">{errors.academic_year[0]}</span>}
          </div>

          <div className="form-group">
            <label>الفصل الدراسي *</label>
            <select name="semester" value={form.semester} onChange={handleChange}>
              <option value="first">الفصل الأول</option>
              <option value="second">الفصل الثاني</option>
              <option value="summer">الفصل الصيفي</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>الحالة</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">نشط</option>
              <option value="dropped">منسحب</option>
              <option value="completed">مكتمل</option>
            </select>
          </div>

          <div className="form-group">
            <label>الدرجة النهائية</label>
            <input type="number" step="0.01" name="final_grade" value={form.final_grade} onChange={handleChange} placeholder="0-100" />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "جاري الحفظ..." : (id ? "تحديث" : "تسجيل")}
          </button>
          <button type="button" onClick={() => navigate("/admin/enrollments")} className="btn-secondary">إلغاء</button>
        </div>
      </form>
    </div>
  );
}