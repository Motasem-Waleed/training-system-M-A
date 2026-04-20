import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, createUser, updateUser, getTrainingSites } from "../../../services/api";

export default function AddSchoolManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [trainingSites, setTrainingSites] = useState([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", password_confirmation: "",
    phone: "", training_site_id: "", role_id: 4, status: "active",
  });
  const isEditMode = !!id;

  useEffect(() => {
    const fetchSites = async () => {
      try { const res = await getTrainingSites(); const data = res?.data || res; setTrainingSites(Array.isArray(data) ? data : []); }
      catch (err) { console.error("فشل جلب أماكن التدريب", err); }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const userData = await getUser(id);
          setForm({ name: userData.name || "", email: userData.email || "", password: "", password_confirmation: "", phone: userData.phone || "", training_site_id: userData.training_site_id || "", role_id: userData.role_id || 4, status: userData.status || "active" });
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
    const formToSend = { ...form, training_site_id: form.training_site_id ? Number(form.training_site_id) : null };
    try {
      if (id) { await updateUser(id, formToSend); setStatusMessage({ type: "success", text: "تم تحديث مدير المدرسة بنجاح" }); }
      else { await createUser(formToSend); setStatusMessage({ type: "success", text: "تمت إضافة مدير المدرسة بنجاح" }); setForm({ name: "", email: "", password: "", password_confirmation: "", phone: "", training_site_id: "", role_id: 4, status: "active" }); }
      setTimeout(() => navigate("/admin/users"), 1500);
    } catch (err) {
      if (err.response?.data?.errors) { setErrors(err.response.data.errors); setStatusMessage({ type: "error", text: `فشل الحفظ: ${Object.values(err.response.data.errors).flat().join(", ")}` }); }
      else setStatusMessage({ type: "error", text: "حدث خطأ غير متوقع" });
    } finally { setLoading(false); }
  };

  return (
    <div className="user-form">
      <div className="page-header"><h1>{isEditMode ? "تعديل مدير المدرسة" : "إضافة مدير مدرسة جديد"}</h1><button onClick={() => navigate("/admin/users")} className="btn-secondary">رجوع</button></div>
      {statusMessage.text && <div className={`status-message ${statusMessage.type}`}>{statusMessage.text}</div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group"><label>الاسم الكامل *</label><input type="text" name="name" value={form.name} onChange={handleChange} required />{errors.name && <span className="error">{errors.name[0]}</span>}</div>
        <div className="form-group"><label>البريد الإلكتروني *</label><input type="email" name="email" value={form.email} onChange={handleChange} required />{errors.email && <span className="error">{errors.email[0]}</span>}</div>
        <div className="form-group"><label>مكان التدريب (المدرسة) *</label><select name="training_site_id" value={form.training_site_id} onChange={handleChange} required><option value="">اختر المدرسة</option>{trainingSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{errors.training_site_id && <span className="error">{errors.training_site_id[0]}</span>}</div>
        <div className="form-group"><label>الهاتف</label><input type="text" name="phone" value={form.phone} onChange={handleChange} />{errors.phone && <span className="error">{errors.phone[0]}</span>}</div>
        <div className="form-group"><label>كلمة المرور {!isEditMode && "*"}</label><input type="password" name="password" value={form.password} onChange={handleChange} {...(!isEditMode && { required: true })} />{errors.password && <span className="error">{errors.password[0]}</span>}</div>
        <div className="form-group"><label>تأكيد كلمة المرور {!isEditMode && "*"}</label><input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} {...(!isEditMode && { required: true })} /></div>
        <div className="form-actions"><button type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : isEditMode ? "تحديث" : "إضافة"}</button><button type="button" onClick={() => navigate("/admin/users")}>إلغاء</button></div>
      </form>
    </div>
  );
}
