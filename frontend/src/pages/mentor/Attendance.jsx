import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { approveAttendance, getAttendances, itemsFromPagedResponse } from "../../services/api";

export default function MentorAttendance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getAttendances({ per_page: 100 });
      setRows(itemsFromPagedResponse(res));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل سجلات الحضور");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    setSavingId(id);
    setError("");
    try {
      await approveAttendance(id, { approved: true, notes: null });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل اعتماد السجل");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="الحضور والغياب"
        subtitle="سجلات الطلبة المرتبطة بتعييناتك — يمكنك اعتماد السجلات بعد المراجعة."
      />

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : error ? (
        <div className="section-card">
          <p className="text-danger">{error}</p>
        </div>
      ) : !rows.length ? (
        <EmptyState
          title="لا توجد سجلات حضور"
          description="لم يُسجَّل حضور بعد للطلبة ضمن تعييناتك."
        />
      ) : (
        <div className="list-clean">
          {rows.map((r) => {
            const stu = r.user;
            const approved = !!r.approved_at;
            return (
              <div className="list-item-card" key={r.id}>
                <div className="panel-header" style={{ alignItems: "center" }}>
                  <div>
                    <h4 className="panel-title">{stu?.name || "طالب"}</h4>
                    <p className="panel-subtitle">
                      التاريخ: {r.date} — {r.status_label || r.status}
                    </p>
                  </div>
                  <span
                    className={`badge-custom ${
                      r.status === "present"
                        ? "badge-success"
                        : r.status === "absent"
                          ? "badge-danger"
                          : "badge-warning"
                    }`}
                  >
                    {r.status_label || r.status}
                  </span>
                </div>
                <div className="table-actions" style={{ marginTop: 12 }}>
                  {approved ? (
                    <span className="badge-soft badge-custom">معتمد</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary-custom btn-sm-custom"
                      disabled={savingId === r.id}
                      onClick={() => handleApprove(r.id)}
                    >
                      {savingId === r.id ? "جاري الاعتماد..." : "اعتماد السجل"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
