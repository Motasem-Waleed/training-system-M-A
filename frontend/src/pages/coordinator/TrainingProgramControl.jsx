import { useEffect, useState } from "react";
import { getFeatureFlags, updateFeatureFlag } from "../../services/api";
import { Loader2, Lock, Unlock, AlertCircle } from "lucide-react";

export default function TrainingProgramControl() {
  const [flag, setFlag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const flags = await getFeatureFlags();
      const tpFlag = flags.find((f) => f.name === "training_program.edit");
      setFlag(tpFlag || null);
    } catch (e) {
      setError("تعذر تحميل حالة برنامج التدريب.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async () => {
    if (!flag) return;
    setToggling(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateFeatureFlag(flag.id, !flag.is_open);
      setFlag(updated);
      setSuccess(
        !flag.is_open
          ? "تم فتح إدخال برنامج التدريب للطلاب"
          : "تم إغلاق إدخال برنامج التدريب للطلاب"
      );
    } catch (e) {
      setError("تعذر تغيير حالة برنامج التدريب.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="section-card" style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="spin" size={24} /> جاري التحميل...
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">التحكم ببرنامج التدريب</h1>
        <p className="page-subtitle">
          فتح أو إغلاق إمكانية تعديل الطلاب لجدول الحصص في برنامج التدريب
        </p>
      </div>

      {error && (
        <div className="alert-custom alert-danger mb-3" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div className="alert-custom alert-success mb-3">{success}</div>
      )}

      <div className="section-card">
        <div className="panel-header">
          <h3 className="panel-title">حالة إدخال برنامج التدريب</h3>
        </div>

        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          {flag ? (
            <>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: flag.is_open ? "#d4edda" : "#f8d7da",
                  marginBottom: "1rem",
                }}
              >
                {flag.is_open ? (
                  <Unlock size={36} color="#155724" />
                ) : (
                  <Lock size={36} color="#721c24" />
                )}
              </div>

              <h2 style={{ marginBottom: "0.5rem" }}>
                {flag.is_open ? "إدخال برنامج التدريب مفتوح" : "إدخال برنامج التدريب مغلق"}
              </h2>
              <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
                {flag.is_open
                  ? "الطلاب يمكنهم إدخال وتعديل جدول الحصص في برنامج التدريب"
                  : "الطلاب يمكنهم مشاهدة جدول الحصص فقط دون تعديل"}
              </p>

              <button
                onClick={toggle}
                disabled={toggling}
                style={{
                  padding: "0.75rem 2rem",
                  fontSize: "1.1rem",
                  backgroundColor: flag.is_open ? "#dc3545" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: toggling ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  opacity: toggling ? 0.6 : 1,
                }}
              >
                {toggling ? (
                  <Loader2 className="spin" size={18} />
                ) : flag.is_open ? (
                  <Lock size={18} />
                ) : (
                  <Unlock size={18} />
                )}
                {flag.is_open ? "إغلاق إدخال برنامج التدريب" : "فتح إدخال برنامج التدريب"}
              </button>
            </>
          ) : (
            <p className="text-danger">
              لم يتم العثور على خاصية برنامج التدريب. يرجى تشغيل الـ Seeder.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
