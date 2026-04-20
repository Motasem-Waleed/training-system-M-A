import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addTemplateItem,
  createEvaluationTemplate,
  deleteTemplateItem,
  getEvaluationTemplate,
  updateEvaluationTemplate,
} from "../../../services/api";

const FIELD_TYPES = [
  { value: "score", label: "درجة رقمية" },
  { value: "text", label: "نص قصير" },
  { value: "textarea", label: "نص طويل" },
  { value: "radio", label: "اختيار واحد" },
  { value: "checkbox", label: "اختيارات متعددة" },
  { value: "date", label: "تاريخ" },
  { value: "file", label: "ملف" },
];

export default function EvaluationTemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(Boolean(id));
  const [templateErrors, setTemplateErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  const [template, setTemplate] = useState({
    name: "",
    description: "",
    form_type: "evaluation",
    target_role: "",
  });
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState({
    title: "",
    field_type: "score",
    options_text: "",
    is_required: false,
    max_score: 10,
  });

  const isTemplatePersisted = useMemo(() => Boolean(id), [id]);

  useEffect(() => {
    if (!id) return;

    const fetchTemplate = async () => {
      try {
        const data = await getEvaluationTemplate(id);
        setTemplate({
          name: data?.name || "",
          description: data?.description || "",
          form_type: data?.form_type || "evaluation",
          target_role: data?.target_role || "",
        });
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const handleTemplateChange = (event) => {
    const { name, value } = event.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemplateSubmit = async (event) => {
    event.preventDefault();
    setSavingTemplate(true);
    setTemplateErrors({});

    try {
      if (id) {
        await updateEvaluationTemplate(id, template);
      } else {
        await createEvaluationTemplate(template);
      }
      navigate("/admin/evaluation-templates");
    } catch (error) {
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        setTemplateErrors(validationErrors);
      } else {
        alert("تعذر حفظ قالب التقييم");
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleItemFormChange = (event) => {
    const { name, type, value, checked } = event.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    if (!id) return;
    setItemErrors({});

    const payload = {
      template_id: Number(id),
      title: itemForm.title,
      field_type: itemForm.field_type,
      is_required: itemForm.is_required,
    };

    if (itemForm.field_type === "score") {
      payload.max_score = Number(itemForm.max_score || 0);
    }

    if (itemForm.field_type === "radio" || itemForm.field_type === "checkbox") {
      payload.options = itemForm.options_text
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean);
    }

    try {
      const created = await addTemplateItem(id, payload);
      setItems((prev) => [...prev, created]);
      setItemForm({
        title: "",
        field_type: "score",
        options_text: "",
        is_required: false,
        max_score: 10,
      });
    } catch (error) {
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        setItemErrors(validationErrors);
      } else {
        alert("تعذر إضافة البند");
      }
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("حذف هذا البند؟")) return;
    try {
      await deleteTemplateItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error(error);
      alert("تعذر حذف البند");
    }
  };

  if (loadingTemplate) return <div className="text-center">جاري التحميل...</div>;

  return (
    <div className="evaluation-template-form">
      <div className="page-header">
        <h1>{id ? "تعديل قالب تقييم" : "إضافة قالب تقييم"}</h1>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/admin/evaluation-templates")}
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleTemplateSubmit} className="form">
        <div className="form-group">
          <label>اسم القالب *</label>
          <input
            type="text"
            name="name"
            value={template.name}
            onChange={handleTemplateChange}
            required
          />
          {templateErrors.name && (
            <span className="error">{templateErrors.name[0]}</span>
          )}
        </div>

        <div className="form-group">
          <label>الوصف</label>
          <textarea
            name="description"
            value={template.description}
            onChange={handleTemplateChange}
          />
          {templateErrors.description && (
            <span className="error">{templateErrors.description[0]}</span>
          )}
        </div>

        <div className="form-group">
          <label>نوع القالب *</label>
          <select
            name="form_type"
            value={template.form_type}
            onChange={handleTemplateChange}
            required
          >
            <option value="evaluation">تقييم</option>
            <option value="student_form">نموذج طالب</option>
          </select>
          {templateErrors.form_type && (
            <span className="error">{templateErrors.form_type[0]}</span>
          )}
        </div>

        <div className="form-group">
          <label>الدور المستهدف (اختياري)</label>
          <select
            name="target_role"
            value={template.target_role || ""}
            onChange={handleTemplateChange}
          >
            <option value="">عام — غير مخصص لدور معين</option>
            <option value="teacher">المعلم المرشد</option>
            <option value="academic_supervisor">المشرف الأكاديمي</option>
            <option value="psychologist">الأخصائي النفسي</option>
            <option value="school_manager">مدير جهة التدريب</option>
          </select>
          {templateErrors.target_role && (
            <span className="error">{templateErrors.target_role[0]}</span>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={savingTemplate}>
            {savingTemplate ? "جاري الحفظ..." : id ? "تحديث" : "إضافة"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/admin/evaluation-templates")}
          >
            إلغاء
          </button>
        </div>
      </form>

      {isTemplatePersisted && (
        <div className="form">
          <h1>بنود القالب</h1>

          <form onSubmit={handleAddItem}>
            <div className="form-group">
              <label>عنوان البند *</label>
              <input
                type="text"
                name="title"
                value={itemForm.title}
                onChange={handleItemFormChange}
                required
              />
              {itemErrors.title && <span className="error">{itemErrors.title[0]}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>نوع الحقل *</label>
                <select
                  name="field_type"
                  value={itemForm.field_type}
                  onChange={handleItemFormChange}
                  required
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {itemErrors.field_type && (
                  <span className="error">{itemErrors.field_type[0]}</span>
                )}
              </div>

              {itemForm.field_type === "score" && (
                <div className="form-group">
                  <label>الدرجة القصوى</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="max_score"
                    value={itemForm.max_score}
                    onChange={handleItemFormChange}
                  />
                  {itemErrors.max_score && (
                    <span className="error">{itemErrors.max_score[0]}</span>
                  )}
                </div>
              )}
            </div>

            {(itemForm.field_type === "radio" || itemForm.field_type === "checkbox") && (
              <div className="form-group">
                <label>الخيارات (كل خيار في سطر)</label>
                <textarea
                  name="options_text"
                  value={itemForm.options_text}
                  onChange={handleItemFormChange}
                />
                {itemErrors.options && <span className="error">{itemErrors.options[0]}</span>}
              </div>
            )}

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_required"
                  checked={itemForm.is_required}
                  onChange={handleItemFormChange}
                />{" "}
                حقل مطلوب
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                إضافة بند
              </button>
            </div>
          </form>

          <table className="data-table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>النوع</th>
                <th>مطلوب</th>
                <th>الحد الأعلى</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.field_type}</td>
                  <td>{item.is_required ? "نعم" : "لا"}</td>
                  <td>{item.max_score ?? "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-sm danger"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    لا توجد بنود بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
