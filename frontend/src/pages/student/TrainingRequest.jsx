import { useEffect, useMemo, useState } from "react";
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
    return ["needs_edit", "rejected", "coordinator_rejected"].includes(latestRequest.book_status);
  }, [latestRequest]);
  const canCancelLatestRequest = useMemo(() => {
    if (!latestRequest) return false;
    return [
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
        await updateStudentTrainingRequest(submitTargetRequestId, payload);
        setEditingId(null);
        setSuccess("تم حفظ التعديلات على الطلب بنجاح.");
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
      await loadMyRequests();
      setSuccess("تم إلغاء الطلب بنجاح.");
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر إلغاء الطلب");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="section-card">جاري تحميل البيانات...</div>;
  }

  return (
    <>
      <style>{`
        .tr-card {
          background: #fff;
          border: 1px solid #e9ecef;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }
        .tr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .tr-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tr-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: #374151;
        }
        .tr-help {
          margin: 0;
          padding: 10px 12px;
          border-radius: 10px;
          background: #f8fafc;
          color: #475569;
          font-size: 0.86rem;
          border: 1px solid #e2e8f0;
        }
      `}</style>

      <div className="content-header">
        <h1 className="page-title">طلب التدريب الميداني</h1>
        <p className="page-subtitle">الجهة الرسمية تظهر تلقائيًا حسب القسم، ثم اختر المديرية وجهة التدريب التابعة.</p>
      </div>

      {error ? <div className="alert-custom alert-danger">{error}</div> : null}
      {success ? <div className="alert-custom alert-success">{success}</div> : null}

      {hasSubmittedRequest ? (
        <div className="tr-card" style={{ marginBottom: "14px" }}>
          <h3 className="panel-title mb-3">متابعة حالة الطلب</h3>
          <>
            <div className="tr-grid">
              <div className="tr-field">
                <span className="tr-label">حالة الطلب</span>
                <strong>{latestRequest.book_status_label || latestRequest.book_status || "—"}</strong>
              </div>
              <div className="tr-field">
                <span className="tr-label">الجهة المعتمدة</span>
                <strong>{latestRequest.training_site?.name || "—"}</strong>
              </div>
              <div className="tr-field">
                <span className="tr-label">المديرية</span>
                <strong>{latestRequest.training_site?.directorate || "—"}</strong>
              </div>
              <div className="tr-field">
                <span className="tr-label">المشرف/المرشد</span>
                <strong>{latestRequest.students?.[0]?.assigned_teacher?.name || "غير محدد"}</strong>
              </div>
            </div>
            {(latestRequest.rejection_reason ||
              latestRequest.coordinator_rejection_reason ||
              latestRequest.needs_edit_reason) && (
              <div className="alert-custom alert-warning mt-3">
                <strong>ملاحظات على الطلب:</strong>{" "}
                {latestRequest.rejection_reason ||
                  latestRequest.coordinator_rejection_reason ||
                  latestRequest.needs_edit_reason}
              </div>
            )}
            <div className="mt-2 d-flex gap-2">
              {canEditLatestRequest ? (
                <button
                  type="button"
                  className="btn-primary-custom"
                  onClick={() => startEdit(latestRequest)}
                  disabled={saving}
                >
                  تعديل نفس الطلب
                </button>
              ) : null}
              {canCancelLatestRequest ? (
                <button
                  type="button"
                  className="btn-outline-custom"
                  onClick={handleCancelLatestRequest}
                  disabled={saving}
                  style={{ borderColor: "#dc3545", color: "#dc3545" }}
                >
                  إلغاء الطلب
                </button>
              ) : null}
            </div>
          </>
        </div>
      ) : null}

      <div className="tr-card">
        <h3 className="panel-title mb-3">
          {editingId ? "تعديل الطلب" : hasSubmittedRequest ? "تم إرسال الطلب" : "إرسال طلب جديد"}
        </h3>
        <p className="tr-help">
          {hasSubmittedRequest && !canEditLatestRequest
            ? "تم إرسال طلبك مسبقًا. يمكنك فقط متابعة الحالة حتى يتم رفض الطلب وإعادته للتعديل."
            : "المديرية أولاً ثم اختيار جهة التدريب التابعة لها."}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="tr-grid">
            <div className="tr-field">
              <label className="tr-label" htmlFor="training-request-governing-body">الجهة الرسمية</label>
              <input
                id="training-request-governing-body"
                name="training_request_governing_body"
                className="form-input-custom"
                value={governingBodyLabel}
                readOnly
              />
            </div>

            <div className="tr-field">
              <label className="tr-label" htmlFor="training-request-directorate">المديرية</label>
              <select
                id="training-request-directorate"
                name="training_request_directorate"
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
            </div>

            <div className="tr-field">
              <label className="tr-label" htmlFor="training-request-site-search">المدرسة / جهة التدريب</label>
              <div style={{ position: "relative" }}>
                <input
                  id="training-request-site-search"
                  name="training_request_site_search"
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

            <div className="tr-field" style={{ gridColumn: "1 / -1" }}>
              <label className="tr-label" htmlFor="training-request-notes">ملاحظات</label>
              <textarea
                id="training-request-notes"
                name="training_request_notes"
                rows={3}
                className="form-textarea-custom"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <button
              type="submit"
              className="btn-primary-custom"
              disabled={saving || Object.keys(validationErrors).length > 0 || (hasSubmittedRequest && !submitTargetRequestId)}
            >
              {saving ? "جاري الحفظ..." : submitTargetRequestId ? "حفظ التعديلات" : "إرسال الطلب"}
            </button>

            {editingId ? (
              <button
                type="button"
                className="btn-outline-custom"
                onClick={() => {
                  setEditingId(null);
                  setError("");
                  setSuccess("");
                }}
              >
                إلغاء
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </>
  );
}
