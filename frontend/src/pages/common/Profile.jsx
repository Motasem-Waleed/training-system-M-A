import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { readStoredUser, writeStoredUser } from "../../utils/session";

export default function Profile() {
  const savedUser = readStoredUser();

  const [form, setForm] = useState({
    name: savedUser.name || "مستخدم تجريبي",
    email: savedUser.email || "user@example.com",
    phone: savedUser.phone || "0590000000",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedUser = {
      ...savedUser,
      name: form.name,
      email: form.email,
      phone: form.phone,
    };

    writeStoredUser(updatedUser);
    alert("تم تحديث الملف الشخصي بنجاح");
  };

  return (
    <>
      <PageHeader
        title="الملف الشخصي"
        subtitle="يمكنك من هنا تعديل بياناتك الأساسية"
      />

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group-custom">
            <label className="form-label-custom">الاسم</label>
            <input
              type="text"
              name="name"
              className="form-control-custom"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-custom">
            <label className="form-label-custom">البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              className="form-control-custom"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-custom">
            <label className="form-label-custom">رقم الهاتف</label>
            <input
              type="text"
              name="phone"
              className="form-control-custom"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary-custom">
            حفظ التعديلات
          </button>
        </form>
      </div>
    </>
  );
}
