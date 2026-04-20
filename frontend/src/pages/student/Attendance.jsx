import { useEffect, useState } from "react";
import { getStudentAttendances, createAttendance, updateAttendance, deleteAttendance } from "../../services/api";

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
  const [studentInfo, setStudentInfo] = useState({ name: "", school: "" });

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getStudentAttendances();
      setRecords(res?.data || []);
      // Try to get student info from first record or localStorage
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setStudentInfo({
        name: savedUser?.name || "",
        school: res?.training_site?.name || savedUser?.training_site?.name || "",
      });
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setError("تعذر تحميل سجل الحضور.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
      setError(err?.response?.data?.message || "تعذر حفظ سجل الحضور.");
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
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("تعذر حذف السجل.");
    }
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">جدول حضور وغياب الطالب</h1>
        <p className="page-subtitle">
          سجل حضورك اليومي أثناء التدريب الميداني بما يتوافق مع نموذج الجامعة.
        </p>
      </div>

      <div className="section-card">
        {/* نموذج رقم (2) - الهيدر */}
        <div
          style={{
            border: "2px solid #333",
            padding: "16px 24px",
            marginBottom: 24,
            display: "flex",
            gap: 40,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          <div>
            <span>اسم الطالب: </span>
            <span style={{ borderBottom: "1px solid #333", minWidth: 180, display: "inline-block" }}>
              {studentInfo.name || "_______________________"}
            </span>
          </div>
          <div>
            <span>اسم المدرسة: </span>
            <span style={{ borderBottom: "1px solid #333", minWidth: 200, display: "inline-block" }}>
              {studentInfo.school || "_______________________"}
            </span>
          </div>
        </div>

        {/* نموذج رقم (2) - الجدول */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "2px solid #333",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "10px 8px",
                    fontWeight: 700,
                    width: "15%",
                  }}
                >
                  اليوم والتاريخ
                </th>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "10px 8px",
                    fontWeight: 700,
                    width: "15%",
                  }}
                >
                  ساعة الحضور
                </th>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "10px 8px",
                    fontWeight: 700,
                    width: "15%",
                  }}
                >
                  ساعة المغادرة
                </th>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "10px 8px",
                    fontWeight: 700,
                    width: "12%",
                  }}
                >
                  عدد الحصص
                </th>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "10px 8px",
                    fontWeight: 700,
                    width: "28%",
                  }}
                >
                  ملاحظات
                </th>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "10px 8px",
                    fontWeight: 700,
                    width: "15%",
                  }}
                >
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    جاري التحميل...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#666" }}>
                    لا توجد سجلات حضور مسجلة. استخدم النموذج أدناه لإضافة أول سجل.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ border: "1px solid #333", padding: "8px", textAlign: "center" }}>
                      <div>{rec.day}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{formatDate(rec.date)}</div>
                    </td>
                    <td style={{ border: "1px solid #333", padding: "8px", textAlign: "center" }}>
                      {rec.check_in}
                    </td>
                    <td style={{ border: "1px solid #333", padding: "8px", textAlign: "center" }}>
                      {rec.check_out}
                    </td>
                    <td style={{ border: "1px solid #333", padding: "8px", textAlign: "center" }}>
                      {rec.lessons_count || "—"}
                    </td>
                    <td style={{ border: "1px solid #333", padding: "8px" }}>{rec.notes || "—"}</td>
                    <td style={{ border: "1px solid #333", padding: "8px", textAlign: "center" }}>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          padding: "4px 12px",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {/* صف إضافة سجل جديد */}
              <tr style={{ background: "#fafafa" }}>
                <td style={{ border: "1px solid #333", padding: "8px" }}>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "6px", fontSize: 13 }}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "6px", fontSize: 13, marginTop: 6 }}
                  />
                </td>
                <td style={{ border: "1px solid #333", padding: "8px" }}>
                  <input
                    type="time"
                    name="check_in"
                    value={formData.check_in}
                    onChange={handleInputChange}
                    placeholder="مثال: 08:00"
                    style={{ width: "100%", padding: "6px", fontSize: 13 }}
                  />
                </td>
                <td style={{ border: "1px solid #333", padding: "8px" }}>
                  <input
                    type="time"
                    name="check_out"
                    value={formData.check_out}
                    onChange={handleInputChange}
                    placeholder="مثال: 14:00"
                    style={{ width: "100%", padding: "6px", fontSize: 13 }}
                  />
                </td>
                <td style={{ border: "1px solid #333", padding: "8px" }}>
                  <input
                    type="number"
                    name="lessons_count"
                    min="0"
                    max="10"
                    value={formData.lessons_count}
                    onChange={handleInputChange}
                    placeholder="عدد"
                    style={{ width: "100%", padding: "6px", fontSize: 13, textAlign: "center" }}
                  />
                </td>
                <td style={{ border: "1px solid #333", padding: "8px" }}>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="أي ملاحظات..."
                    style={{ width: "100%", padding: "6px", fontSize: 13 }}
                  />
                </td>
                <td style={{ border: "1px solid #333", padding: "8px", textAlign: "center" }}>
                  <button
                    onClick={handleAddRecord}
                    disabled={saving}
                    style={{
                      background: saving ? "#999" : "#2563eb",
                      color: "#fff",
                      border: "none",
                      padding: "6px 16px",
                      borderRadius: 4,
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: 13,
                    }}
                  >
                    {saving ? "جاري..." : "إضافة"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* رسائل التنبيه */}
        {error && (
          <div style={{ marginTop: 16, padding: "10px 16px", background: "#fee2e2", color: "#991b1b", borderRadius: 6 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: 16, padding: "10px 16px", background: "#dcfce7", color: "#166534", borderRadius: 6 }}>
            {success}
          </div>
        )}

        {/* ملاحظات توضيحية */}
        <div style={{ marginTop: 24, fontSize: 13, color: "#666", lineHeight: 1.8 }}>
          <strong>تعليمات:</strong>
          <ul style={{ marginTop: 8, paddingRight: 20 }}>
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
