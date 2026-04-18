import { useCallback, useEffect, useState } from "react";
import { getStudentNotifications, itemsFromPagedResponse, markNotificationAsRead } from "../../services/api";

export default function NotificationsUpdates() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentNotifications({ params: { per_page: 50 } });
      setItems(itemsFromPagedResponse(res));
    } catch (e) {
      setError(e?.response?.data?.message || "تعذر تحميل الإشعارات.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (n) => {
    if (n.read_at) return;
    try {
      await markNotificationAsRead(n.id);
      await load();
    } catch {
      /* تجاهل صامت */
    }
  };

  const titleFor = (n) => {
    if (n.type === "training_request_approved") return "تحديث على طلب التدريب";
    if (n.type === "training_request_coordinator_review") return "مراجعة منسق";
    return n.type || "إشعار";
  };

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">الإشعارات والتحديثات</h1>
        <p className="page-subtitle">متابعة ما يخص طلب التدريب والتكليفات من النظام</p>
      </div>

      {loading ? (
        <div className="section-card">جاري التحميل...</div>
      ) : error ? (
        <div className="section-card">
          <p className="text-danger">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="section-card">
          <p className="text-muted mb-0">لا توجد إشعارات حالياً.</p>
        </div>
      ) : (
        <div className="row g-4">
          {items.map((item) => (
            <div className="col-12" key={item.id}>
              <div
                className={`panel ${item.read_at ? "" : "border-start border-primary border-3"}`}
                role="button"
                tabIndex={0}
                onClick={() => markRead(item)}
                onKeyDown={(e) => e.key === "Enter" && markRead(item)}
              >
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <h5 className="mb-2">{titleFor(item)}</h5>
                    <p className="text-muted mb-2">{item.message || "—"}</p>
                  </div>
                  <div className="text-end">
                    <small className="text-muted d-block">
                      {item.created_at?.replace("T", " ").slice(0, 16) || ""}
                    </small>
                    {!item.read_at ? (
                      <small className="text-primary">جديد — اضغط لتعليم كمقروء</small>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
