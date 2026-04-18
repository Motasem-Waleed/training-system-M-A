import { useEffect, useState } from "react";
import {
  getTrainingSites,
  createTrainingSite,
  updateTrainingSite,
  deleteTrainingSite,
} from "../../services/api";

const getSchoolTypeFromItem = (item) => {
  if (item.school_type === "private") return "خاصة";
  if (item.school_type === "public") return "حكومية";

  const description = item.description || "";
  if (description.includes("school_type:private")) return "خاصة";
  if (description.includes("school_type:public")) return "حكومية";

  return "حكومية";
};

const normalizePlace = (item) => ({
  id: item.id,
  name: item.name || "—",
  school_type: getSchoolTypeFromItem(item),
  city: item.location || "—",
  capacity: item.capacity ?? 0,
  directorate: item.directorate || "وسط",
  status:
    item.is_active === true || item.is_active === 1 ? "متاح" : "غير نشط",
  is_active: item.is_active === true || item.is_active === 1,
});

const toApiSchoolType = (value) => (value === "خاصة" ? "private" : "public");

const extractValidationMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  const validationErrors = error?.response?.data?.errors;
  if (validationErrors && typeof validationErrors === "object") {
    const firstField = Object.keys(validationErrors)[0];
    const firstError = firstField ? validationErrors[firstField]?.[0] : null;
    if (firstError) return firstError;
  }
  return apiMessage || fallback;
};

