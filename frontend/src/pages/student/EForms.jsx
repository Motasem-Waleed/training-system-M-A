import { useEffect, useMemo, useState } from "react";
import { getStudentEForms, saveStudentEForm, submitStudentEForm } from "../../services/api";

const requiredForms = [
  { key: "weekly_reflection", title: "نموذج التأمل الأسبوعي" },
  { key: "field_visit_summary", title: "نموذج ملخص الزيارة الميدانية" },
];

export default function EForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drafts, setDrafts] = useState({});

  const byKey = useMemo(
    () => forms.reduce((acc, f) => ({ ...acc, [f.form_key]: f }), {}),
    [forms]
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudentEForms();
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setForms(list);
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل النماذج.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (formKey, title) => {
    setError("");
    setSuccess("");
    try {
      const payload = {
        form_key: formKey,
        title,
        payload: {
          answers: drafts[formKey] || "",
        },
      };
      await saveStudentEForm(payload);
      setSuccess("تم حفظ النموذج كمسودة.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل حفظ النموذج.");
    }
  };

  const handleSubmit = async (item, formKey, title) => {
    setError("");
    setSuccess("");
    try {
      let id = item?.id;
      if (!id) {
        const created = await saveStudentEForm({
          form_key: formKey,
          title,
          payload: { answers: drafts[formKey] || "" },
        });
        id = created?.id || created?.data?.id;
      }

      await submitStudentEForm(id, {
        payload: {
          answers: drafts[formKey] || item?.payload?.answers || "",
        },
      });
      setSuccess("تم إرسال النموذج بنجاح.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل إرسال النموذج.");
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">النماذج الإلكترونية</h1>
        <p className="page-subtitle">تعبئة النماذج المطلوبة، حفظ المسودة، ثم الإرسال.</p>
      </div>

      {error ? <div className="alert-custom alert-danger mb-3">{error}</div> : null}
      {success ? <div className="alert-custom alert-success mb-3">{success}</div> : null}

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : (
        <div className="row g-3">
          {requiredForms.map((f) => {
            const current = byKey[f.key];
            const isSubmitted = current?.status === "submitted";
            return (
              <div className="col-12" key={f.key}>
                <div className="section-card">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="mb-0">{f.title}</h4>
                    <span className="badge-custom badge-soft">
                      {isSubmitted ? "مرسل" : current?.status === "draft" ? "مسودة" : "جديد"}
                    </span>
                  </div>
                  <textarea
                    className="form-control-custom"
                    rows={4}
                    value={
                      drafts[f.key] ??
                      current?.payload?.answers ??
                      ""
                    }
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    disabled={isSubmitted}
                    placeholder="اكتب إجابات النموذج هنا..."
                  />
                  {!isSubmitted ? (
                    <div className="d-flex gap-2 mt-3">
                      <button className="btn-outline-custom" onClick={() => handleSave(f.key, f.title)}>
                        حفظ مسودة
                      </button>
                      <button className="btn-primary-custom" onClick={() => handleSubmit(current, f.key, f.title)}>
                        إرسال النموذج
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
