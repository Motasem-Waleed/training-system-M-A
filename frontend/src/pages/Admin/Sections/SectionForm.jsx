import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSection, createSection, updateSection, getCourses, getUsers } from "../../../services/api";

export default function SectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    academic_year: new Date().getFullYear(),
    academic_supervisor_id: "",
    semester: "first",
    course_id: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب قائمة المساقات (courses) والمشرفين الأكاديميين (users with role academic_supervisor)
        const coursesData = await getCourses();
        setCourses(coursesData.data || []);

        // جلب المشرفين الأكاديميين (يمكن فلترتهم في الـ Backend أو Frontend)
        const usersData = await getUsers({ role: 'academic_supervisor' });
        setSupervisors(usersData.data || []);

        if (id) {
          const sectionData = await getSection(id);
          setForm({
            name: sectionData.name,
            academic_year: sectionData.academic_year,
            academic_supervisor_id: sectionData.academic_supervisor_id || "",
            semester: sectionData.semester,
            course_id: sectionData.course_id,
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
        await updateSection(id, form);
      } else {
        await createSection(form);
      }
      navigate("/admin/sections");
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert("حدث خطأ أثناء حفظ الشعبة");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-form">
      <div className="page-header">
        <h1>{id ? "تعديل شعبة" : "إضافة شعبة جديدة"}</h1>
        <button onClick={() => navigate("/admin/sections")} className="btn-secondary">رجوع</button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label>اسم الشعبة *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
            {errors.name && <span className="error">{errors.name[0]}</span>}
          </div>

          <div className="form-group">
            <label>السنة الأكاديمية *</label>
            <input type="number" name="academic_year" value={form.academic_year} onChange={handleChange} required />
            {errors.academic_year && <span className="error">{errors.academic_year[0]}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>المساق *</label>
            <select name="course_id" value={form.course_id} onChange={handleChange} required>
              <option value="">اختر المساق</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
              ))}
            </select>
            {errors.course_id && <span className="error">{errors.course_id[0]}</span>}
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

        <div className="form-group">
          <label>المشرف الأكاديمي</label>
          <select name="academic_supervisor_id" value={form.academic_supervisor_id} onChange={handleChange}>
            <option value="">اختر المشرف</option>
            {supervisors.map(sup => (
              <option key={sup.id} value={sup.id}>{sup.name}</option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "جاري الحفظ..." : (id ? "تحديث" : "إضافة")}
          </button>
          <button type="button" onClick={() => navigate("/admin/sections")} className="btn-secondary">إلغاء</button>
        </div>
      </form>
    </div>
  );
}