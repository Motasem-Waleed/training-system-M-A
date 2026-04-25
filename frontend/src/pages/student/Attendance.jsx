import { useEffect, useState, useMemo, useRef } from "react";
import { getStudentAttendances, createAttendance, deleteAttendance, uploadPortfolioFile } from "../../services/api";
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
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
      setRecords(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "تعذر تحميل سجل الحضور.");
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
      await createAttendance({
        day: formData.day,
        date: formData.date,
        check_in: formData.check_in,
        check_out: formData.check_out,
        lessons_count: formData.lessons_count ? Number(formData.lessons_count) : null,
        notes: formData.notes,
      }).then((res) => {
        if (res?.portfolio_entry_id) {
          portfolioEntryIdRef.current = res.portfolio_entry_id;
        }
        return res;
      });
      setSuccess("تم إضافة سجل الحضور بنجاح.");
      setFormData({
        day: DAYS[0],
        date: todayISO(),
        check_in: "",
        check_out: "",
        lessons_count: "",
        notes: "",
      });
      await fetchData();
      // Generate and upload PDF to portfolio
      await syncPdfToPortfolio(portfolioEntryIdRef.current);
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
      await fetchData();
      // Update PDF in portfolio
      await syncPdfToPortfolio(portfolioEntryIdRef.current);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("تعذر حذف السجل.");
    }
  };

  const generatePdf = async () => {
    const element = document.getElementById('printable-area');
    if (!element) return null;
    const opt = {
      margin: 10,
      filename: 'attendance.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };
    const blob = await html2pdf().set(opt).from(element).output('blob');
    return blob;
  };

  const syncPdfToPortfolio = async (entryId) => {
    try {
      const pdfBlob = await generatePdf();
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
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="btn-danger-custom btn-sm-custom"
                        style={{ minHeight: 34, fontSize: "0.82rem" }}
                      >
                        <Trash2 size={14} />
                        حذف
                      </button>
                    </td>
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