export default function TrainingPlaces() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    school_type: "حكومية",
    city: "",
    capacity: "",
    directorate: "وسط",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    school_type: "حكومية",
    city: "",
    capacity: "",
    directorate: "وسط",
    is_active: true,
  });

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getTrainingSites();

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setPlaces(list.map(normalizePlace));
    } catch (error) {
      console.error("Failed to load training sites:", error);
      setErrorMessage("تعذر تحميل أماكن التدريب.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "متاح") return "badge-custom badge-success";
    if (status === "غير نشط") return "badge-custom badge-danger";
    return "badge-custom badge-soft";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSavedMessage("");
    setErrorMessage("");
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.school_type ||
      !formData.city ||
      !formData.capacity ||
      !formData.directorate
    ) {
      setErrorMessage("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }

    try {
      setSavedMessage("");
      setErrorMessage("");

      await createTrainingSite({
        name: formData.name,
        location: formData.city,
        capacity: Number(formData.capacity),
        is_active: true,
        directorate: formData.directorate,
        school_type: toApiSchoolType(formData.school_type),

        // الباك يطلبهم، فنرسلهم ثابتين بدون عرضهم في الواجهة
        site_type: "school",
        governing_body: "directorate_of_education",

        // نخزن نوع المدرسة داخل الوصف حتى يظهر لاحقًا
        description:
          formData.school_type === "خاصة"
            ? "school_type:private"
            : "school_type:public",
      });

      setFormData({
        name: "",
        school_type: "حكومية",
        city: "",
        capacity: "",
        directorate: "وسط",
      });

      setSavedMessage("تم حفظ مكان التدريب بنجاح.");
      fetchPlaces();
    } catch (error) {
      console.error("Failed to create training site:", error);
      setErrorMessage(
        extractValidationMessage(error, "تعذر حفظ مكان التدريب.")
      );
    }
  };

  const startEdit = (place) => {
    setEditingId(place.id);
    setEditFormData({
      name: place.name,
      school_type: place.school_type,
      city: place.city,
      capacity: String(place.capacity),
      directorate: place.directorate,
      is_active: place.is_active,
    });
    setSavedMessage("");
    setErrorMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      name: "",
      school_type: "حكومية",
      city: "",
      capacity: "",
      directorate: "وسط",
      is_active: true,
    });
  };

  const handleUpdatePlace = async (id) => {
    if (
      !editFormData.name ||
      !editFormData.school_type ||
      !editFormData.city ||
      !editFormData.capacity ||
      !editFormData.directorate
    ) {
      setErrorMessage("يرجى تعبئة جميع حقول التعديل المطلوبة.");
      return;
    }

    try {
      setSavedMessage("");
      setErrorMessage("");

      await updateTrainingSite(id, {
        name: editFormData.name,
        location: editFormData.city,
        capacity: Number(editFormData.capacity),
        is_active: editFormData.is_active,
        directorate: editFormData.directorate,
        school_type: toApiSchoolType(editFormData.school_type),

        // ثابتين للباك
        site_type: "school",
        governing_body: "directorate_of_education",

        description:
          editFormData.school_type === "خاصة"
            ? "school_type:private"
            : "school_type:public",
      });

      setSavedMessage("تم تعديل مكان التدريب بنجاح.");
      setEditingId(null);
      fetchPlaces();
    } catch (error) {
      console.error("Failed to update training site:", error);
      setErrorMessage(
        extractValidationMessage(error, "تعذر تعديل مكان التدريب.")
      );
    }
  };

  const handleDeletePlace = async (id) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف مكان التدريب؟");
    if (!confirmed) return;

    try {
      setSavedMessage("");
      setErrorMessage("");

      await deleteTrainingSite(id);
      setSavedMessage("تم حذف مكان التدريب بنجاح.");
      fetchPlaces();
    } catch (error) {
      console.error("Failed to delete training site:", error);
      setErrorMessage("تعذر حذف مكان التدريب.");
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">أماكن التدريب</h1>
        <p className="page-subtitle">
          إدارة وعرض أماكن التدريب المعتمدة التابعة لمديرية التربية والتعليم.
        </p>
      </div>

      <div className="section-card mb-3">
        <h4>إضافة مكان تدريب جديد</h4>

        <form onSubmit={handleAddPlace}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label-custom">اسم مكان التدريب</label>
              <input
                type="text"
                name="name"
                className="form-control-custom"
                placeholder="أدخل اسم مكان التدريب"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">نوع المدرسة</label>
              <select
                name="school_type"
                className="form-select-custom"
                value={formData.school_type}
                onChange={handleChange}
              >
                <option value="حكومية">حكومية</option>
                <option value="خاصة">خاصة</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">المدينة / الموقع</label>
              <input
                type="text"
                name="city"
                className="form-control-custom"
                placeholder="أدخل المدينة أو الموقع"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">السعة</label>
              <input
                type="number"
                name="capacity"
                className="form-control-custom"
                placeholder="أدخل عدد الطلبة الممكن استقبالهم"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">المديرية</label>
              <select
                name="directorate"
                className="form-select-custom"
                value={formData.directorate}
                onChange={handleChange}
              >
                <option value="وسط">وسط</option>
                <option value="شمال">شمال</option>
                <option value="جنوب">جنوب</option>
                <option value="يطا">يطا</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <button type="submit" className="btn-primary-custom">
              حفظ مكان التدريب
            </button>
          </div>

          {savedMessage && (
            <div className="alert-custom alert-success mt-3">
              {savedMessage}
            </div>
          )}

          {errorMessage && (
            <div className="alert-custom alert-danger mt-3">
              {errorMessage}
            </div>
          )}
        </form>
      </div>

      <div className="section-card">
        <h4>قائمة أماكن التدريب</h4>

        {loading ? (
          <div className="alert-custom alert-info">
            جاري تحميل أماكن التدريب...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>اسم المكان</th>
                  <th>نوع المدرسة</th>
                  <th>المدينة</th>
                  <th>السعة</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {places.map((place) =>
                  editingId === place.id ? (
                    <tr key={place.id}>
                      <td>
                        <input
                          type="text"
                          name="name"
                          className="form-control-custom"
                          value={editFormData.name}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <select
                          name="school_type"
                          className="form-select-custom"
                          value={editFormData.school_type}
                          onChange={handleEditChange}
                        >
                          <option value="حكومية">حكومية</option>
                          <option value="خاصة">خاصة</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="city"
                          className="form-control-custom"
                          value={editFormData.city}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="capacity"
                          className="form-control-custom"
                          value={editFormData.capacity}
                          onChange={handleEditChange}
                          min="1"
                        />
                      </td>
                      <td>
                        <label
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={editFormData.is_active}
                            onChange={handleEditChange}
                          />
                          نشط
                        </label>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-primary-custom btn-sm-custom"
                            onClick={() => handleUpdatePlace(place.id)}
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            className="btn-outline-custom btn-sm-custom"
                            onClick={cancelEdit}
                          >
                            إلغاء
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={place.id}>
                      <td>{place.name}</td>
                      <td>{place.school_type}</td>
                      <td>{place.city}</td>
                      <td>{place.capacity}</td>
                      <td>
                        <span className={getStatusClass(place.status)}>
                          {place.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-outline-custom btn-sm-custom"
                            onClick={() => startEdit(place)}
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="btn-danger-custom btn-sm-custom"
                            onClick={() => handleDeletePlace(place.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}

                {places.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">
                      لا توجد أماكن تدريب مسجلة حاليًا
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}