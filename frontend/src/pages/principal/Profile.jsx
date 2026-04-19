import { useEffect, useState } from "react";
import {
  getCurrentUser,
  updateUser,
  updateTrainingSite,
} from "../../services/api";

const empty = (v) => (v && v !== "—" ? String(v).trim() : "");

const DIRECTORATES = [
  { value: "وسط", label: "وسط" },
  { value: "شمال", label: "شمال" },
  { value: "جنوب", label: "جنوب" },
  { value: "يطا", label: "يطا" },
];

const SCHOOL_TYPES = [
  { value: "public", label: "مدرسة حكومية" },
  { value: "private", label: "مدرسة خاصة" },
];

const Profile = () => {
  const [userId, setUserId] = useState(null);
  const [trainingSiteId, setTrainingSiteId] = useState(null);

  const [profileData, setProfileData] = useState({
    principalName: "",
    schoolName: "",
    directorate: "وسط",
    schoolType: "public",
    phone: "",
    email: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      setUserId(user.id ?? null);
      setTrainingSiteId(user.training_site_id ?? trainingSite.id ?? null);

      setProfileData({
        principalName: empty(user.name) || "",
        schoolName: empty(trainingSite.name) || "",
        directorate: trainingSite.directorate || "وسط",
        schoolType: trainingSite.school_type === "private" ? "private" : "public",
        phone: empty(user.phone) || "",
        email: empty(user.email) || "",
        address: empty(trainingSite.location) || "",
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
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setErrorMessage("تعذر تحديد المستخدم الحالي.");
      return;
    }

    setSaving(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      await updateUser(userId, {
        name: profileData.principalName.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim() || null,
      });

      if (trainingSiteId) {
        await updateTrainingSite(trainingSiteId, {
          name: profileData.schoolName.trim(),
          location: profileData.address.trim() || null,
          directorate: profileData.directorate,
          school_type: profileData.schoolType,
        });
      }

      const refreshed = await getCurrentUser();
      const payload = refreshed?.data || refreshed;
      if (payload && typeof payload === "object") {
        localStorage.setItem("user", JSON.stringify(payload));
      }

      setSavedMessage("تم حفظ التعديلات بنجاح.");
      await fetchProfile();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        (error?.response?.data?.errors &&
          Object.values(error.response.data.errors).flat().join(" ")) ||
        "تعذر حفظ التعديلات.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const noTrainingSite = !trainingSiteId;

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">الملف الشخصي</h1>
        <p className="page-subtitle">
          تعديل بيانات مدير المدرسة وبيانات المدرسة ثم الضغط على حفظ.
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
        {noTrainingSite && !loading ? (
          <div className="alert-custom alert-warning">
            لم يُربط حسابك بموقع تدريب بعد؛ يمكنك تعديل بياناتك الشخصية فقط حتى يقوم
            المسؤول بالربط.
          </div>
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
                required
                disabled={saving}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">اسم المدرسة / جهة التدريب</label>
              <input
                type="text"
                name="schoolName"
                value={profileData.schoolName}
                onChange={handleChange}
                className="form-control-custom"
                disabled={saving || noTrainingSite}
                placeholder={noTrainingSite ? "غير متاح بدون ربط موقع" : ""}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">المديرية (منطقة)</label>
              <select
                name="directorate"
                value={profileData.directorate}
                onChange={handleChange}
                className="form-select-custom"
                disabled={saving || noTrainingSite}
              >
                {DIRECTORATES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">نوع المدرسة</label>
              <select
                name="schoolType"
                value={profileData.schoolType}
                onChange={handleChange}
                className="form-select-custom"
                disabled={saving || noTrainingSite}
              >
                {SCHOOL_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">رقم الهاتف</label>
              <input
                type="text"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
                className="form-control-custom"
                disabled={saving}
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
                required
                disabled={saving}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">العنوان / الموقع</label>
              <input
                type="text"
                name="address"
                value={profileData.address}
                onChange={handleChange}
                className="form-control-custom"
                disabled={saving || noTrainingSite}
              />
            </div>
          </div>

          {savedMessage ? (
            <div className="alert-custom alert-success mt-3">{savedMessage}</div>
          ) : null}

          <div className="mt-3">
            <button
              type="submit"
              className="btn-primary-custom"
              disabled={saving || loading}
            >
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Profile;
