import { useCallback, useEffect, useState, useMemo } from "react";
import {
  createStudentTrainingRequest,
  getCourses,
  getStudentTrainingRequests,
  getTrainingPeriods,
  getTrainingSites,
  itemsFromPagedResponse,
  updateStudentTrainingRequest,
} from "../../services/api";

// Labels
const governingLabels = {
  directorate_of_education: "مديرية التربية والتعليم",
  ministry_of_health: "وزارة الصحة",
};

const siteTypeLabels = {
  school: "مدرسة",
  health_center: "مصحة / مركز صحي / نفسي / مجتمعي",
};

const directorateLabels = {
  "وسط": "وسط",
  "شمال": "شمال",
  "جنوب": "جنوب",
  "يطا": "يطا",
};

// Status configurations with colors and labels
const statusConfig = {
  draft: { label: "مسودة", color: "#6c757d", bg: "#f8f9fa" },
  sent_to_coordinator: { label: "بانتظار المنسق", color: "#ffc107", bg: "#fff8e1" },
  prelim_approved: { label: "اعتماد مبدئي", color: "#17a2b8", bg: "#e3f2fd" },
  sent_to_directorate: { label: "بانتظار المديرية", color: "#fd7e14", bg: "#fff3e0" },
  directorate_approved: { label: "موافقة المديرية", color: "#28a745", bg: "#e8f5e9" },
  sent_to_school: { label: "بانتظار المدرسة", color: "#6f42c1", bg: "#ede7f6" },
  school_approved: { label: "مقبول ومعين", color: "#20c997", bg: "#e0f7fa" },
  needs_edit: { label: "يحتاج تعديل", color: "#dc3545", bg: "#ffebee" },
  rejected: { label: "مرفوض", color: "#dc3545", bg: "#ffebee" },
  coordinator_rejected: { label: "مرفوض من المنسق", color: "#dc3545", bg: "#ffebee" },
};

