import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createTrainingPeriod,
  getTrainingPeriod,
  updateTrainingPeriod,
} from "../../../services/api";

export default function TrainingPeriodForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
  });

  useEffect(() => {
    if (!id) return;

    const fetchPeriod = async () => {
      try {
        const data = await getTrainingPeriod(id);
        setForm({
          name: data?.name || "",
          start_date: data?.start_date || "",
          end_date: data?.end_date || "",
          is_active: Boolean(data?.is_active),
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchPeriod();
  }, [id]);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (id) {
        await updateTrainingPeriod(id, form);
      } else {
        await createTrainingPeriod(form);
      }
      navigate("/admin/training-periods");
    } catch (error) {
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        setErrors(validationErrors);
      } else {
        alert("تعذر حفظ الفترة التدريبية");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="training-period-form">
      <div className="page-header">
        <h1>{id ? "تعديل فترة تدريبية" : "إضافة فترة تدريبية"}</h1>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/admin/training-periods")}
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>اسم الفترة *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          {errors.name && <span className="error">{errors.name[0]}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>تاريخ البدء *</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
            />
            {errors.start_date && (
              <span className="error">{errors.start_date[0]}</span>
            )}
          </div>

          <div className="form-group">
            <label>تاريخ النهاية *</label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              required
            />
            {errors.end_date && (
              <span className="error">{errors.end_date[0]}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />{" "}
            تعيين هذه الفترة كفترة نشطة
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "جاري الحفظ..." : id ? "تحديث" : "إضافة"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/admin/training-periods")}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
