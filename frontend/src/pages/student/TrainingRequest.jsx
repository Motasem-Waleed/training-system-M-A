import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Building2,
  MapPin,
  School,
  FileText,
  Send,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  createStudentTrainingRequest,
  deleteStudentTrainingRequest,
  getCourses,
  getStudentTrainingRequests,
  getTrainingPeriods,
  getTrainingSites,
  itemsFromPagedResponse,
  updateStudentTrainingRequest,
} from "../../services/api";
import { getStudentTrack } from "../../utils/studentSection";

const educationDirectorates = ["وسط", "شمال", "جنوب", "يطا"];

export default function TrainingRequest() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const studentTrack = getStudentTrack(currentUser);
  const isEducationFlow = studentTrack === "education";
  const isPsychologyFlow = studentTrack === "psychology";
  const governingBodyLabel = isEducationFlow ? "مديرية التربية والتعليم" : "وزارة الصحة";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [courses, setCourses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [directorates, setDirectorates] = useState([]);
  const [schools, setSchools] = useState([]);
  const [siteSearch, setSiteSearch] = useState("");
  const [isSiteMenuOpen, setIsSiteMenuOpen] = useState(false);
  const [highlightedSiteIndex, setHighlightedSiteIndex] = useState(-1);

  const [filters, setFilters] = useState({
    governing_body: isEducationFlow ? "directorate_of_education" : "ministry_of_health",
    site_type: isEducationFlow ? "school" : "health_center",
    directorate: "",
  });

  const [formData, setFormData] = useState({
    training_site_id: "",
    notes: "",
  });

  const loadMyRequests = async () => {
    const myReqRes = await getStudentTrainingRequests();
    setMyRequests(itemsFromPagedResponse(myReqRes));
  };

  useEffect(() => {
    const loadBootstrap = async () => {
      setLoading(true);
      setError("");
      try {
        const [coursesRes, periodsRes] = await Promise.all([
          getCourses({ per_page: 200 }),
          getTrainingPeriods({ per_page: 200 }),
        ]);
        setCourses(itemsFromPagedResponse(coursesRes));
        setPeriods(itemsFromPagedResponse(periodsRes));
        await loadMyRequests();
      } catch (e) {
        setError(e?.response?.data?.message || "فشل تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };
    loadBootstrap();
  }, []);

  useEffect(() => {
    if (!isEducationFlow && !isPsychologyFlow) return;
    setFilters((prev) => ({
      ...prev,
      governing_body: isEducationFlow ? "directorate_of_education" : "ministry_of_health",
      site_type: isEducationFlow ? "school" : "health_center",
    }));
  }, [isEducationFlow, isPsychologyFlow]);

  useEffect(() => {
    const loadDirectorates = async () => {
      if (isEducationFlow || isPsychologyFlow) {
        setDirectorates(educationDirectorates);
        return;
      }
      if (filters.governing_body !== "directorate_of_education" || filters.site_type !== "school") {
        setDirectorates([]);
        return;
      }
      try {
        const res = await getTrainingSites({
          governing_body: "directorate_of_education",
          site_type: "school",
          is_active: true,
          has_manager_account: true,
          per_page: 400,
        });
        const unique = Array.from(
          new Set(
            itemsFromPagedResponse(res)
              .map((s) => String(s?.directorate || "").trim())
              .filter(Boolean)
          )
        );
        setDirectorates(unique);
      } catch {
        setDirectorates([]);
      }
    };
    loadDirectorates();
  }, [filters.governing_body, filters.site_type, isEducationFlow, isPsychologyFlow]);

  useEffect(() => {
    const loadSchools = async () => {
      setFormData((prev) => ({ ...prev, training_site_id: "" }));
      if (!filters.governing_body || !filters.site_type) {
        setSchools([]);
        return;
      }
      if (!filters.directorate) {
        setSchools([]);
        return;
      }
      try {
        const res = await getTrainingSites({
          governing_body: filters.governing_body,
          site_type: filters.site_type,
          directorate: filters.directorate,
          is_active: true,
          has_manager_account: true,
          per_page: 200,
        });
        setSchools(itemsFromPagedResponse(res));
      } catch (e) {
        setError(e?.response?.data?.message || "فشل تحميل المدارس");
      }
    };
    loadSchools();
  }, [filters.governing_body, filters.site_type, filters.directorate]);

  const validationErrors = useMemo(() => {
    const errs = {};
    if (!filters.directorate) {
      errs.directorate = "اختر المديرية أولاً";
    }
    if (!formData.training_site_id) errs.training_site_id = "اختر المدرسة/جهة التدريب";
    return errs;
  }, [formData, filters.directorate, filters.governing_body]);

  const normalizeArabicSearch = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .trim();

  const filteredSchools = useMemo(() => {
    const q = normalizeArabicSearch(siteSearch);
    if (!q) return schools;
    const starts = [];
    const includes = [];
    schools.forEach((s) => {
      const normalizedName = normalizeArabicSearch(s?.name);
      if (normalizedName.startsWith(q)) {
        starts.push(s);
      } else if (normalizedName.includes(q)) {
        includes.push(s);
      }
    });
    return [...starts, ...includes];
  }, [schools, siteSearch]);
  const latestRequest = useMemo(() => myRequests[0] || null, [myRequests]);
  const hasSubmittedRequest = useMemo(() => Boolean(latestRequest?.id), [latestRequest]);
  const canEditLatestRequest = useMemo(() => {
    if (!latestRequest) return false;
    // زر التعديل يظهر فقط عند الرفض (من المنسق أو مدير المدرسة)
    return ["rejected", "coordinator_rejected"].includes(latestRequest.book_status);
  }, [latestRequest]);
  const canCancelLatestRequest = useMemo(() => {
    if (!latestRequest) return false;
    // السماح بالإلغاء في أي مرحلة ما قبل القبول النهائي
    return [
      "draft",
      "sent_to_directorate",
      "sent_to_school",
      "school_approved",
      "directorate_approved",
      "sent_to_coordinator",
      "needs_edit",
      "rejected",
      "coordinator_rejected",
      "prelim_approved",
    ].includes(latestRequest.book_status);
  }, [latestRequest]);
  const submitTargetRequestId = useMemo(() => {
    if (editingId) return editingId;
    if (hasSubmittedRequest && canEditLatestRequest) return latestRequest?.id || null;
    return null;
  }, [editingId, hasSubmittedRequest, canEditLatestRequest, latestRequest]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (hasSubmittedRequest && !submitTargetRequestId) {
      setError("الطلب الحالي لا يمكن تعديله في هذه المرحلة.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const activePeriod =
        periods.find((period) => Boolean(period?.is_active)) || periods[0] || null;
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const fallbackStart = today.toISOString().slice(0, 10);
      const fallbackEnd = tomorrow.toISOString().slice(0, 10);

      const payload = {
        training_site_id: Number(formData.training_site_id),
        training_period_id: activePeriod?.id ? Number(activePeriod.id) : null,
        course_id: courses[0]?.id ? Number(courses[0].id) : null,
        directorate: filters.directorate || null,
        start_date: activePeriod?.start_date || fallbackStart,
        end_date: activePeriod?.end_date || fallbackEnd,
        notes: formData.notes || null,
      };

      if (submitTargetRequestId) {
        try {
          await updateStudentTrainingRequest(submitTargetRequestId, payload);
          setEditingId(null);
          setSuccess("تم حفظ التعديلات على الطلب بنجاح.");
        } catch (updateErr) {
          // إذا الطلب محذوف (404)، نعيد المحاولة كطلب جديد
          if (updateErr?.response?.status === 404) {
            setEditingId(null);
            await createStudentTrainingRequest(payload);
            setSuccess("تم إرسال الطلب بنجاح (طلب جديد).");
          } else {
            throw updateErr;
          }
        }
      } else {
        await createStudentTrainingRequest(payload);
        setSuccess("تم إرسال الطلب بنجاح.");
      }

      setFormData({
        training_site_id: "",
        notes: "",
      });
      setSiteSearch("");
      await loadMyRequests();
    } catch (e) {
      if (e?.response?.status === 409) {
        await loadMyRequests();
      }
      setError(e?.response?.data?.message || "فشل حفظ الطلب");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (requestItem) => {
    const site = requestItem.training_site || requestItem.trainingSite;
    const studentRow = requestItem.students?.[0] || null;

    setEditingId(requestItem.id);
    setFilters((prev) => ({
      ...prev,
      governing_body: site?.governing_body || requestItem.governing_body || prev.governing_body,
      site_type: site?.site_type || prev.site_type,
      directorate: site?.directorate || "",
    }));
    setFormData({
      training_site_id: site?.id ? String(site.id) : "",
      notes: studentRow?.notes || "",
    });
    setSiteSearch(site?.name || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelLatestRequest = async () => {
    if (!latestRequest?.id) return;
    const ok = window.confirm("هل تريد إلغاء الطلب الحالي؟");
    if (!ok) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await deleteStudentTrainingRequest(latestRequest.id);
      setEditingId(null);
      setFormData({ training_site_id: "", notes: "" });
      setSiteSearch("");
      setFilters((prev) => ({
        ...prev,
        directorate: "",
      }));
      setSchools([]);
      await loadMyRequests();
      setSuccess("تم إلغاء الطلب بنجاح. يمكنك الآن إرسال طلب جديد.");
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر إلغاء الطلب");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { class: "badge-info", icon: ClipboardList, text: "مسودة" },
      sent_to_directorate: { class: "badge-info", icon: Send, text: "أُرسل للمديرية" },
      sent_to_school: { class: "badge-info", icon: Send, text: "أُرسل للمدرسة" },
      school_approved: { class: "badge-success", icon: CheckCircle2, text: "موافقة المدرسة" },
      directorate_approved: { class: "badge-success", icon: CheckCircle2, text: "موافقة المديرية" },
      sent_to_coordinator: { class: "badge-primary", icon: Send, text: "عند المنسق" },
      prelim_approved: { class: "badge-success", icon: CheckCircle2, text: "موافقة أولية" },
      approved: { class: "badge-success", icon: CheckCircle2, text: "مقبول" },
      rejected: { class: "badge-danger", icon: XCircle, text: "مرفوض" },
      coordinator_rejected: { class: "badge-danger", icon: XCircle, text: "مرفوض من المنسق" },
      needs_edit: { class: "badge-warning", icon: AlertCircle, text: "يحتاج تعديل" },
    };
    
    const config = statusConfig[status] || { class: "badge-soft", icon: Loader2, text: status || "قيد المعالجة" };
    const Icon = config.icon;
    
    return (
      <span className={`badge-custom ${config.class} d-inline-flex align-items-center gap-1`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="section-card">
        <div className="text-center py-4">
          <Loader2 size={32} className="animate-spin text-primary mb-2" />
          <p className="text-muted mb-0">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="page-title d-flex align-items-center gap-2">
          <ClipboardList size={28} />
          طلب التدريب الميداني
        </h1>
        <p className="page-subtitle">
          <Building2 size={14} className="me-1" />
          اختر المديرية ثم جهة التدريب التابعة لها لإرسال طلبك
        </p>
      </div>

      {error && (
        <div className="alert-custom alert-danger d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="alert-custom alert-success d-flex align-items-center gap-2">
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}

      {hasSubmittedRequest ? (
        <div className="section-card mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 d-flex align-items-center gap-2">
              <Building2 size={20} className="text-primary" />
              حالة الطلب الحالي
            </h5>
            {getStatusBadge(latestRequest.book_status)}
          </div>

          <div className="summary-grid">
            <div className="stat-card primary">
              <div>
                <div className="stat-title">حالة الطلب</div>
                <div className="stat-value fs-6">
                  {getStatusBadge(latestRequest.book_status)}
                </div>
              </div>
            </div>

            <div className="stat-card success">
              <div>
                <div className="stat-title">الجهة المعتمدة</div>
                <div className="stat-value fs-6">
                  {latestRequest.training_site?.name || "—"}
                </div>
              </div>
            </div>

            <div className="stat-card accent">
              <div>
                <div className="stat-title">المديرية</div>
                <div className="stat-value fs-6">
                  <MapPin size={14} className="me-1" />
                  {latestRequest.training_site?.directorate || "—"}
                </div>
              </div>
            </div>

            <div className="stat-card warning">
              <div>
                <div className="stat-title">المشرف/المرشد</div>
                <div className="stat-value fs-6">
                  <School size={14} className="me-1" />
                  {latestRequest.students?.[0]?.assigned_teacher?.name || "غير محدد"}
                </div>
              </div>
            </div>
          </div>

          {(latestRequest.rejection_reason ||
            latestRequest.coordinator_rejection_reason ||
            latestRequest.needs_edit_reason) && (
            <div className="alert-custom alert-warning mt-3 d-flex align-items-start gap-2">
              <AlertCircle size={20} className="mt-1 flex-shrink-0" />
              <div>
                <strong>ملاحظات على الطلب:</strong>
                <p className="mb-0 mt-1">
                  {latestRequest.rejection_reason ||
                    latestRequest.coordinator_rejection_reason ||
                    latestRequest.needs_edit_reason}
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 d-flex gap-2">
            {canEditLatestRequest ? (
              <button
                type="button"
                className="btn-primary-custom d-inline-flex align-items-center gap-2"
                onClick={() => startEdit(latestRequest)}
                disabled={saving}
              >
                <Edit3 size={16} />
                تعديل نفس الطلب
              </button>
            ) : null}
            {canCancelLatestRequest ? (
              <button
                type="button"
                className="btn-outline-custom d-inline-flex align-items-center gap-2"
                onClick={handleCancelLatestRequest}
                disabled={saving}
                style={{ borderColor: "#dc3545", color: "#dc3545" }}
              >
                <Trash2 size={16} />
                إلغاء الطلب
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {(!hasSubmittedRequest || editingId || canEditLatestRequest) && (
      <div className="section-card">
        <h5 className="mb-3 d-flex align-items-center gap-2">
          <Send size={20} className="text-primary" />
          {editingId ? "تعديل الطلب" : hasSubmittedRequest ? "إعادة إرسال الطلب" : "إرسال طلب جديد"}
        </h5>
        <div className="alert-custom alert-info mb-3 d-flex align-items-center gap-2">
          <AlertCircle size={18} />
          {hasSubmittedRequest && !canEditLatestRequest
            ? "تم إرسال طلبك مسبقًا. يمكنك فقط متابعة الحالة حتى يتم رفض الطلب."
            : "اختر المديرية أولاً، ثم ابحث واختر جهة التدريب."}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="form-field">
                <label className="form-label-custom d-flex align-items-center gap-1">
                  <Building2 size={14} />
                  الجهة الرسمية
                </label>
                <input
                  id="training-request-governing-body"
                  className="form-input-custom bg-light"
                  value={governingBodyLabel}
                  readOnly
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-field">
                <label className="form-label-custom d-flex align-items-center gap-1">
                  <MapPin size={14} />
                  المديرية
                </label>
                <select
                  id="training-request-directorate"
                  className={`form-select-custom ${validationErrors.directorate ? "is-invalid" : ""}`}
                  value={filters.directorate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, directorate: e.target.value }))}
                  disabled={!filters.governing_body}
                >
                  <option value="">اختر المديرية</option>
                  {directorates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {validationErrors.directorate && (
                  <div className="invalid-feedback">{validationErrors.directorate}</div>
                )}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-field">
                <label className="form-label-custom d-flex align-items-center gap-1">
                  <School size={14} />
                  {isEducationFlow ? "المدرسة" : "جهة التدريب"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="training-request-site-search"
                  className={`form-input-custom ${validationErrors.training_site_id ? "is-invalid" : ""}`}
                  placeholder={!filters.directorate ? "اختر المديرية أولاً" : "اكتب للبحث ثم اختر الجهة"}
                  value={siteSearch}
                  onChange={(e) => {
                    setSiteSearch(e.target.value);
                    setIsSiteMenuOpen(true);
                    setHighlightedSiteIndex(-1);
                    setFormData((prev) => ({ ...prev, training_site_id: "" }));
                  }}
                  onFocus={() => {
                    if (filters.directorate) setIsSiteMenuOpen(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setIsSiteMenuOpen(false), 120);
                  }}
                  onKeyDown={(e) => {
                    if (!isSiteMenuOpen || filteredSchools.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightedSiteIndex((prev) =>
                        prev < filteredSchools.length - 1 ? prev + 1 : 0
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightedSiteIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredSchools.length - 1
                      );
                    } else if (e.key === "Enter" && highlightedSiteIndex >= 0) {
                      e.preventDefault();
                      const picked = filteredSchools[highlightedSiteIndex];
                      if (picked) {
                        setFormData((prev) => ({ ...prev, training_site_id: String(picked.id) }));
                        setSiteSearch(picked.name || "");
                        setIsSiteMenuOpen(false);
                      }
                    } else if (e.key === "Escape") {
                      setIsSiteMenuOpen(false);
                    }
                  }}
                  disabled={!filters.directorate}
                />

                {isSiteMenuOpen && filters.directorate ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      left: 0,
                      maxHeight: "240px",
                      overflowY: "auto",
                      background: "#fff",
                      border: "1px solid #dee2e6",
                      borderRadius: "8px",
                      zIndex: 25,
                      boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
                    }}
                  >
                    {filteredSchools.length === 0 ? (
                      <div style={{ padding: "10px 12px", color: "#6c757d", fontSize: "0.9rem" }}>
                        لا توجد نتائج مطابقة
                      </div>
                    ) : (
                      filteredSchools.map((s, idx) => {
                        const isSelected = String(s.id) === String(formData.training_site_id);
                        const isHighlighted = idx === highlightedSiteIndex;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, training_site_id: String(s.id) }));
                              setSiteSearch(s.name || "");
                              setIsSiteMenuOpen(false);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "right",
                              border: "none",
                              background: isHighlighted ? "#f1f7ff" : isSelected ? "#f8f9fa" : "#fff",
                              padding: "10px 12px",
                              fontSize: "0.92rem",
                              color: "#212529",
                              cursor: "pointer",
                            }}
                          >
                            {s.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            </div>

            <div className="col-12">
              <div className="form-field">
                <label className="form-label-custom d-flex align-items-center gap-1">
                  <FileText size={14} />
                  ملاحظات (اختياري)
                </label>
                <textarea
                  id="training-request-notes"
                  rows={3}
                  className="form-textarea-custom"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي ملاحظات إضافية تريد إرفاقها بالطلب..."
                />
              </div>
            </div>
          </div>

          <div className="mt-4 d-flex gap-2">
            <button
              type="submit"
              className="btn-primary-custom d-inline-flex align-items-center gap-2"
              disabled={saving || Object.keys(validationErrors).length > 0 || (hasSubmittedRequest && !submitTargetRequestId)}
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin me-1" />
              ) : submitTargetRequestId ? (
                <Edit3 size={16} className="me-1" />
              ) : (
                <Send size={16} className="me-1" />
              )}
              {saving ? "جاري الحفظ..." : submitTargetRequestId ? "حفظ التعديلات" : "إرسال الطلب"}
            </button>

            {editingId ? (
              <button
                type="button"
                className="btn-outline-custom d-inline-flex align-items-center gap-2"
                onClick={() => {
                  setEditingId(null);
                  setError("");
                  setSuccess("");
                }}
              >
                <XCircle size={16} />
                إلغاء
              </button>
            ) : null}
          </div>
        </form>
      </div>
      )}
    </>
  );
}
