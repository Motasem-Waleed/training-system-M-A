import { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/api";

const Profile = () => {
  const [profileData, setProfileData] = useState({
    principalName: "—",
    schoolName: "—",
    directorate: "—",
    schoolType: "—",
    phone: "—",
    email: "—",
    address: "—",
    username: "—",
  });

  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userRes = await getCurrentUser();
      const user = userRes?.data || userRes || {};
      const trainingSite = user.training_site?.data || user.training_site || {};

      setProfileData({
        principalName: user.name || "—",
        schoolName: trainingSite.name || "غير محدد",
        directorate: trainingSite.directorate || "—",
        schoolType:
          trainingSite.school_type === "private" ? "مدرسة خاصة" : "مدرسة حكومية",
        phone: user.phone || "—",
        email: user.email || "—",
        address: trainingSite.location || "—",
        username: user.university_id || "—",
      });
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to load principal profile:", error);
      setErrorMessage("تعذر تحميل البيانات الشخصية.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSavedMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSavedMessage("هذه الصفحة متصلة بالباك لعرض البيانات، وتعديلها يتم من إدارة المستخدمين.");
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">الملف الشخصي</h1>
        <p className="page-subtitle">
          تعديل بيانات مدير المدرسة وبيانات المدرسة.
        </p>
      </div>

      <div className="section-card">
        <h4>بيانات المدير والمدرسة</h4>
        {loading ? (
          <div className="alert-custom alert-info">جاري تحميل البيانات...</div>
        ) : null}
        {errorMessage ? (
          <div className="alert-custom alert-danger">{errorMessage}</div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label-custom">اسم المدير</label>
              <input
                type="text"
                name="principalName"
                value={profileData.principalName}
                onChange={handleChange}
                className="form-control-custom"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">اسم المدرسة</label>
              <input
                type="text"
                name="schoolName"
                value={profileData.schoolName}
                onChange={handleChange}
                className="form-control-custom"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">مديرية التربية</label>
              <select
                name="directorate"
                value={profileData.directorate}
                onChange={handleChange}
                className="form-select-custom"
                disabled
              >
                <option value="مديرية الخليل">مديرية الخليل</option>
                <option value="مديرية يطا">مديرية يطا</option>
                <option value="مديرية جنوب الخليل">مديرية جنوب الخليل</option>
                <option value="مديرية شمال الخليل">مديرية شمال الخليل</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">نوع المدرسة</label>
              <input
                type="text"
                name="schoolType"
                value={profileData.schoolType}
                onChange={handleChange}
                className="form-control-custom"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">رقم الهاتف</label>
              <input
                type="text"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
                className="form-control-custom"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                className="form-control-custom"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">العنوان</label>
              <input
                type="text"
                name="address"
                value={profileData.address}
                onChange={handleChange}
                className="form-control-custom"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">اسم المستخدم</label>
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleChange}
                className="form-control-custom"
                readOnly
              />
            </div>
          </div>

          {savedMessage && (
            <div className="alert-custom alert-success mt-3">
              {savedMessage}
            </div>
          )}

          <div className="mt-3">
            <button type="submit" className="btn-primary-custom">
              تحديث العرض
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Profile;