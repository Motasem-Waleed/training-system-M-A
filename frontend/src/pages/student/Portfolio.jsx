import { useCallback, useEffect, useState } from "react";
import {
  addPortfolioEntry,
  apiOrigin,
  deletePortfolioEntry,
  getStudentPortfolio,
} from "../../services/api";
import { Loader2, Upload, FileText, Trash2, ExternalLink, Plus, FolderOpen, Calendar, FileCheck, BookOpen, ClipboardCheck, FileBarChart, FileSpreadsheet, GraduationCap } from "lucide-react";

// CSS Animation
const fadeInStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin { animation: spin 1s linear infinite; }
`;

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      setSuccess("تمت إضافة المدخل بنجاح!");
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
    if (!window.confirm("هل أنت متأكد من حذف هذا المدخل؟")) return;
    setError("");
    try {
      await deletePortfolioEntry(id);
      setSuccess("تم الحذف بنجاح.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل الحذف.");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const getEntryStyle = (title) => {
    const t = (title || '').toString();
    if (t.includes('برنامج التدريب')) return { icon: Calendar, color: '#667eea', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', bg: '#f5f3ff' };
    if (t.includes('حضور') || t.includes('غياب')) return { icon: ClipboardCheck, color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)', bg: '#ecfeff' };
    if (t.includes('نقد خبرات') || t.includes('خبرات التعلم')) return { icon: BookOpen, color: '#059669', gradient: 'linear-gradient(135deg, #059669, #34d399)', bg: '#ecfdf5' };
    if (t.includes('تقرير مختصر') || t.includes('المختصر')) return { icon: FileBarChart, color: '#d97706', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)', bg: '#fffbeb' };
    if (t.includes('تقرير الأسبوعي') || t.includes('الأسبوعي')) return { icon: FileSpreadsheet, color: '#e11d48', gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)', bg: '#fff1f2' };
    if (t.includes('حصص')) return { icon: GraduationCap, color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)', bg: '#f5f3ff' };
    if (t.includes('زيارة') || t.includes('ميدان')) return { icon: FileCheck, color: '#0284c7', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)', bg: '#f0f9ff' };
    return { icon: FolderOpen, color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)', bg: '#f9fafb' };
  };

  return (
    <>
      <style>{fadeInStyles}</style>
      <div className="content-header">
        <h1 className="page-title">ملف الإنجاز</h1>
        <p className="page-subtitle">إرفاق شواهد وأعمال تتعلق بتدريبك الميداني</p>
      </div>

      {success ? (
        <div className="alert-custom alert-success mb-3" style={{ animation: "fadeIn 0.3s ease" }}>{success}</div>
      ) : null}
      {error ? (
        <div className="alert-custom alert-danger mb-3" style={{ animation: "fadeIn 0.3s ease" }}>{error}</div>
      ) : null}

      {/* Add New Entry Card */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "16px",
        padding: "1.5rem 2rem",
        color: "white",
        marginBottom: "1.5rem"
      }}>
        <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={24} />
          إضافة مدخل جديد
        </h4>
        <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
          أرفق ملفاتك وأعمالك لتوثيق تدريبك
        </p>
      </div>

      <div style={{
        backgroundColor: "white",
        borderRadius: "0 0 16px 16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "2rem",
        border: "1px solid #e8e8e8",
        marginBottom: "2rem",
        animation: "fadeIn 0.4s ease-out"
      }}>
        <form onSubmit={handleAdd}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginBottom: "1.5rem"
          }}>
            {/* Title Field */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#495057",
                marginBottom: "0.5rem"
              }}>
                عنوان المدخل *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                placeholder="مثال: تقرير تدريس الصف الرابع..."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  transition: "all 0.2s",
                  backgroundColor: "white",
                  fontFamily: "inherit"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--primary, #007bff)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* File Upload */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#495057",
                marginBottom: "0.5rem"
              }}>
                مرفق (PDF / صور / Word)
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: dragActive ? "2px dashed var(--primary, #007bff)" : "2px dashed #ccc",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  backgroundColor: dragActive ? "rgba(0,123,255,0.05)" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}
              >
                <Upload size={20} color={dragActive ? "var(--primary, #007bff)" : "#666"} />
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ flex: 1, border: "none", background: "transparent", fontSize: "0.9rem" }}
                />
              </div>
              {file && (
                <div style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "#2e7d32",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <FileText size={16} />
                  تم اختيار: {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Description Field */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#495057",
              marginBottom: "0.5rem",
              display: "block"
            }}>
              وصف أو ملاحظات
            </label>
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="اكتب وصفًا تفصيليًا للعمل أو المرفق..."
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: "10px",
                fontSize: "1rem",
                resize: "vertical",
                transition: "all 0.2s",
                backgroundColor: "white",
                fontFamily: "inherit"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--primary, #007bff)";
                e.target.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.875rem 2rem",
                backgroundColor: "var(--primary, #007bff)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,123,255,0.3)"
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = "#0056b3";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,123,255,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary, #007bff)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,123,255,0.3)";
              }}
            >
              {saving ? <Loader2 className="spin" size={20} /> : <Plus size={20} />}
              {saving ? "جاري الحفظ..." : "إضافة مدخل"}
            </button>
          </div>
        </form>
      </div>

      {/* Entries Section */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "1.5rem",
        border: "1px solid #e8e8e8",
        animation: "fadeIn 0.4s ease-out"
      }}>
        <h4 style={{
          margin: 0,
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#495057",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <FolderOpen size={22} color="var(--primary, #007bff)" />
          مدخلاتك ({entries.length})
        </h4>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <Loader2 className="spin" size={40} color="var(--primary, #007bff)" />
            <p style={{ color: "#666", marginTop: "1rem" }}>جاري التحميل...</p>
          </div>
        ) : entries.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            border: "2px dashed #dee2e6"
          }}>
            <FolderOpen size={60} color="#adb5bd" style={{ marginBottom: "1rem" }} />
            <h5 style={{ color: "#495057", margin: "0 0 0.5rem 0" }}>لا توجد مدخلات بعد</h5>
            <p style={{ color: "#6c757d", margin: 0 }}>ابدأ بإضافة أول عمل أو شاهد لتوثيق تدريبك</p>
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            {entries.map((en) => {
              const style = getEntryStyle(en.title);
              const EntryIcon = style.icon;
              return (
                <div
                  key={en.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "14px",
                    border: "1px solid #e9ecef",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = `0 10px 24px ${style.color}20`;
                    e.currentTarget.style.borderColor = `${style.color}55`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                    e.currentTarget.style.borderColor = "#e9ecef";
                  }}
                >
                  {/* شريط لوني علوي */}
                  <div style={{ height: "4px", background: style.gradient }} />

                  <div style={{ padding: "1.1rem 1.25rem" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}>
                      {/* أيقونة النموذج */}
                      <div style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "11px",
                        background: style.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 3px 10px ${style.color}30`,
                      }}>
                        <EntryIcon size={20} color="white" />
                      </div>

                      {/* اسم النموذج + التاريخ */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{
                          margin: 0,
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {en.title}
                        </h5>
                        <span style={{
                          fontSize: "0.72rem",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          marginTop: "0.15rem",
                        }}>
                          <Calendar size={11} />
                          {en.created_at ? new Date(en.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}
                        </span>
                      </div>

                      {/* أزرار المرفق والحذف */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                        {en.file_path ? (
                          <a
                            href={fileHref(en.file_path)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              color: style.color,
                              textDecoration: "none",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              padding: "0.35rem 0.7rem",
                              borderRadius: "8px",
                              backgroundColor: style.bg,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${style.color}18`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = style.bg;
                            }}
                          >
                            <FileText size={15} />
                            المرفق
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{
                            color: "#cbd5e1",
                            fontSize: "0.78rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.35rem 0.5rem",
                          }}>
                            <FileText size={14} />
                            بدون مرفق
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(en.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#cbd5e1",
                            padding: "4px",
                            borderRadius: "6px",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#ef4444";
                            e.currentTarget.style.backgroundColor = "#fef2f2";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#cbd5e1";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                          title="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
