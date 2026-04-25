import { useState } from "react";
import { updateUserProfile, changePassword } from "../../services/api";
import { readStoredUser, writeStoredUser } from "../../utils/session";

export default function Profile() {
  const savedUser = readStoredUser();

  const [form, setForm] = useState({
    name: savedUser.name || "",
    email: savedUser.email || "",
    phone: savedUser.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate phone number
    if (form.phone && !/^(056|059)\d{7}$/.test(form.phone)) {
      setError('رقم الهاتف يجب أن يكون مكون من 10 أرقام ويبدأ بـ 056 أو 059');
      setLoading(false);
      return;
    }

    try {
      await updateUserProfile(form);
      
      const updatedUser = {
        ...savedUser,
        name: form.name,
        email: form.email,
        phone: form.phone,
      };
      writeStoredUser(updatedUser);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "فشل في تحديث البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
        setPasswordError("كلمة المرور الجديدة غير متطابقة");
        setPasswordLoading(false);
        return;
      }

      await changePassword(passwordForm);
      
      setPasswordSuccess(true);
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || "فشل في تغيير كلمة المرور");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="enrollments-list">
      <div className="page-header">
        <h1>الملف الشخصي</h1>
        <p>يمكنك من هنا تعديل بياناتك الأساسية وتغيير كلمة المرور</p>
      </div>

      {success && (
        <div className="section-card" style={{ marginBottom: 12, padding: 12, backgroundColor: '#d4edda', color: '#155724' }}>
          تم تحديث البيانات بنجاح
        </div>
      )}

      {error && (
        <div className="section-card" style={{ marginBottom: 12, padding: 12, backgroundColor: '#f8d7da', color: '#721c24' }}>
          {error}
        </div>
      )}

      <div className="section-card">
        <h3>البيانات الشخصية</h3>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>الاسم *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>رقم الهاتف</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </form>
      </div>

      <div className="section-card" style={{ marginTop: 16 }}>
        <h3>تغيير كلمة المرور</h3>

        {passwordSuccess && (
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: '#d4edda', color: '#155724' }}>
            تم تغيير كلمة المرور بنجاح
          </div>
        )}

        {passwordError && (
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: '#f8d7da', color: '#721c24' }}>
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="form">
          <div className="form-group">
            <label>كلمة المرور الحالية *</label>
            <input
              type="password"
              name="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="form-group">
            <label>كلمة المرور الجديدة *</label>
            <input
              type="password"
              name="new_password"
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>تأكيد كلمة المرور الجديدة *</label>
            <input
              type="password"
              name="new_password_confirmation"
              value={passwordForm.new_password_confirmation}
              onChange={handlePasswordChange}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={passwordLoading}>
            {passwordLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
          </button>
        </form>
      </div>
    </div>
  );
}
