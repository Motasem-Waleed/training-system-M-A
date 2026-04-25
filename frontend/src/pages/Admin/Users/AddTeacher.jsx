import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, createUser, updateUser, getTrainingSites } from "../../../services/api";
import * as XLSX from "xlsx";

export default function AddTeacher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("single");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [trainingSites, setTrainingSites] = useState([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", password_confirmation: "",
    major: "", phone: "", training_site_id: "", role_id: 3, status: "active",
  });
  const [file, setFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState({ success: [], errors: [] });
  const isEditMode = !!id;

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await getTrainingSites();
        const sitesData = res?.data || res;
        setTrainingSites(Array.isArray(sitesData) ? sitesData : []);
      } catch (err) { console.error("فشل جلب أماكن التدريب", err); }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const userData = await getUser(id);
          setForm({
            name: userData.name || "", email: userData.email || "", password: "", password_confirmation: "",
            major: userData.major || "", phone: userData.phone || "",
            training_site_id: userData.training_site_id || "", role_id: userData.role_id || 3, status: userData.status || "active",
          });
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
      if (id) { await updateUser(id, formToSend); setStatusMessage({ type: "success", text: "تم تحديث المعلم بنجاح" }); }
      else { await createUser(formToSend); setStatusMessage({ type: "success", text: "تمت إضافة المعلم بنجاح" }); setForm({ name: "", email: "", password: "", password_confirmation: "", major: "", phone: "", training_site_id: "", role_id: 3, status: "active" }); }
      setTimeout(() => navigate("/admin/users"), 1500);
    } catch (err) {
      if (err.response?.data?.errors) { setErrors(err.response.data.errors); setStatusMessage({ type: "error", text: `فشل الحفظ: ${Object.values(err.response.data.errors).flat().join(", ")}` }); }
      else setStatusMessage({ type: "error", text: "حدث خطأ غير متوقع" });
    } finally { setLoading(false); }
  };

  const handleFileChange = (e) => { setFile(e.target.files[0]); setBulkResults({ success: [], errors: [] }); setStatusMessage({ type: "", text: "" }); };

  const processExcel = async () => {
    if (!file) { alert("الرجاء اختيار ملف Excel أولاً"); return; }
    setBulkLoading(true); setBulkResults({ success: [], errors: [] }); setStatusMessage({ type: "", text: "" });
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (!rows.length) { alert("الملف فارغ"); setBulkLoading(false); return; }
        const siteMap = {};
        trainingSites.forEach(s => { siteMap[s.name.trim()] = s.id; siteMap[s.name.trim().toLowerCase()] = s.id; });
        
        // Add Arabic to English mapping for training sites
        const arabicToEnglishSites = {
          "مدرسة": "school",
          "المدرسة": "school",
          "مركز صحي": "health_center",
          "المركز الصحي": "health_center"
        };
        
        // Add Arabic mappings to siteMap
        Object.keys(arabicToEnglishSites).forEach(arabicName => {
          const englishName = arabicToEnglishSites[arabicName];
          const matchingSite = trainingSites.find(s => s.name.toLowerCase().includes(englishName));
          if (matchingSite) {
            siteMap[arabicName] = matchingSite.id;
            siteMap[arabicName.toLowerCase()] = matchingSite.id;
          }
        });
        const teachers = rows.map(row => {
          const clean = {}; Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
          const siteName = (clean["مكان التدريب"] || clean["المدرسة"] || clean["school"] || "").trim();
          return { name: clean["الاسم الكامل"] || clean["الاسم"] || clean["name"] || "", email: clean["البريد الإلكتروني"] || clean["email"] || "", password: clean["كلمة المرور"] || "12345678", password_confirmation: clean["كلمة المرور"] || "12345678", major: clean["التخصص"] || clean["major"] || "", phone: clean["الهاتف"] || clean["phone"] || "", training_site_id: siteMap[siteName] || siteMap[siteName.toLowerCase()] || "", role_id: 3, status: "active" };
        });
        const valid = [], invalid = [];
        teachers.forEach((t, i) => { const m = []; if (!t.name) m.push("الاسم"); if (!t.email) m.push("البريد"); m.length === 0 ? valid.push(t) : invalid.push({ row: i + 2, email: t.email, missing: m }); });
        if (invalid.length) alert("بيانات ناقصة:\n" + invalid.map(s => `الصف ${s.row}: ${s.email} - ناقص: ${s.missing.join(", ")}`).join("\n"));
        if (!valid.length) { setBulkLoading(false); return; }
        const ok = [], fail = [];
        const BATCH_SIZE = 50; // Process 50 teachers at a time
        
        // Process in batches for better performance
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
          const batch = valid.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(async (teacher) => {
            try {
              await createUser(teacher);
              return { success: true, email: teacher.email };
            } catch (err) {
              return { success: false, email: teacher.email, error: err.response?.data?.message || err.message };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(result => {
            if (result.success) {
              ok.push({ email: result.email });
            } else {
              fail.push({ email: result.email, error: result.error });
            }
          });
          
          // Update progress
          const processedCount = Math.min(i + BATCH_SIZE, valid.length);
          setStatusMessage({ 
            type: "info", 
            text: `تم معالجة ${processedCount} من ${valid.length} معلم...` 
          });
        }
        
        setBulkResults({ success: ok, errors: fail }); if (ok.length) setFile(null);
      } catch (err) { alert("خطأ: " + err.message); } finally { setBulkLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const formFields = () => (
    <>
      <div className="form-group"><label>الاسم الكامل *</label><input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />{errors.name && <span className="error">{errors.name[0]}</span>}</div>
      <div className="form-group"><label>البريد الإلكتروني *</label><input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />{errors.email && <span className="error">{errors.email[0]}</span>}</div>
      <div className="form-group"><label>التخصص *</label><input type="text" id="major" name="major" value={form.major} onChange={handleChange} required />{errors.major && <span className="error">{errors.major[0]}</span>}</div>
      <div className="form-group"><label>مكان التدريب</label><select id="training_site_id" name="training_site_id" value={form.training_site_id} onChange={handleChange}><option value="">اختر مكان التدريب</option>{trainingSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{errors.training_site_id && <span className="error">{errors.training_site_id[0]}</span>}</div>
      <div className="form-group"><label>الهاتف</label><input type="text" id="phone" name="phone" value={form.phone} onChange={handleChange} />{errors.phone && <span className="error">{errors.phone[0]}</span>}</div>
      <div className="form-group"><label>كلمة المرور {!isEditMode && "*"}</label><input type="password" id="password" name="password" value={form.password} onChange={handleChange} {...(!isEditMode && { required: true })} />{errors.password && <span className="error">{errors.password[0]}</span>}</div>
      <div className="form-group"><label>تأكيد كلمة المرور {!isEditMode && "*"}</label><input type="password" id="password_confirmation" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} {...(!isEditMode && { required: true })} /></div>
    </>
  );

  if (isEditMode) {
    return (
      <div className="user-form">
        <div className="page-header"><h1>تعديل معلم مرشد</h1><button onClick={() => navigate("/admin/users")} className="btn-secondary">رجوع</button></div>
        {statusMessage.text && <div className={`status-message ${statusMessage.type}`}>{statusMessage.text}</div>}
        <form onSubmit={handleSubmit} className="form">{formFields()}<div className="form-actions"><button type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : "تحديث"}</button><button type="button" onClick={() => navigate("/admin/users")}>إلغاء</button></div></form>
      </div>
    );
  }

  return (
    <div className="user-form">
      <div className="page-header"><h1>إضافة معلم مرشد جديد</h1><button onClick={() => navigate("/admin/users")} className="btn-secondary">رجوع</button></div>
      {statusMessage.text && <div className={`status-message ${statusMessage.type}`}>{statusMessage.text}</div>}
      <div className="tabs">
        <button className={activeTab === "single" ? "tab-active" : "tab"} onClick={() => setActiveTab("single")}>إضافة معلم واحد</button>
        <button className={activeTab === "bulk" ? "tab-active" : "tab"} onClick={() => setActiveTab("bulk")}>رفع مجموعة من ملف Excel</button>
      </div>
      {activeTab === "single" && <form onSubmit={handleSubmit} className="form">{formFields()}<div className="form-actions"><button type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : "إضافة"}</button><button type="button" onClick={() => navigate("/admin/users")}>إلغاء</button></div></form>}
      {activeTab === "bulk" && (
        <div className="bulk-section">
          <p>قم بتحميل ملف Excel يحتوي على الأعمدة التالية:</p>
          <ul><li><strong>الاسم الكامل</strong></li><li><strong>البريد الإلكتروني</strong></li><li><strong>التخصص</strong></li><li><strong>مكان التدريب / المدرسة</strong></li><li><strong>الهاتف</strong> (اختياري)</li><li><strong>كلمة المرور</strong> (اختياري)</li></ul>
          <input type="file" id="bulk-file" name="bulk_file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <button onClick={processExcel} disabled={bulkLoading} className="btn-primary">{bulkLoading ? "جاري الرفع..." : "رفع والإضافة"}</button>
          {bulkResults.success.length > 0 && <div className="success-box">✅ تمت إضافة {bulkResults.success.length} معلم بنجاح</div>}
          {bulkResults.errors.length > 0 && <div className="error-box">❌ فشلت إضافة {bulkResults.errors.length} معلم<ul>{bulkResults.errors.map((e, i) => <li key={i}><strong>{e.email}</strong> : {e.error}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
}
