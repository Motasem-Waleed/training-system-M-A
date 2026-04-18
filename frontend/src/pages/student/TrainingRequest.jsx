import { useCallback, useEffect, useState } from "react";
import {
  createStudentTrainingRequest,
  getCourses,
  getStudentTrainingRequests,
  getTrainingPeriods,
  getTrainingSites,
  itemsFromPagedResponse,
  updateStudentTrainingRequest,
} from "../../services/api";

const governingLabels = {
  directorate_of_education: "مديرية التربية والتعليم",
  ministry_of_health: "وزارة الصحة",
};

const siteTypeLabels = {
  school: "مدرسة",
  health_center: "مصحة / مركز صحي / نفسي / مجتمعي",
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

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">طلب التدريب</h1>
        <p className="page-subtitle">
          اختر الجهة الرسمية المشرفة، ثم المديرية والمنطقة، ثم جهة التدريب، وأرفق المستندات
          إن وُجدت، ثم أرسل الطلب لمتابعة مراجعة المنسق الأكاديمي.
        </p>
      </div>

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : (
        <>
          {error ? (
            <div className="section-card">
              <p className="text-danger">{error}</p>
            </div>
          ) : null}
          {success ? (
            <div className="section-card">
              <p style={{ color: "var(--success)" }}>{success}</p>
            </div>
          ) : null}

          <div className="section-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  {editingId ? "تعديل طلب التدريب" : "نموذج طلب التدريب"}
                </h3>
                <p className="panel-subtitle">
                  {editingId
                    ? "بعد الحفظ يُعاد الطلب إلى المنسق للمراجعة."
                    : "اتبع الخطوات: الجهة الرسمية ← نوع جهة التدريب ← المديرية/المنطقة ← اختيار الموقع."}
                </p>
              </div>
              {editingId ? (
                <button type="button" className="btn-outline-custom" onClick={cancelEdit}>
                  إلغاء التعديل
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
                  <label className="form-label-custom">جهة التدريب</label>
                  <select
                    className="form-select-custom"
                    value={formData.training_site_id}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, training_site_id: e.target.value }))
                    }
                    disabled={sites.length === 0}
                  >
                    <option value="">اختر جهة التدريب</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.location ? ` — ${s.location}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">المساق التدريبي</label>
                  <select
                    className="form-select-custom"
                    value={formData.course_id}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, course_id: e.target.value }))
                    }
                  >
                    <option value="">اختر المساق</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
                  <label className="form-label-custom">تاريخ البداية</label>
                  <input
                    type="date"
                    className="form-input-custom"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, start_date: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label-custom">تاريخ النهاية</label>
                  <input
                    type="date"
                    className="form-input-custom"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, end_date: e.target.value }))
                    }
                  />
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

              <div className="mt-3">
                <button type="submit" className="btn-primary-custom" disabled={saving}>
                  {saving
                    ? "جاري الحفظ..."
                    : editingId
                      ? "حفظ وإعادة الإرسال"
                      : "إرسال الطلب"}
                </button>
              </div>
            </form>
          </div>

          <div className="section-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">طلباتي</h3>
                <p className="panel-subtitle">
                  حالة الطلب، الجهة الرسمية، وسبب التعديل أو الرفض إن وُجد.
                </p>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>جهة التدريب</th>
                    <th>نوع الموقع</th>
                    <th>الجهة الرسمية</th>
                    <th>المديرية</th>
                    <th>الحالة</th>
                    <th>آخر تحديث</th>
                    <th>ملاحظات</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        لا يوجد طلبات حتى الآن
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((r) => (
                      <tr key={r.id}>
                        <td>{r.training_site?.name || "—"}</td>
                        <td>
                          {siteTypeLabels[r.training_site?.site_type] ||
                            r.training_site?.site_type ||
                            "—"}
                        </td>
                        <td>
                          {governingLabels[r.governing_body] || r.governing_body || "—"}
                        </td>
                        <td>{r.training_site?.directorate || "—"}</td>
                        <td>{r.book_status_label || r.book_status || "—"}</td>
                        <td>{r.updated_at || "—"}</td>
                        <td>
                          {r.needs_edit_reason ||
                            r.coordinator_rejection_reason ||
                            r.rejection_reason ||
                            "—"}
                        </td>
                        <td>
                          {r.book_status === "needs_edit" ? (
                            <button
                              type="button"
                              className="btn-sm-custom btn-outline-custom"
                              onClick={() => startEdit(r)}
                            >
                              تعديل
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
