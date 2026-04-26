import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, createUser, updateUser, getDepartments } from "../../../services/api";
import * as XLSX from "xlsx";

export default function AddStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("single");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    university_id: "",
    major: "",
    department_id: "",
    role_id: 2,
    status: "active",
  });
  const [file, setFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState({ success: [], errors: [] });
  const isEditMode = !!id;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartments();
        const departmentsData = res?.data || res;
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      } catch (err) {
        console.error("فشل جلب الأقسام", err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const userData = await getUser(id);
          setForm({
            name: userData.name || "",
            email: userData.email || "",
            password: "",
            password_confirmation: "",
            university_id: userData.university_id || "",
            major: userData.major || "",
            department_id: userData.department_id || "",
            role_id: userData.role_id || 2,
            status: userData.status || "active",
          });
        } catch (err) {
          console.error(err);
        }
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
    setLoading(true);
    setErrors({});
    setStatusMessage({ type: "", text: "" });

    const formToSend = { ...form, university_id: String(form.university_id || "") };

    // Remove password_confirmation — not accepted by update endpoint
    delete formToSend.password_confirmation;

    // Remove empty password so backend doesn't try to hash it
    if (!formToSend.password) delete formToSend.password;

    // Remove 'major' — column doesn't exist in users table yet
    delete formToSend.major;

    try {
      if (id) {
        await updateUser(id, formToSend);
        setStatusMessage({ type: "success", text: "تم تحديث الطالب بنجاح" });
      } else {
        await createUser(formToSend);
        setStatusMessage({ type: "success", text: "تمت إضافة الطالب بنجاح" });
        setForm({ name: "", email: "", password: "", password_confirmation: "", university_id: "", major: "", department_id: "", role_id: 2, status: "active" });
      }
      setTimeout(() => navigate("/admin/users"), 1500);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        const errorMessages = Object.values(err.response.data.errors).flat().join(", ");
        setStatusMessage({ type: "error", text: `فشل الحفظ: ${errorMessages}` });
      } else {
        setStatusMessage({ type: "error", text: "حدث خطأ غير متوقع أثناء حفظ المستخدم" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setBulkResults({ success: [], errors: [] });
    setStatusMessage({ type: "", text: "" });
  };

  const processExcel = async () => {
    if (!file) { alert("الرجاء اختيار ملف Excel أولاً"); return; }
    setBulkLoading(true);
    setBulkResults({ success: [], errors: [] });
    setStatusMessage({ type: "", text: "" });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (rows.length === 0) { alert("الملف فارغ"); setBulkLoading(false); return; }

        const departmentMap = {};
        departments.forEach(dept => { 
          departmentMap[dept.name.trim()] = dept.id; 
          departmentMap[dept.name.trim().toLowerCase()] = dept.id; 
        });
        
        // Add Arabic to English mapping
        const arabicToEnglish = {
          "علم النفس": "psychology",
          "التربية": "usool_tarbiah", 
          "أصول التربية": "usool_tarbiah",
          "الإدارة": "administration",
          "إدارة": "administration"
        };
        
        // Add Arabic mappings to departmentMap
        Object.keys(arabicToEnglish).forEach(arabicName => {
          const englishName = arabicToEnglish[arabicName];
          if (departmentMap[englishName]) {
            departmentMap[arabicName] = departmentMap[englishName];
            departmentMap[arabicName.toLowerCase()] = departmentMap[englishName];
          }
        });
        
        const students = rows.map((row) => {
          const clean = {};
          Object.keys(row).forEach(key => { clean[key.trim()] = row[key]; });
          const deptName = String(clean["القسم"] || clean["قسم"] || clean["department"] || "").trim();
          const deptId = departmentMap[deptName] || departmentMap[deptName.toLowerCase()] || "";

          return {
            name: clean["الاسم الكامل"] || clean["الاسم"] || clean["name"] || "",
            email: clean["البريد الإلكتروني"] || clean["البريد"] || clean["email"] || "",
            password: clean["كلمة المرور"] || clean["password"] || "12345678",
            password_confirmation: clean["كلمة المرور"] || clean["password"] || "12345678",
            university_id: String(clean["الرقم الجامعي"] || clean["university_id"] || ""),
            major: clean["التخصص"] || clean["major"] || "",
            department_id: deptId,
            role_id: 2,
            status: "active",
          };
        });

        const validStudents = [], invalidStudents = [];
        students.forEach((s, idx) => {
          const missing = [];
          if (!s.name) missing.push("الاسم");
          if (!s.email) missing.push("البريد");
          if (!s.university_id) missing.push("الرقم الجامعي");
          if (!s.department_id || s.department_id === "") missing.push("القسم");
          if (!s.major) missing.push("التخصص");
          missing.length === 0 ? validStudents.push(s) : invalidStudents.push({ row: idx + 2, email: s.email || "غير معروف", missing });
        });

        if (invalidStudents.length > 0) {
          alert("بيانات ناقصة:\n" + invalidStudents.map(s => `الصف ${s.row}: ${s.email} - ناقص: ${s.missing.join(", ")}`).join("\n"));
        }
        if (validStudents.length === 0) { setBulkLoading(false); return; }

        const successList = [], errorList = [];
        const BATCH_SIZE = 50; // Process 50 students at a time
        
        // Process in batches for better performance
        for (let i = 0; i < validStudents.length; i += BATCH_SIZE) {
          const batch = validStudents.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(async (student) => {
            try {
              await createUser(student);
              return { success: true, email: student.email };
            } catch (err) {
              return { success: false, email: student.email, error: err.response?.data?.message || err.message };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(result => {
            if (result.success) {
              successList.push({ email: result.email });
            } else {
              errorList.push({ email: result.email, error: result.error });
            }
          });
          
          // Update progress
          const processedCount = Math.min(i + BATCH_SIZE, validStudents.length);
          setStatusMessage({ 
            type: "info", 
            text: `تم معالجة ${processedCount} من ${validStudents.length} طالب...` 
          });
        }
        
        setBulkResults({ success: successList, errors: errorList });
        if (successList.length) setFile(null);
      } catch (err) { alert("خطأ في معالجة الملف: " + err.message); }
      finally { setBulkLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  if (isEditMode) {
    return (
      <div className="user-form">
        <div className="page-header">
          <h1>تعديل طالب</h1>
          <button onClick={() => navigate("/admin/users")} className="btn-secondary">رجوع</button>
        </div>
        {statusMessage.text && <div className={`status-message ${statusMessage.type}`}>{statusMessage.text}</div>}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group"><label>الاسم الكامل *</label><input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />{errors.name && <span className="error">{errors.name[0]}</span>}</div>
          <div className="form-group"><label>البريد الإلكتروني *</label><input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />{errors.email && <span className="error">{errors.email[0]}</span>}</div>
          <div className="form-group"><label>الرقم الجامعي</label><input type="text" id="university_id" name="university_id" value={form.university_id} onChange={handleChange} />{errors.university_id && <span className="error">{errors.university_id[0]}</span>}</div>
          <div className="form-group"><label>القسم</label><select id="department_id" name="department_id" value={form.department_id} onChange={handleChange}><option value="">اختر القسم</option>{departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select>{errors.department_id && <span className="error">{errors.department_id[0]}</span>}</div>
          <div className="form-group"><label>التخصص</label><input type="text" id="major" name="major" value={form.major} onChange={handleChange} />{errors.major && <span className="error">{errors.major[0]}</span>}</div>
          <div className="form-group"><label>كلمة المرور (اتركها فارغة إذا لم ترد التغيير)</label><input type="password" id="password" name="password" value={form.password} onChange={handleChange} />{errors.password && <span className="error">{errors.password[0]}</span>}</div>
          <div className="form-group"><label>تأكيد كلمة المرور</label><input type="password" id="password_confirmation" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} /></div>
          <div className="form-actions"><button type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : "تحديث"}</button><button type="button" onClick={() => navigate("/admin/users")}>إلغاء</button></div>
        </form>
      </div>
    );
  }

  return (
    <div className="user-form">
      <div className="page-header">
        <h1>إضافة طالب جديد</h1>
        <button onClick={() => navigate("/admin/users")} className="btn-secondary">رجوع</button>
      </div>
      {statusMessage.text && <div className={`status-message ${statusMessage.type}`}>{statusMessage.text}</div>}
      <div className="tabs">
        <button className={activeTab === "single" ? "tab-active" : "tab"} onClick={() => setActiveTab("single")}>إضافة طالب واحد</button>
        <button className={activeTab === "bulk" ? "tab-active" : "tab"} onClick={() => setActiveTab("bulk")}>رفع مجموعة من ملف Excel</button>
      </div>
      {activeTab === "single" && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group"><label>الاسم الكامل *</label><input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />{errors.name && <span className="error">{errors.name[0]}</span>}</div>
          <div className="form-group"><label>البريد الإلكتروني *</label><input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />{errors.email && <span className="error">{errors.email[0]}</span>}</div>
          <div className="form-group"><label>الرقم الجامعي *</label><input type="text" id="university_id" name="university_id" value={form.university_id} onChange={handleChange} required />{errors.university_id && <span className="error">{errors.university_id[0]}</span>}</div>
          <div className="form-group"><label>القسم *</label><select id="department_id" name="department_id" value={form.department_id} onChange={handleChange} required><option value="">اختر القسم</option>{departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select>{errors.department_id && <span className="error">{errors.department_id[0]}</span>}</div>
          <div className="form-group"><label>التخصص *</label><input type="text" id="major" name="major" value={form.major} onChange={handleChange} required />{errors.major && <span className="error">{errors.major[0]}</span>}</div>
          <div className="form-group"><label>كلمة المرور *</label><input type="password" id="password" name="password" value={form.password} onChange={handleChange} required />{errors.password && <span className="error">{errors.password[0]}</span>}</div>
          <div className="form-group"><label>تأكيد كلمة المرور *</label><input type="password" id="password_confirmation" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required /></div>
          <div className="form-actions"><button type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : "إضافة"}</button><button type="button" onClick={() => navigate("/admin/users")}>إلغاء</button></div>
        </form>
      )}
      {activeTab === "bulk" && (
        <div className="bulk-section">
          <p>قم بتحميل ملف Excel يحتوي على الأعمدة التالية:</p>
          <ul>
            <li><strong>الاسم الكامل</strong> (مطلوب)</li>
            <li><strong>البريد الإلكتروني</strong> (مطلوب)</li>
            <li><strong>الرقم الجامعي</strong> (مطلوب)</li>
            <li><strong>القسم</strong> (مطلوب)</li>
            <li><strong>التخصص</strong> (مطلوب)</li>
            <li><strong>كلمة المرور</strong> (اختياري، افتراضي 12345678)</li>
          </ul>
          <input type="file" id="bulk-file" name="bulk_file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <button onClick={processExcel} disabled={bulkLoading} className="btn-primary">{bulkLoading ? "جاري الرفع..." : "رفع والإضافة"}</button>
          {bulkResults.success.length > 0 && <div className="success-box">✅ تمت إضافة {bulkResults.success.length} طالب بنجاح</div>}
          {bulkResults.errors.length > 0 && <div className="error-box">❌ فشلت إضافة {bulkResults.errors.length} طالب<ul>{bulkResults.errors.map((e, idx) => <li key={idx}><strong>{e.email}</strong> : {e.error}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
}
