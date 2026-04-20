import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, createUser, updateUser, getDepartments } from "../../../services/api";

export default function AddCounselor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", password_confirmation: "",
    major: "", department_id: "", role_id: 5, status: "active",
  });
  const isEditMode = !!id;

  useEffect(() => {
    const fetchDepartments = async () => {
      try { const res = await getDepartments(); const data = res?.data || res; setDepartments(Array.isArray(data) ? data : []); }
      catch (err) { console.error("فشل جلب الأقسام", err); }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const userData = await getUser(id);
          setForm({ name: userData.name || "", email: userData.email || "", password: "", password_confirmation: "", major: userData.major || "", department_id: userData.department_id || "", role_id: userData.role_id || 5, status: userData.status || "active" });
        } catch (err) { console.error(err); }
      };
      fetchUser();
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
    if (statusMessage.text) setStatusMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErrors({}); setStatusMessage({ type: "", text: "" });
    try {
      if (id) { await updateUser(id, form); setStatusMessage({ type: "success", text: "تم تحديث المرشد بنجاح" }); }
      else { await createUser(form); setStatusMessage({ type: "success", text: "تمت إضافة المرشد بنجاح" }); setForm({ name: "", email: "", password: "", password_confirmation: "", major: "", department_id: "", role_id: 5, status: "active" }); }
      setTimeout(() => navigate("/admin/users"), 1500);
    } catch (err) {
      if (err.response?.data?.errors) { setErrors(err.response.data.errors); setStatusMessage({ type: "error", text: `فشل الحفظ: ${Object.values(err.response.data.errors).flat().join(", ")}` }); }
      else setStatusMessage({ type: "error", text: "حدث خطأ غير متوقع" });
    } finally { setLoading(false); }
  };

  return (
    <div className="user-form">
      <div className="page-header"><h1>{isEditMode ? "تعديل مرشد" : "إضافة مرشد جديد"}</h1><button onClick={() => navigate("/admin/users")} className="btn-secondary">رجوع</button></div>
      {statusMessage.text && <div className={`status-message ${statusMessage.type}`}>{statusMessage.text}</div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group"><label>الاسم الكامل *</label><input type="text" name="name" value={form.name} onChange={handleChange} required />{errors.name && <span className="error">{errors.name[0]}</span>}</div>
        <div className="form-group"><label>البريد الإلكتروني *</label><input type="email" name="email" value={form.email} onChange={handleChange} required />{errors.email && <span className="error">{errors.email[0]}</span>}</div>
        <div className="form-group"><label>القسم</label><select name="department_id" value={form.department_id} onChange={handleChange}><option value="">اختر القسم</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>{errors.department_id && <span className="error">{errors.department_id[0]}</span>}</div>
        <div className="form-group"><label>التخصص *</label><input type="text" name="major" value={form.major} onChange={handleChange} required />{errors.major && <span className="error">{errors.major[0]}</span>}</div>
        <div className="form-group"><label>كلمة المرور {!isEditMode && "*"}</label><input type="password" name="password" value={form.password} onChange={handleChange} {...(!isEditMode && { required: true })} />{errors.password && <span className="error">{errors.password[0]}</span>}</div>
        <div className="form-group"><label>تأكيد كلمة المرور {!isEditMode && "*"}</label><input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} {...(!isEditMode && { required: true })} /></div>
        <div className="form-actions"><button type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : isEditMode ? "تحديث" : "إضافة"}</button><button type="button" onClick={() => navigate("/admin/users")}>إلغاء</button></div>
      </form>
    </div>
  );
}
