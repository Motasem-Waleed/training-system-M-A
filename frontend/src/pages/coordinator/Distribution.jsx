import { useEffect, useMemo, useState } from "react";
import {
  coordinatorReviewTrainingRequest,
  createTrainingRequest,
  createTrainingRequestBatch,
  getCourses,
  getTrainingRequestBatches,
  getTrainingPeriods,
  getTrainingRequests,
  getTrainingSites,
  getUsers,
  itemsFromPagedResponse,
  sendTrainingRequestBatch,
  sendToDirectorate,
} from "../../services/api";

const statusLabels = {
  draft: "مسودة",
  sent_to_coordinator: "مرسل للمنسق",
  coordinator_under_review: "قيد مراجعة المنسق",
  needs_edit: "بحاجة تعديل",
  coordinator_rejected: "مرفوض من المنسق",
  prelim_approved: "معتمد مبدئيًا",
  batched_pending_send: "مجمّع بانتظار الإرسال",
  sent_to_directorate: "مرسل للمديرية",
  directorate_approved: "موافقة المديرية",
  sent_to_school: "مرسل للمدرسة",
  rejected: "مرفوض",
  school_approved: "موافقة المدرسة",
  sent_to_health_ministry: "مرسل لوزارة الصحة",
};

export default function CoordinatorDistribution() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [requests, setRequests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sites, setSites] = useState([]);
  const [periods, setPeriods] = useState([]);

  const [sendFormById, setSendFormById] = useState({});
  const [selectedForBatch, setSelectedForBatch] = useState({});
  const [batchForm, setBatchForm] = useState({
    governing_body: "directorate_of_education",
    directorate: "",
  });
  const [batchSendForm, setBatchSendForm] = useState({});

  const [form, setForm] = useState({
    training_site_id: "",
    training_period_id: "",
    students: [
      { user_id: "", course_id: "", start_date: "", end_date: "", notes: "" },
    ],
  });
  const [validationErrors, setValidationErrors] = useState({});

  const visibleRequests = useMemo(() => {
    // المنسق يهتم غالبًا بالمسودات والمرفوضة والمتابعة العامة
    return requests;
  }, [requests]);

  const incomingRequests = useMemo(() => {
    return requests.filter((r) =>
      ["sent_to_coordinator", "coordinator_under_review", "needs_edit"].includes(
        r.book_status
      )
    );
  }, [requests]);

  const prelimApproved = useMemo(() => {
    return requests.filter((r) => r.book_status === "prelim_approved");
  }, [requests]);

  const batchedPending = useMemo(() => {
    return requests.filter((r) => r.book_status === "batched_pending_send");
  }, [requests]);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [reqRes, usersRes, coursesRes, sitesRes, periodsRes, batchesRes] =
        await Promise.all([
          getTrainingRequests({ per_page: 200 }),
          getUsers({ per_page: 200, status: "active" }),
          getCourses({ per_page: 200 }),
          getTrainingSites({ per_page: 200 }),
          getTrainingPeriods({ per_page: 200 }),
          getTrainingRequestBatches({ per_page: 50 }),
        ]);

      setRequests(itemsFromPagedResponse(reqRes));
      setStudents(itemsFromPagedResponse(usersRes));
      setCourses(itemsFromPagedResponse(coursesRes));
      setSites(itemsFromPagedResponse(sitesRes));
      setBatches(itemsFromPagedResponse(batchesRes));

      const periodsPayload = periodsRes?.data ?? periodsRes;
      setPeriods(itemsFromPagedResponse(periodsPayload));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل بيانات التوزيع");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateStudentRow(idx, key, value) {
    setForm((prev) => {
      const next = { ...prev, students: [...prev.students] };
      next.students[idx] = { ...next.students[idx], [key]: value };
      return next;
    });
  }

  function addRow() {
    setForm((prev) => ({
      ...prev,
      students: [
        ...prev.students,
        { user_id: "", course_id: "", start_date: "", end_date: "", notes: "" },
      ],
    }));
  }

  function removeRow(idx) {
    setForm((prev) => {
      const next = prev.students.filter((_, i) => i !== idx);
      return { ...prev, students: next.length ? next : prev.students };
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setValidationErrors({});
    try {
      await createTrainingRequest({
        training_site_id: Number(form.training_site_id),
        training_period_id: Number(form.training_period_id),
        students: form.students.map((s) => ({
          user_id: Number(s.user_id),
          course_id: Number(s.course_id),
          start_date: s.start_date,
          end_date: s.end_date,
          notes: s.notes || null,
        })),
      });
      setForm({
        training_site_id: "",
        training_period_id: "",
        students: [
          { user_id: "", course_id: "", start_date: "", end_date: "", notes: "" },
        ],
      });
      await fetchAll();
    } catch (e2) {
      const ve = e2?.response?.data?.errors;
      if (ve) setValidationErrors(ve);
      setError(e2?.response?.data?.message || "فشل إنشاء الكتاب");
    } finally {
      setSaving(false);
    }
  }

  async function handleCoordinatorDecision(id, decision) {
    setSaving(true);
    setError("");
    try {
      const reason =
        decision === "prelim_approved"
          ? null
          : prompt("اكتب السبب (اختياري)") || null;
      await coordinatorReviewTrainingRequest(id, { decision, reason });
      await fetchAll();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تنفيذ الإجراء");
    } finally {
      setSaving(false);
    }
  }

  function toggleSelect(reqId, checked) {
    setSelectedForBatch((prev) => ({ ...prev, [reqId]: checked }));
  }

  async function handleCreateBatch() {
    const ids = Object.entries(selectedForBatch)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    if (ids.length === 0) {
      setError("اختر طلبًا واحدًا على الأقل لإنشاء دفعة.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createTrainingRequestBatch({
        governing_body: batchForm.governing_body,
        directorate:
          batchForm.governing_body === "directorate_of_education"
            ? batchForm.directorate || null
            : null,
        training_request_ids: ids,
      });
      setSelectedForBatch({});
      await fetchAll();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل إنشاء الدفعة");
    } finally {
      setSaving(false);
    }
  }

  function setBatchSendField(batchId, key, value) {
    setBatchSendForm((prev) => ({
      ...prev,
      [batchId]: { ...(prev[batchId] || {}), [key]: value },
    }));
  }

  async function handleSendBatch(batchId) {
    const data = batchSendForm[batchId] || {};
    setSaving(true);
    setError("");
    try {
      await sendTrainingRequestBatch(batchId, {
        letter_number: data.letter_number,
        letter_date: data.letter_date,
        content: data.content,
      });
      await fetchAll();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل إرسال الدفعة");
    } finally {
      setSaving(false);
    }
  }

  function setSendField(id, key, value) {
    setSendFormById((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: value },
    }));
  }

  async function handleSendToDirectorate(id) {
    const data = sendFormById[id] || {};
    setSaving(true);
    setError("");
    try {
      await sendToDirectorate(id, {
        letter_number: data.letter_number,
        letter_date: data.letter_date,
        content: data.content,
      });
      await fetchAll();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل إرسال الكتاب للمديرية");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="enrollments-list">
      <div className="page-header">
        <div>
          <h1>التوزيع</h1>
          <p>
            مراجعة طلبات الطلبة، اعتمادها مبدئيًا، ثم تجميعها في دفعات وإرسالها للجهات الرسمية.
          </p>
        </div>
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

          <div className="section-card">
            <h4>طلبات واردة من الطلبة</h4>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الطالب</th>
                    <th>الرقم الجامعي</th>
                    <th>المساق</th>
                    <th>جهة التدريب</th>
                    <th>المديرية/المنطقة</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center" }}>
                        لا يوجد طلبات واردة
                      </td>
                    </tr>
                  ) : (
                    incomingRequests.map((r) => {
                      const s0 = r.students?.[0];
                      return (
                        <tr key={r.id}>
                          <td>{s0?.user?.name || r.requested_by?.name || "-"}</td>
                          <td>{s0?.user?.university_id || "-"}</td>
                          <td>{s0?.course?.name || "-"}</td>
                          <td>{r.training_site?.name || "-"}</td>
                          <td>{r.training_site?.directorate || "-"}</td>
                          <td>{statusLabels[r.book_status] || r.book_status}</td>
                          <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              className="btn-sm btn-secondary"
                              disabled={saving}
                              onClick={() => handleCoordinatorDecision(r.id, "needs_edit")}
                            >
                              بحاجة تعديل
                            </button>
                            <button
                              className="btn-sm btn-secondary"
                              disabled={saving}
                              onClick={() => handleCoordinatorDecision(r.id, "rejected")}
                            >
                              رفض
                            </button>
                            <button
                              className="btn-sm btn-primary"
                              disabled={saving}
                              onClick={() =>
                                handleCoordinatorDecision(r.id, "prelim_approved")
                              }
                            >
                              اعتماد مبدئي
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section-card">
            <h4>تجميع دفعات الإرسال</h4>
            <div className="form-row">
              <div className="form-group">
                <label>الجهة الرسمية</label>
                <select
                  value={batchForm.governing_body}
                  onChange={(e) =>
                    setBatchForm((p) => ({
                      ...p,
                      governing_body: e.target.value,
                      directorate: "",
                    }))
                  }
                >
                  <option value="directorate_of_education">مديرية التربية والتعليم</option>
                  <option value="ministry_of_health">وزارة الصحة</option>
                </select>
              </div>

              <div className="form-group">
                <label>المديرية/المنطقة</label>
                <select
                  value={batchForm.directorate}
                  onChange={(e) =>
                    setBatchForm((p) => ({ ...p, directorate: e.target.value }))
                  }
                  disabled={batchForm.governing_body !== "directorate_of_education"}
                >
                  <option value="">الكل/غير محدد</option>
                  <option value="وسط">وسط</option>
                  <option value="شمال">شمال</option>
                  <option value="جنوب">جنوب</option>
                  <option value="يطا">يطا</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper" style={{ marginTop: 12 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>الطالب</th>
                    <th>جهة التدريب</th>
                    <th>المديرية/المنطقة</th>
                    <th>نوع الجهة الرسمية</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {prelimApproved.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        لا يوجد طلبات معتمدة مبدئيًا
                      </td>
                    </tr>
                  ) : (
                    prelimApproved.map((r) => {
                      const s0 = r.students?.[0];
                      return (
                        <tr key={r.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!selectedForBatch[r.id]}
                              onChange={(e) => toggleSelect(r.id, e.target.checked)}
                            />
                          </td>
                          <td>{s0?.user?.name || r.requested_by?.name || "-"}</td>
                          <td>{r.training_site?.name || "-"}</td>
                          <td>{r.training_site?.directorate || "-"}</td>
                          <td>{r.governing_body || "-"}</td>
                          <td>{statusLabels[r.book_status] || r.book_status}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleCreateBatch}
                disabled={saving}
              >
                إنشاء دفعة من المحدد
              </button>
            </div>
          </div>

          <div className="section-card">
            <h4>دفعات الإرسال</h4>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم الدفعة</th>
                    <th>الجهة الرسمية</th>
                    <th>المديرية/المنطقة</th>
                    <th>عدد الطلبات</th>
                    <th>الحالة</th>
                    <th>إرسال</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        لا يوجد دفعات
                      </td>
                    </tr>
                  ) : (
                    batches.map((b) => (
                      <tr key={b.id}>
                        <td>#{b.id}</td>
                        <td>{b.governing_body}</td>
                        <td>{b.directorate || "-"}</td>
                        <td>{b.items_count ?? "-"}</td>
                        <td>{b.status}</td>
                        <td style={{ minWidth: 320 }}>
                          {b.status === "draft" ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <input
                                  placeholder="رقم الكتاب"
                                  value={batchSendForm[b.id]?.letter_number || ""}
                                  onChange={(e) =>
                                    setBatchSendField(b.id, "letter_number", e.target.value)
                                  }
                                />
                                <input
                                  type="date"
                                  value={batchSendForm[b.id]?.letter_date || ""}
                                  onChange={(e) =>
                                    setBatchSendField(b.id, "letter_date", e.target.value)
                                  }
                                />
                              </div>
                              <textarea
                                placeholder="محتوى الكتاب"
                                value={batchSendForm[b.id]?.content || ""}
                                onChange={(e) =>
                                  setBatchSendField(b.id, "content", e.target.value)
                                }
                                rows={2}
                              />
                              <button
                                className="btn-sm btn-primary"
                                onClick={() => handleSendBatch(b.id)}
                                disabled={saving}
                              >
                                إرسال الدفعة
                              </button>
                            </div>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section-card">
            <h4>كتب (منسق → مديرية) - النظام القديم</h4>
            <form className="form" onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label>جهة التدريب</label>
                  <select
                    value={form.training_site_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, training_site_id: e.target.value }))
                    }
                  >
                    <option value="">اختر</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.training_site_id ? (
                    <div className="error">{validationErrors.training_site_id[0]}</div>
                  ) : null}
                </div>

                <div className="form-group">
                  <label>فترة التدريب</label>
                  <select
                    value={form.training_period_id}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        training_period_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">اختر</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || `فترة #${p.id}`}
                      </option>
                    ))}
                  </select>
                  {validationErrors.training_period_id ? (
                    <div className="error">
                      {validationErrors.training_period_id[0]}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="table-wrapper" style={{ marginTop: 12 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الطالب</th>
                      <th>المساق</th>
                      <th>من</th>
                      <th>إلى</th>
                      <th>ملاحظات</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.students.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <select
                            value={row.user_id}
                            onChange={(e) =>
                              updateStudentRow(idx, "user_id", e.target.value)
                            }
                          >
                            <option value="">اختر</option>
                            {students.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          {validationErrors[`students.${idx}.user_id`] ? (
                            <div className="error">
                              {validationErrors[`students.${idx}.user_id`][0]}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <select
                            value={row.course_id}
                            onChange={(e) =>
                              updateStudentRow(idx, "course_id", e.target.value)
                            }
                          >
                            <option value="">اختر</option>
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          {validationErrors[`students.${idx}.course_id`] ? (
                            <div className="error">
                              {validationErrors[`students.${idx}.course_id`][0]}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <input
                            type="date"
                            value={row.start_date}
                            onChange={(e) =>
                              updateStudentRow(idx, "start_date", e.target.value)
                            }
                          />
                          {validationErrors[`students.${idx}.start_date`] ? (
                            <div className="error">
                              {validationErrors[`students.${idx}.start_date`][0]}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <input
                            type="date"
                            value={row.end_date}
                            onChange={(e) =>
                              updateStudentRow(idx, "end_date", e.target.value)
                            }
                          />
                          {validationErrors[`students.${idx}.end_date`] ? (
                            <div className="error">
                              {validationErrors[`students.${idx}.end_date`][0]}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <input
                            value={row.notes}
                            onChange={(e) =>
                              updateStudentRow(idx, "notes", e.target.value)
                            }
                            placeholder="اختياري"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-sm btn-secondary"
                            onClick={() => removeRow(idx)}
                            disabled={form.students.length <= 1}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={addRow}
                  disabled={saving}
                >
                  إضافة طالب
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ الكتاب"}
                </button>
              </div>
            </form>
          </div>

          <div className="section-card">
            <h4>الكتب</h4>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم</th>
                    <th>جهة التدريب</th>
                    <th>حالة الكتاب</th>
                    <th>تاريخ</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>
                        لا يوجد كتب
                      </td>
                    </tr>
                  ) : (
                    visibleRequests.map((r) => (
                      <tr key={r.id}>
                        <td>{r.letter_number || `#${r.id}`}</td>
                        <td>{r.training_site?.name || r.trainingSite?.name || "-"}</td>
                        <td>{statusLabels[r.book_status] || r.book_status}</td>
                        <td>{r.letter_date || "-"}</td>
                        <td style={{ minWidth: 340 }}>
                          {r.book_status === "draft" ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <input
                                  placeholder="رقم الكتاب"
                                  value={sendFormById[r.id]?.letter_number || ""}
                                  onChange={(e) =>
                                    setSendField(r.id, "letter_number", e.target.value)
                                  }
                                />
                                <input
                                  type="date"
                                  value={sendFormById[r.id]?.letter_date || ""}
                                  onChange={(e) =>
                                    setSendField(r.id, "letter_date", e.target.value)
                                  }
                                />
                              </div>
                              <textarea
                                placeholder="محتوى الكتاب"
                                value={sendFormById[r.id]?.content || ""}
                                onChange={(e) =>
                                  setSendField(r.id, "content", e.target.value)
                                }
                                rows={2}
                              />
                              <button
                                className="btn-sm btn-primary"
                                onClick={() => handleSendToDirectorate(r.id)}
                                disabled={saving}
                              >
                                إرسال للمديرية
                              </button>
                            </div>
                          ) : (
                            <span>—</span>
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
    </div>
  );
}

