import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getStudentAttendances, createAttendance, deleteAttendance, uploadPortfolioFile, updatePortfolioEntry, updateAttendance } from "../../services/api";
import html2pdf from "html2pdf.js";
import {
  CalendarCheck,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  ClipboardList,
  Info,
  Printer,
  Edit3,
  Loader2,
} from "lucide-react";

// Print-specific CSS
const printStyles = `
@media print {
  @page { size: landscape; margin: 10mm; }
  body * { visibility: hidden; }
  #printable-area, #printable-area * { visibility: visible; }
  #printable-area { 
    position: absolute; 
    left: 0; 
    top: 0; 
    width: 100%;
    padding: 10mm;
  }
  .no-print { display: none !important; }
  .print-header { display: block !important; visibility: visible !important; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px; }
  th { background-color: #142a42 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .badge-success, .badge-info, .badge-primary { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const todayISO = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

export default function StudentAttendance() {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editRecord, setEditRecord] = useState({});
  const portfolioEntryIdRef = useRef(null);

  const [formData, setFormData] = useState({
    day: DAYS[0],
    date: todayISO(),
    check_in: "",
    check_out: "",
    lessons_count: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Handle edit entry from Portfolio page
  useEffect(() => {
    const editData = location.state?.editEntry;
    if (!editData) return;

    setEditingEntry(editData);
    if (editData.id) {
      portfolioEntryIdRef.current = editData.id;
    }

    // Clear navigation state
    window.history.replaceState({}, "");
  }, [location.state]);

  const stats = useMemo(() => {
    const total = records.length;
    const totalLessons = records.reduce((sum, r) => sum + (r.lessons_count || 0), 0);
    const totalHours = records.reduce((sum, r) => {
      if (r.check_in && r.check_out) {
        const [hIn, mIn] = r.check_in.split(":").map(Number);
        const [hOut, mOut] = r.check_out.split(":").map(Number);
        if (!isNaN(hIn) && !isNaN(mIn) && !isNaN(hOut) && !isNaN(mOut)) {
          return sum + (hOut + mOut / 60) - (hIn + mIn / 60);
        }
      }
      return sum;
    }, 0);
    return { total, totalLessons, totalHours: Math.round(totalHours * 10) / 10 };
  }, [records]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getStudentAttendances();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRecords(data);
      // Store portfolio entry id if returned from backend
      if (res?.portfolio_entry_id) {
        portfolioEntryIdRef.current = res.portfolio_entry_id;
      }
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || "تعذر تحميل سجل الحضور.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.check_in || !formData.check_out) {
      setError("يرجى تعبئة التاريخ وساعة الحضور والمغادرة.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await createAttendance({
        day: formData.day,
        date: formData.date,
        check_in: formData.check_in,
        check_out: formData.check_out,
        lessons_count: formData.lessons_count ? Number(formData.lessons_count) : null,
        notes: formData.notes,
      });
      if (res?.portfolio_entry_id) {
        portfolioEntryIdRef.current = res.portfolio_entry_id;
      }
      setSuccess(editingEntry ? "تم تعديل سجل الحضور بنجاح." : "تم إضافة سجل الحضور بنجاح.");
      setFormData({
        day: DAYS[0],
        date: todayISO(),
        check_in: "",
        check_out: "",
        lessons_count: "",
        notes: "",
      });
      const latestRecords = await fetchData();
      await syncPdfToPortfolio(portfolioEntryIdRef.current, latestRecords);
      setEditingEntry(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" | ")
        : err?.response?.data?.message || "تعذر حفظ سجل الحضور.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    try {
      await deleteAttendance(id);
      setSuccess("تم حذف السجل.");
      const latestRecords = await fetchData();
      await syncPdfToPortfolio(portfolioEntryIdRef.current, latestRecords);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("تعذر حذف السجل.");
    }
  };

  const startEditRecord = (rec) => {
    setEditingRecordId(rec.id);
    setEditRecord({
      day: rec.day || DAYS[0],
      date: rec.date ? rec.date.slice(0, 10) : todayISO(),
      check_in: rec.check_in || "",
      check_out: rec.check_out || "",
      lessons_count: rec.lessons_count ?? "",
      notes: rec.notes || "",
    });
  };

  const cancelEditRecord = () => {
    setEditingRecordId(null);
    setEditRecord({});
  };

  const handleUpdateRecord = async (id) => {
    try {
      setSaving(true);
      setError("");
      await updateAttendance(id, {
        day: editRecord.day,
        date: editRecord.date,
        check_in: editRecord.check_in,
        check_out: editRecord.check_out,
        lessons_count: editRecord.lessons_count ? Number(editRecord.lessons_count) : null,
        notes: editRecord.notes,
      });
      setSuccess("تم تعديل السجل بنجاح.");
      setEditingRecordId(null);
      setEditRecord({});
      const latestRecords = await fetchData();
      await syncPdfToPortfolio(portfolioEntryIdRef.current, latestRecords);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" | ")
        : err?.response?.data?.message || "تعذر تعديل السجل.");
    } finally {
      setSaving(false);
    }
  };

  const generatePdfFromRecords = async (currentRecords) => {
    // Build an HTML string directly from the data — no dependency on DOM state
    const rows = currentRecords.map((rec) => `
      <tr>
        <td style="padding:6px;border:1px solid #ccc;text-align:center;">${rec.day || ''}<br/><small>${rec.date ? rec.date.slice(0,10) : ''}</small></td>
        <td style="padding:6px;border:1px solid #ccc;text-align:center;">${rec.check_in || ''}</td>
        <td style="padding:6px;border:1px solid #ccc;text-align:center;">${rec.check_out || ''}</td>
        <td style="padding:6px;border:1px solid #ccc;text-align:center;">${rec.lessons_count ?? ''}</td>
        <td style="padding:6px;border:1px solid #ccc;text-align:right;">${rec.notes || ''}</td>
      </tr>
    `).join('');

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;padding:16px;">
        <h2 style="text-align:center;margin-bottom:12px;">سجل الحضور والغياب — نموذج رقم (2)</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#142a42;color:white;">
              <th style="padding:8px;border:1px solid #ccc;">اليوم والتاريخ</th>
              <th style="padding:8px;border:1px solid #ccc;">ساعة الحضور</th>
              <th style="padding:8px;border:1px solid #ccc;">ساعة المغادرة</th>
              <th style="padding:8px;border:1px solid #ccc;">عدد الحصص</th>
              <th style="padding:8px;border:1px solid #ccc;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ? rows : '<tr><td colspan="5" style="text-align:center;padding:12px;border:1px solid #ccc;">لا توجد سجلات</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: 'attendance.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };

    const blob = await html2pdf().set(opt).from(html).output('blob');
    return blob;
  };

  const syncPdfToPortfolio = async (entryId, latestRecords) => {
    try {
      const pdfBlob = await generatePdfFromRecords(latestRecords || []);
      if (pdfBlob && entryId) {
        await uploadPortfolioFile(entryId, pdfBlob, 'attendance.pdf');
      }
    } catch {
      // PDF upload failure is non-critical
    }
  };

  return (
    <>
      <style>{printStyles}</style>
      <div className="content-header no-print">
        <h1 className="page-title">جدول حضور وغياب الطالب</h1>
        <p className="page-subtitle">
          سجل حضورك اليومي أثناء التدريب الميداني بما يتوافق مع نموذج الجامعة.
        </p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="dashboard-grid no-print" style={{ marginBottom: 20 }}>
        <div className="stat-card primary">
          <div className="stat-top">
            <div>
              <div className="stat-title">إجمالي أيام الحضور</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-icon">
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="stat-meta">يوم تدريب مسجّل</div>
        </div>

        <div className="stat-card success">
          <div className="stat-top">
            <div>
              <div className="stat-title">إجمالي ساعات التدريب</div>
              <div className="stat-value">{stats.totalHours}</div>
            </div>
            <div className="stat-icon">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-meta">ساعة تدريب فعليّة</div>
        </div>

        <div className="stat-card info">
          <div className="stat-top">
            <div>
              <div className="stat-title">إجمالي الحصص</div>
              <div className="stat-value">{stats.totalLessons}</div>
            </div>
            <div className="stat-icon">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="stat-meta">حصة تدريبيّة</div>
        </div>
      </div>

      {/* نموذج إضافة سجل جديد */}
      <div className="section-card no-print" style={{ marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 16px", color: "var(--secondary)", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={18} />
          إضافة سجل حضور جديد
        </h4>
        <form onSubmit={handleAddRecord}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
              alignItems: "end",
            }}
          >
            <div className="form-field">
              <label className="field-label">اليوم</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleInputChange}
                className="form-select-custom"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="field-label">التاريخ</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input-custom"
              />
            </div>
            <div className="form-field">
              <label className="field-label">ساعة الحضور</label>
              <input
                type="time"
                name="check_in"
                value={formData.check_in}
                onChange={handleInputChange}
                className="form-input-custom"
              />
            </div>
            <div className="form-field">
              <label className="field-label">ساعة المغادرة</label>
              <input
                type="time"
                name="check_out"
                value={formData.check_out}
                onChange={handleInputChange}
                className="form-input-custom"
              />
            </div>
            <div className="form-field">
              <label className="field-label">عدد الحصص</label>
              <input
                type="number"
                name="lessons_count"
                min="0"
                max="10"
                value={formData.lessons_count}
                onChange={handleInputChange}
                placeholder="عدد"
                className="form-input-custom"
                style={{ textAlign: "center" }}
              />
            </div>
            <div className="form-field">
              <label className="field-label">ملاحظات</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="أي ملاحظات..."
                className="form-input-custom"
              />
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary-custom btn-sm-custom"
              style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            >
              <Plus size={16} />
              {saving ? "جاري الحفظ..." : "إضافة سجل"}
            </button>
          </div>
        </form>
      </div>

      {/* رسائل التنبيه */}
      {error && (
        <div className="alert-custom alert-danger no-print" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="alert-custom alert-success no-print" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {editingEntry && (
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "0.75rem 1rem", background: "#fef3c7", border: "1.5px solid #f59e0b", color: "#92400e", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem" }}>
          <Edit3 size={18} />
          وضع التعديل — يتم تحديث المدخل الموجود في ملف الإنجاز
        </div>
      )}

      {/* جدول سجلات الحضور */}
      <div id="printable-area" className="section-card">
        {/* Print-only header */}
        <div style={{ display: 'none' }} className="print-header">
          <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '18px' }}>سجل الحضور والغياب — نموذج رقم (2)</h1>
        </div>
        <h4 className="no-print" style={{ margin: "0 0 16px", color: "var(--secondary)", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarCheck size={18} />
          سجل الحضور والغياب — نموذج رقم (2)
          <button
            onClick={handlePrint}
            style={{
              marginRight: "auto",
              padding: "0.4rem 0.8rem",
              backgroundColor: "#1565c0",
              color: "white",
              border: "none",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              cursor: "pointer",
            }}
          >
            <Printer size={14} /> طباعة
          </button>
        </h4>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>اليوم والتاريخ</th>
                <th style={{ width: "14%" }}>ساعة الحضور</th>
                <th style={{ width: "14%" }}>ساعة المغادرة</th>
                <th style={{ width: "12%" }}>عدد الحصص</th>
                <th style={{ width: "28%" }}>ملاحظات</th>
                <th className="no-print" style={{ width: "14%" }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-faint)" }}>
                    جاري التحميل...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ border: "none", background: "transparent", padding: "32px 22px" }}>
                      <CalendarCheck size={36} style={{ color: "var(--border-strong)", marginBottom: 10 }} />
                      <h4 style={{ margin: "0 0 6px" }}>لا توجد سجلات حضور</h4>
                      <p>استخدم النموذج أعلاه لإضافة أول سجل حضور.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec, idx) => (
                  <tr key={rec.id}>
                    {editingRecordId === rec.id ? (
                      <>
                        <td>
                          <select
                            value={editRecord.day}
                            onChange={(e) => setEditRecord((prev) => ({ ...prev, day: e.target.value }))}
                            className="form-select-custom"
                            style={{ fontSize: "0.82rem", marginBottom: 4 }}
                          >
                            {DAYS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={editRecord.date}
                            onChange={(e) => setEditRecord((prev) => ({ ...prev, date: e.target.value }))}
                            className="form-input-custom"
                            style={{ fontSize: "0.78rem" }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="time"
                            value={editRecord.check_in}
                            onChange={(e) => setEditRecord((prev) => ({ ...prev, check_in: e.target.value }))}
                            className="form-input-custom"
                            style={{ fontSize: "0.82rem", textAlign: "center" }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="time"
                            value={editRecord.check_out}
                            onChange={(e) => setEditRecord((prev) => ({ ...prev, check_out: e.target.value }))}
                            className="form-input-custom"
                            style={{ fontSize: "0.82rem", textAlign: "center" }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            max="15"
                            value={editRecord.lessons_count}
                            onChange={(e) => setEditRecord((prev) => ({ ...prev, lessons_count: e.target.value }))}
                            className="form-input-custom"
                            style={{ fontSize: "0.82rem", textAlign: "center", width: 60 }}
                            placeholder="—"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editRecord.notes}
                            onChange={(e) => setEditRecord((prev) => ({ ...prev, notes: e.target.value }))}
                            className="form-input-custom"
                            style={{ fontSize: "0.82rem" }}
                            placeholder="ملاحظات..."
                          />
                        </td>
                        <td className="no-print" style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button
                              onClick={() => handleUpdateRecord(rec.id)}
                              disabled={saving}
                              className="btn-primary-custom btn-sm-custom"
                              style={{ minHeight: 34, fontSize: "0.78rem", opacity: saving ? 0.6 : 1 }}
                            >
                              {saving ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                              حفظ
                            </button>
                            <button
                              onClick={cancelEditRecord}
                              className="btn-danger-custom btn-sm-custom"
                              style={{ minHeight: 34, fontSize: "0.78rem" }}
                            >
                              إلغاء
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--secondary)" }}>{rec.day}</div>
                          <div style={{ fontSize: "0.82rem", color: "var(--text-faint)", marginTop: 2 }}>
                            {formatDate(rec.date)}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge-custom badge-success" style={{ fontSize: "0.85rem" }}>
                            {rec.check_in}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge-custom badge-info" style={{ fontSize: "0.85rem" }}>
                            {rec.check_out}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {rec.lessons_count ? (
                            <span className="badge-custom badge-primary">{rec.lessons_count}</span>
                          ) : (
                            <span style={{ color: "var(--text-faint)" }}>—</span>
                          )}
                        </td>
                        <td>
                          {rec.notes || <span style={{ color: "var(--text-faint)" }}>—</span>}
                        </td>
                        <td className="no-print" style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button
                              onClick={() => startEditRecord(rec)}
                              className="btn-primary-custom btn-sm-custom"
                              style={{ minHeight: 34, fontSize: "0.82rem" }}
                            >
                              <Edit3 size={14} />
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="btn-danger-custom btn-sm-custom"
                              style={{ minHeight: 34, fontSize: "0.82rem" }}
                            >
                              <Trash2 size={14} />
                              حذف
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ملاحظات توضيحية */}
        <div
          className="no-print"
          style={{
            marginTop: 22,
            padding: "14px 18px",
            background: "rgba(59,130,182,0.05)",
            border: "1px solid rgba(59,130,182,0.12)",
            borderRadius: "var(--radius-sm, 10px)",
            fontSize: "0.88rem",
            color: "var(--text-soft)",
            lineHeight: 1.9,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontWeight: 800, color: "var(--info)" }}>
            <Info size={16} />
            تعليمات
          </div>
          <ul style={{ paddingRight: 20, listStyle: "disc" }}>
            <li>يجب تسجيل حضورك يومياً خلال فترة التدريب.</li>
            <li>تأكد من إدخال ساعة الحضور والمغادرة بالتنسيق 24 ساعة (مثال: 08:00 - 14:30).</li>
            <li>عدد الحصص يشير إلى عدد الدروس/الفصول التي حضرتها في ذلك اليوم.</li>
            <li>أي ملاحظات خاصة (مثل: غياب المشرف، ظروف خاصة) يمكن تسجيلها في عمود الملاحظات.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