// Helper component for status badge
const StatusBadge = ({ status, showPulse = false }) => {
  const config = statusConfig[status] || { label: status, color: "#666", bg: "#f5f5f5" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}`,
      }}
    >
      {showPulse && (
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: config.color,
            animation: "pulse 2s infinite",
          }}
        />
      )}
      {config.label}
    </span>
  );
};

// Step indicator component
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { key: "student", label: "الطالب", icon: "🎓" },
    { key: "coordinator", label: "المنسق", icon: "👨‍💼" },
    { key: "directorate", label: "المديرية", icon: "🏛️" },
    { key: "school", label: "المدرسة", icon: "🏫" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "24px",
        padding: "16px",
        background: "#f8f9fa",
        borderRadius: "12px",
      }}
    >
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div
            key={step.key}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              opacity: isActive ? 1 : 0.4,
            }}
          >
            <span
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                background: isCurrent ? "var(--primary)" : isActive ? "#e3f2fd" : "#e9ecef",
                border: `2px solid ${isCurrent ? "var(--primary)" : isActive ? "#90caf9" : "#dee2e6"}`,
                transition: "all 0.3s ease",
              }}
            >
              {isActive && !isCurrent ? "✓" : step.icon}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: isCurrent ? "700" : "500" }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function TrainingRequest() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [courses, setCourses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [sites, setSites] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [filters, setFilters] = useState({
    governing_body: "",
    directorate: "",
    site_type: "",
    search: "",
    location: "",
  });

  const [formData, setFormData] = useState({
    training_site_id: "",
    training_period_id: "",
    course_id: "",
    start_date: "",
    end_date: "",
    notes: "",
    attachment_path: "",
  });

  async function loadBootstrap() {
    setLoading(true);
    setError("");
    try {
      const [coursesRes, periodsRes, myReqRes] = await Promise.all([
        getCourses({ per_page: 200 }),
        getTrainingPeriods(),
        getStudentTrainingRequests(),
      ]);

      setCourses(itemsFromPagedResponse(coursesRes));
      setPeriods(itemsFromPagedResponse(periodsRes));
      setMyRequests(itemsFromPagedResponse(myReqRes));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  const loadSites = useCallback(async () => {
    if (!filters.governing_body || !filters.site_type) {
      setSites([]);
      return;
    }

    setError("");
    try {
      const params = {
        governing_body: filters.governing_body,
        site_type: filters.site_type,
        is_active: true,
        per_page: 200,
      };
      if (filters.governing_body === "directorate_of_education" && filters.directorate) {
        params.directorate = filters.directorate;
      }
      const loc = filters.location.trim();
      if (loc) {
        params.location = loc;
      }
      const q = filters.search.trim();
      if (q) {
        params.search = q;
      }
      const res = await getTrainingSites(params);
      setSites(itemsFromPagedResponse(res));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل جهات التدريب");
    }
  }, [
    filters.governing_body,
    filters.directorate,
    filters.site_type,
    filters.location,
    filters.search,
  ]);

  useEffect(() => {
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      loadSites();
    }, 380);
    return () => window.clearTimeout(t);
  }, [loadSites]);

  async function startEdit(request) {
    setError("");
    setSuccess("");
    setEditingId(request.id);
    const site = request.training_site || request.trainingSite;
    const s0 = (request.students && request.students[0]) || null;

    setFilters((prev) => ({
      ...prev,
      governing_body: request.governing_body || prev.governing_body,
      directorate: site?.directorate || "",
      site_type: site?.site_type || "",
    }));

    setFormData({
      training_site_id: site?.id ? String(site.id) : "",
      training_period_id: request.training_period_id
        ? String(request.training_period_id)
        : request.training_period?.id
          ? String(request.training_period.id)
          : "",
      course_id: s0?.course?.id ? String(s0.course.id) : s0?.course_id ? String(s0.course_id) : "",
      start_date: s0?.start_date || "",
      end_date: s0?.end_date || "",
      notes: s0?.notes || "",
      attachment_path: request.attachment_path || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setSuccess("");
    setError("");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        training_site_id: Number(formData.training_site_id),
        training_period_id: formData.training_period_id ? Number(formData.training_period_id) : null,
        course_id: Number(formData.course_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes || null,
        attachment_path: formData.attachment_path || null,
      };

      if (editingId) {
        await updateStudentTrainingRequest(editingId, payload);
        setSuccess("تم تحديث الطلب وإعادة إرساله للمنسق الأكاديمي.");
        setEditingId(null);
      } else {
        // الخادم يضبط governing_body من موقع التدريب؛ إرسال قيمة من الفلاتر قد يختلف عن الموقع المختار فيُرجَع 422
        await createStudentTrainingRequest(payload);
        setSuccess("تم إرسال طلب التدريب بنجاح، وسيتم مراجعته من المنسق الأكاديمي.");
        setFormData({
          training_site_id: "",
          training_period_id: "",
          course_id: "",
          start_date: "",
          end_date: "",
          notes: "",
          attachment_path: "",
        });
      }

      const myReqRes = await getStudentTrainingRequests();
      const reqs =
        myReqRes?.data ??
        (Array.isArray(myReqRes) ? myReqRes : myReqRes?.data?.data ?? []);
      setMyRequests(Array.isArray(reqs) ? reqs : []);
    } catch (e2) {
      setError(e2?.response?.data?.message || "فشل حفظ الطلب");
    } finally {
      setSaving(false);
    }
  };

  // Helper to get current workflow step
  const getCurrentStep = useMemo(() => {
    if (!editingId) return "student";
    const request = myRequests.find((r) => r.id === editingId);
    if (!request) return "student";
    const status = request.book_status;
    if (status === "school_approved") return "school";
    if (["sent_to_school", "directorate_approved"].includes(status)) return "directorate";
    if (["sent_to_directorate", "prelim_approved"].includes(status)) return "coordinator";
    return "student";
  }, [editingId, myRequests]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors = {};
    if (!formData.training_site_id) {
      errors.training_site_id = "يرجى اختيار جهة التدريب";
    }
    if (!formData.course_id) {
      errors.course_id = "يرجى اختيار المساق التدريبي";
    }
    if (!formData.start_date) {
      errors.start_date = "يرجى تحديد تاريخ البداية";
    }
    if (!formData.end_date) {
      errors.end_date = "يرجى تحديد تاريخ النهاية";
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.end_date = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    }
    return errors;
  }, [formData]);

  const isFormValid = Object.keys(validationErrors).length === 0;

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="content-header">
        <h1 className="page-title">طلب التدريب الميداني</h1>
        <p className="page-subtitle">
          قدم طلبك للتدريب الميداني باختيار الجهة المناسبة. سيتم مراجعة طلبك من قبل المنسق الأكاديمي،
          ثم الجهة الرسمية (التربية أو الصحة)، وأخيراً جهة التدريب.
        </p>
      </div>

      {loading ? (
        <div className="section-card">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
            <p>جاري تحميل البيانات...</p>
          </div>
        </div>
      ) : (
        <>
          {error ? (
            <div className="section-card" style={{ borderRight: "4px solid #dc3545" }}>
              <p style={{ color: "#dc3545", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️</span>
                {error}
              </p>
            </div>
          ) : null}

          {success ? (
            <div className="section-card" style={{ borderRight: "4px solid #28a745" }}>
              <p style={{ color: "#28a745", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✅</span>
                {success}
              </p>
            </div>
          ) : null}

          {/* Workflow Progress Indicator */}
          {editingId && (
            <div className="section-card" style={{ padding: "20px" }}>
              <h4 style={{ marginBottom: "16px", textAlign: "center" }}>حالة سير الطلب</h4>
              <StepIndicator currentStep={getCurrentStep} />
            </div>
          )}

          <div className="section-card">
            <div className="panel-header" style={{ marginBottom: "24px" }}>
              <div>
                <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.5rem" }}>{editingId ? "📝" : "🎓"}</span>
                  {editingId ? "تعديل طلب التدريب" : "نموذج طلب تدريب جديد"}
                </h3>
                <p className="panel-subtitle">
                  {editingId
                    ? "قم بتعديل البيانات المطلوبة ثم احفظ لإعادة إرسال الطلب للمراجعة."
                    : "اتبع الخطوات أدناه لإكمال طلب التدريب. جميع الحقول المميزة بـ * مطلوبة."}
                </p>
              </div>
              {editingId ? (
                <button type="button" className="btn-outline-custom" onClick={cancelEdit}>
                  ❌ إلغاء التعديل
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label-custom">الجهة الرسمية المشرفة</label>
                  <select
                    className="form-select-custom"
                    value={filters.governing_body}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        governing_body: e.target.value,
                        directorate: "",
                      }))
                    }
                    disabled={!!editingId}
                  >
                    <option value="">اختر</option>
                    <option value="directorate_of_education">مديرية التربية والتعليم</option>
                    <option value="ministry_of_health">وزارة الصحة</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label-custom">نوع جهة التدريب</label>
                  <select
                    className="form-select-custom"
                    value={filters.site_type}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, site_type: e.target.value }))
                    }
                    disabled={!filters.governing_body || !!editingId}
                  >
                    <option value="">اختر</option>
                    <option value="school">مدرسة</option>
                    <option value="health_center">
                      مصحة / مركز صحي / نفسي / مركز مجتمعي
                    </option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label-custom">المديرية (للمدارس)</label>
                  <select
                    className="form-select-custom"
                    value={filters.directorate}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, directorate: e.target.value }))
                    }
                    disabled={filters.governing_body !== "directorate_of_education" || !!editingId}
                  >
                    <option value="">الكل</option>
                    <option value="وسط">وسط</option>
                    <option value="شمال">شمال</option>
                    <option value="جنوب">جنوب</option>
                    <option value="يطا">يطا</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">المنطقة / البلدة (حقل الموقع في النظام)</label>
                  <input
                    className="form-input-custom"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, location: e.target.value }))
                    }
                    placeholder="مثال: الخليل، إذنا، ترقوميا، بيت أمر…"
                    disabled={!filters.governing_body || !filters.site_type || !!editingId}
                  />
                  <small className="text-muted d-block mt-1">
                    يُرسل للخادم مع المديرية ويُفلتر عمود «الموقع».
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">بحث باسم المدرسة أو جهة التدريب</label>
                  <input
                    className="form-input-custom"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, search: e.target.value }))
                    }
                    placeholder="جزء من الاسم… (يبحث في قاعدة البيانات)"
                    disabled={!filters.governing_body || !filters.site_type}
                  />
                  <small className="text-muted d-block mt-1">
                    يُدمج مع المنطقة: النتائج تطابق الموقع واسم الجهة معاً.
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">
                    جهة التدريب <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <select
                    className={`form-select-custom ${validationErrors.training_site_id ? "is-invalid" : ""}`}
                    value={formData.training_site_id}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, training_site_id: e.target.value }))
                    }
                    disabled={sites.length === 0}
                    required
                  >
                    <option value="">{sites.length === 0 ? "اختر الفلاتر أولاً" : "اختر جهة التدريب"}</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.location ? ` — ${s.location}` : ""}
                      </option>
                    ))}
                  </select>
                  {validationErrors.training_site_id && (
                    <small style={{ color: "#dc3545", fontSize: "0.8rem" }}>
                      {validationErrors.training_site_id}
                    </small>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">
                    المساق التدريبي <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <select
                    className={`form-select-custom ${validationErrors.course_id ? "is-invalid" : ""}`}
                    value={formData.course_id}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, course_id: e.target.value }))
                    }
                    required
                  >
                    <option value="">اختر المساق</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.course_id && (
                    <small style={{ color: "#dc3545", fontSize: "0.8rem" }}>
                      {validationErrors.course_id}
                    </small>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">فترة التدريب</label>
                  <select
                    className="form-select-custom"
                    value={formData.training_period_id}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        training_period_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">اختياري</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || `فترة #${p.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label-custom">
                    تاريخ البداية <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-input-custom ${validationErrors.start_date ? "is-invalid" : ""}`}
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, start_date: e.target.value }))
                    }
                    required
                  />
                  {validationErrors.start_date && (
                    <small style={{ color: "#dc3545", fontSize: "0.8rem" }}>
                      {validationErrors.start_date}
                    </small>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label-custom">
                    تاريخ النهاية <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-input-custom ${validationErrors.end_date ? "is-invalid" : ""}`}
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, end_date: e.target.value }))
                    }
                    required
                  />
                  {validationErrors.end_date && (
                    <small style={{ color: "#dc3545", fontSize: "0.8rem" }}>
                      {validationErrors.end_date}
                    </small>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label-custom">ملاحظات</label>
                  <textarea
                    className="form-textarea-custom"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, notes: e.target.value }))
                    }
                    placeholder="اختياري"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label-custom">مرفقات (مسار الملف بعد الرفع على الخادم)</label>
                  <input
                    className="form-input-custom"
                    value={formData.attachment_path}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, attachment_path: e.target.value }))
                    }
                    placeholder="مثال: uploads/training-request-12.pdf"
                  />
                  <span className="form-hint">
                    يمكن ربط هذا لاحقًا برفع مباشر؛ حاليًا يُخزَّن مسار نصي كما في واجهات الإدارة.
                  </span>
                </div>
              </div>

              <div className="mt-3" style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  className="btn-primary-custom"
                  disabled={saving || !isFormValid}
                  style={{ opacity: !isFormValid ? 0.6 : 1 }}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" style={{ marginLeft: "8px" }}></span>
                      جاري الحفظ...
                    </>
                  ) : editingId ? (
                    <>
                      <span>💾</span> حفظ وإعادة الإرسال
                    </>
                  ) : (
                    <>
                      <span>📤</span> إرسال الطلب
                    </>
                  )}
                </button>
                {!isFormValid && !saving && (
                  <span style={{ color: "#dc3545", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    ⚠️ يرجى إكمال جميع الحقول المطلوبة
                  </span>
                )}
              </div>
            </form>
          </div>

          <div className="section-card">
            <div className="panel-header" style={{ marginBottom: "24px" }}>
              <div>
                <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.5rem" }}>📋</span>
                  سجل طلبات التدريب
                </h3>
                <p className="panel-subtitle">
                  متابعة حالة طلباتك والتعديل عليها عند الحاجة
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: "#666", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffc107" }}></span>
                  بانتظار
                </span>
                <span style={{ fontSize: "0.75rem", color: "#666", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc3545" }}></span>
                  يحتاج تعديل
                </span>
                <span style={{ fontSize: "0.75rem", color: "#666", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#28a745" }}></span>
                  مقبول
                </span>
              </div>
            </div>

            {myRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📭</div>
                <h4 style={{ color: "#666", marginBottom: "8px" }}>لا توجد طلبات بعد</h4>
                <p style={{ color: "#999", fontSize: "0.9rem" }}>
                  ابدأ بتقديم أول طلب تدريب ميداني باستخدام النموذج أعلاه
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {myRequests.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e9ecef",
                      borderRadius: "12px",
                      padding: "20px",
                      transition: "all 0.2s ease",
                      borderRight: `4px solid ${statusConfig[r.book_status]?.color || "#dee2e6"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#333" }}>
                          {r.training_site?.name || "جهة التدريب"}
                        </h4>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "0.85rem", color: "#666" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            🏛️ {governingLabels[r.governing_body] || r.governing_body || "—"}
                          </span>
                          {r.training_site?.directorate && (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              📍 {r.training_site.directorate}
                            </span>
                          )}
                          {r.training_site?.location && (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              🗺️ {r.training_site.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={r.book_status} showPulse={!r.book_status?.includes("approved") && !r.book_status?.includes("rejected")} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "8px" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "#999", display: "block", marginBottom: "4px" }}>نوع الجهة</span>
                        <span style={{ fontSize: "0.9rem", color: "#333" }}>
                          {siteTypeLabels[r.training_site?.site_type] || r.training_site?.site_type || "—"}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "#999", display: "block", marginBottom: "4px" }}>تاريخ التقديم</span>
                        <span style={{ fontSize: "0.9rem", color: "#333" }}>
                          {r.requested_at ? new Date(r.requested_at).toLocaleDateString("ar-SA") : "—"}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "#999", display: "block", marginBottom: "4px" }}>آخر تحديث</span>
                        <span style={{ fontSize: "0.9rem", color: "#333" }}>
                          {r.updated_at ? new Date(r.updated_at).toLocaleDateString("ar-SA") : "—"}
                        </span>
                      </div>
                    </div>

                    {(r.needs_edit_reason || r.coordinator_rejection_reason || r.rejection_reason) && (
                      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#856404", display: "block", marginBottom: "4px" }}>
                          📝 ملاحظات المراجعة:
                        </span>
                        <span style={{ fontSize: "0.9rem", color: "#856404" }}>
                          {r.needs_edit_reason || r.coordinator_rejection_reason || r.rejection_reason}
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      {r.book_status === "needs_edit" && (
                        <button
                          type="button"
                          className="btn-sm-custom btn-primary-custom"
                          onClick={() => startEdit(r)}
                          style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                          ✏️ تعديل الطلب
                        </button>
                      )}
                      {(r.book_status === "sent_to_coordinator" || r.book_status === "prelim_approved") && (
                        <span style={{ fontSize: "0.8rem", color: "#17a2b8", display: "flex", alignItems: "center", gap: "4px" }}>
                          ⏳ بانتظار مراجعة المنسق...
                        </span>
                      )}
                      {(r.book_status === "sent_to_directorate" || r.book_status === "directorate_approved") && (
                        <span style={{ fontSize: "0.8rem", color: "#fd7e14", display: "flex", alignItems: "center", gap: "4px" }}>
                          ⏳ بانتظار موافقة الجهة الرسمية...
                        </span>
                      )}
                      {r.book_status === "sent_to_school" && (
                        <span style={{ fontSize: "0.8rem", color: "#6f42c1", display: "flex", alignItems: "center", gap: "4px" }}>
                          ⏳ بانتظار موافقة جهة التدريب...
                        </span>
                      )}
                      {r.book_status === "school_approved" && (
                        <span style={{ fontSize: "0.8rem", color: "#28a745", display: "flex", alignItems: "center", gap: "4px" }}>
                          ✅ تم قبولك وتعيين المعلم المرشد
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
