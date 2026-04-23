import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, createUser, updateUser, getDepartments } from "../../../services/api";
import * as XLSX from "xlsx";

export default function AddAcademicSupervisor() {
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
    phone: "",
    password: "",
    password_confirmation: "",
    department_id: "",
    role_id: 3,        // مشرف أكاديمي
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
            phone: userData.phone || "",
            password: "",
            password_confirmation: "",
            department_id: userData.department_id || "",
            role_id: userData.role_id || 3,
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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setBulkResults({ success: [], errors: [] });
    setStatusMessage({ type: "", text: "" });
  };

  const processExcel = async () => {
    if (!file) {
      alert("الرجاء اختيار ملف Excel أولاً");
      return;
    }
    setBulkLoading(true);
    setBulkResults({ success: [], errors: [] });
    setStatusMessage({ type: "", text: "" });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
          alert("الملف فارغ أو لا يحتوي على بيانات");
          setBulkLoading(false);
          return;
        }

        const cleanRows = rows.map(row => {
          const clean = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim();
            clean[cleanKey] = row[key];
          });
          return clean;
        });

        const departmentMap = {};
        departments.forEach(dept => {
          const normalized = dept.name.trim();
          departmentMap[normalized] = dept.id;
          departmentMap[normalized.toLowerCase()] = dept.id;
        });

        const supervisors = cleanRows.map(row => {
          let deptName = (row["القسم"] || row["department"] || "").trim();
          let departmentId = departmentMap[deptName];
          if (!departmentId) departmentId = departmentMap[deptName.toLowerCase()];

          return {
            name: row["الاسم الكامل"] || row["name"] || "",
            email: row["البريد الإلكتروني"] || row["email"] || "",
            phone: row["رقم الهاتف"] || row["phone"] || "",
            password: row["كلمة المرور"] || row["password"] || "12345678",
            password_confirmation: row["كلمة المرور"] || row["password"] || "12345678",
            department_id: departmentId,
            role_id: 3,
            status: "active",
          };
        });

        const validSupervisors = [];
        const invalidSupervisors = [];

        supervisors.forEach((sup, idx) => {
          const missing = [];
          if (!sup.name) missing.push("الاسم الكامل");
          if (!sup.email) missing.push("البريد الإلكتروني");
          if (!sup.department_id) missing.push("القسم (غير موجود أو غير مطابق)");

          if (missing.length === 0) {
            validSupervisors.push(sup);
          } else {
            invalidSupervisors.push({
              row: idx + 2,
              email: sup.email || "غير معروف",
              missing,
            });
          }
        });

        if (invalidSupervisors.length > 0) {
          const errorDetails = invalidSupervisors.map(s =>
            `الصف ${s.row}: ${s.email} - ناقص: ${s.missing.join(", ")}`
          ).join("\n");
          alert(`البيانات غير كاملة في بعض الصفوف:\n${errorDetails}`);
        }

        if (validSupervisors.length === 0) {
          setBulkLoading(false);
          return;
        }

        const successList = [];
        const errorList = [];

        for (const supervisor of validSupervisors) {
          try {
            const response = await createUser(supervisor);
            successList.push({ email: supervisor.email, id: response.data?.id });
          } catch (err) {
            const msg = err.response?.data?.message || err.message;
            errorList.push({ email: supervisor.email, error: msg });
          }
        }

        setBulkResults({ success: successList, errors: errorList });
        if (successList.length) setFile(null);
      } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء معالجة الملف: " + err.message);
      } finally {
        setBulkLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setStatusMessage({ type: "", text: "" });

    try {
      if (id) {
        await updateUser(id, form);
        setStatusMessage({ type: "success", text: "تم تحديث المشرف الأكاديمي بنجاح" });
        setTimeout(() => navigate("/admin/users"), 1500);
      } else {
        await createUser(form);
        setStatusMessage({ type: "success", text: "تمت إضافة المشرف الأكاديمي بنجاح" });
        setForm({
          name: "", email: "", phone: "", password: "", password_confirmation: "",
          department_id: "", role_id: 3, status: "active",
        });
        setTimeout(() => navigate("/admin/users"), 1500);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        const errorMessages = Object.values(err.response.data.errors).flat().join(", ");
        setStatusMessage({ type: "error", text: `فشل الحفظ: ${errorMessages}` });
      } else {
        setStatusMessage({ type: "error", text: "حدث خطأ غير متوقع" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (isEditMode) {
    return (
      <div className="user-form">
        <div className="page-header">
          <h1>تعديل مشرف أكاديمي</h1>
          <button onClick={() => navigate("/admin/users")} className="btn-secondary">رجوع</button>
        </div>
        {statusMessage.text && (
          <div className={`status-message ${statusMessage.type}`}>{statusMessage.text}</div>
        )}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>الاسم الكامل *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
            {errors.name && <span className="error">{errors.name[0]}</span>}
          </div>
          <div className="form-group">
            <label>البريد الإلكتروني *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
            {errors.email && <span className="error">{errors.email[0]}</span>}
          </div>
          <div className="form-group">
            <label>رقم الهاتف (اختياري)</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
            {errors.phone && <span className="error">{errors.phone[0]}</span>}
          </div>
          <div className="form-group">
            <label>القسم *</label>
            <select name="department_id" value={form.department_id} onChange={handleChange} required>
              <option value="">اختر القسم</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            {errors.department_id && <span className="error">{errors.department_id[0]}</span>}
          </div>
          <div className="form-group">
            <label>كلمة المرور (اتركها فارغة إذا لم ترد التغيير)</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} />
            {errors.password && <span className="error">{errors.password[0]}</span>}
          </div>
          <div className="form-group">
            <label>تأكيد كلمة المرور</label>
            <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : "تحديث"}</button>
            <button type="button" onClick={() => navigate("/admin/users")}>إلغاء</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="user-form">
      <div className="page-header">
        <h1>إضافة مشرف أكاديمي جديد</h1>
        <button onClick={() => navigate("/admin/users")} className="btn-secondary">رجوع</button>
      </div>

      {statusMessage.text && (
        <div className={`status-message ${statusMessage.type}`}>{statusMessage.text}</div>
      )}

      <div className="tabs">
        <button
          className={activeTab === "single" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("single")}
        >
          إضافة مشرف واحد
        </button>
        <button
          className={activeTab === "bulk" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("bulk")}
        >
          رفع مجموعة من ملف Excel
        </button>
      </div>

      {activeTab === "single" && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>الاسم الكامل *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
            {errors.name && <span className="error">{errors.name[0]}</span>}
          </div>
          <div className="form-group">
            <label>البريد الإلكتروني *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
            {errors.email && <span className="error">{errors.email[0]}</span>}
          </div>
          <div className="form-group">
            <label>رقم الهاتف (اختياري)</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
            {errors.phone && <span className="error">{errors.phone[0]}</span>}
          </div>
          <div className="form-group">
            <label>القسم *</label>
            <select name="department_id" value={form.department_id} onChange={handleChange} required>
              <option value="">اختر القسم</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            {errors.department_id && <span className="error">{errors.department_id[0]}</span>}
          </div>
          <div className="form-group">
            <label>كلمة المرور *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
            {errors.password && <span className="error">{errors.password[0]}</span>}
          </div>
          <div className="form-group">
            <label>تأكيد كلمة المرور *</label>
            <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : "إضافة"}</button>
            <button type="button" onClick={() => navigate("/admin/users")}>إلغاء</button>
          </div>
        </form>
      )}

      {activeTab === "bulk" && (
        <div className="bulk-section">
          <p>قم بتحميل ملف Excel يحتوي على الأعمدة التالية:</p>
          <ul>
            <li><strong>الاسم الكامل</strong> (مطلوب)</li>
            <li><strong>البريد الإلكتروني</strong> (مطلوب)</li>
            <li><strong>رقم الهاتف</strong> (اختياري)</li>
            <li><strong>القسم</strong> (مطلوب، يجب أن يطابق اسم القسم في قاعدة البيانات)</li>
            <li><strong>كلمة المرور</strong> (اختياري، افتراضي 12345678)</li>
          </ul>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <button onClick={processExcel} disabled={bulkLoading} className="btn-primary">
            {bulkLoading ? "جاري الرفع..." : "رفع والإضافة"}
          </button>

          {bulkResults.success.length > 0 && (
            <div className="success-box">✅ تمت إضافة {bulkResults.success.length} مشرف أكاديمي بنجاح</div>
          )}
          {bulkResults.errors.length > 0 && (
            <div className="error-box">
              ❌ فشلت إضافة {bulkResults.errors.length} مشرف أكاديمي
              <ul>
                {bulkResults.errors.map((e, idx) => (
                  <li key={idx}><strong>{e.email}</strong> : {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
