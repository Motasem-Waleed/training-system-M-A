import { useCallback, useEffect, useState } from "react";
import {
  addPortfolioEntry,
  apiOrigin,
  deletePortfolioEntry,
  getStudentPortfolio,
} from "../../services/api";

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentPortfolio();
      const p = res?.data ?? res;
      const list = p?.entries?.data ?? p?.entries ?? [];
      setEntries(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل ملف الإنجاز.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fileHref = (path) => {
    if (!path) return null;
    if (String(path).startsWith("http")) return path;
    return `${apiOrigin}/storage/${String(path).replace(/^\//, "")}`;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("أدخل عنوانًا للمدخل.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      if (form.content.trim()) fd.append("content", form.content.trim());
      if (file) fd.append("file", file);
      await addPortfolioEntry(fd);
      setSuccess("تمت إضافة المدخل.");
      setForm({ title: "", content: "" });
      setFile(null);
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || "فشل الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("حذف هذا المدخل؟")) return;
    setError("");
    try {
      await deletePortfolioEntry(id);
      setSuccess("تم الحذف.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل الحذف.");
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">الملف الإنجازي</h1>
        <p className="page-subtitle">إرفاق شواهد وأعمال تتعلق بتدريبك الميداني</p>
      </div>

      {success ? (
        <div className="alert-custom alert-success mb-3">{success}</div>
      ) : null}
      {error ? (
        <div className="alert-custom alert-danger mb-3">{error}</div>
      ) : null}

      <div className="section-card mb-3">
        <h4>إضافة مدخل جديد</h4>
        <form onSubmit={handleAdd} className="row g-3">
          <div className="col-md-6">
            <label className="form-label-custom">العنوان</label>
            <input
              className="form-control-custom"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label-custom">مرفق (PDF / صور / Word)</label>
            <input
              type="file"
              className="form-control-custom"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="col-12">
            <label className="form-label-custom">وصف أو ملاحظات</label>
            <textarea
              className="form-control-custom"
              rows={3}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </div>
          <div className="col-12">
            <button type="submit" className="btn-primary-custom" disabled={saving}>
              {saving ? "جاري الحفظ..." : "إضافة"}
            </button>
          </div>
        </form>
      </div>

      <div className="section-card">
        <h4>مدخلاتك</h4>
        {loading ? (
          <p>جاري التحميل...</p>
        ) : entries.length === 0 ? (
          <p className="text-muted mb-0">لا توجد مدخلات بعد.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>الوصف</th>
                  <th>مرفق</th>
                  <th>التاريخ</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((en) => (
                  <tr key={en.id}>
                    <td>{en.title}</td>
                    <td style={{ maxWidth: 240 }}>{(en.content || "—").slice(0, 100)}</td>
                    <td>
                      {en.file_path ? (
                        <a href={fileHref(en.file_path)} target="_blank" rel="noreferrer">
                          عرض
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{en.created_at?.slice(0, 10) || "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-danger-custom btn-sm-custom"
                        onClick={() => handleDelete(en.id)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
