import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import {
  getNotifications,
  markAllSystemNotificationsAsRead,
  markSystemNotificationAsRead,
} from "../../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ per_page: 100 });
      const list = Array.isArray(data?.data) ? data.data : [];
      setNotifications(
        list.map((item) => ({
          id: item.id,
          title: item.type || "إشعار",
          message: item.message || "—",
          status: item.read_at ? "approved" : "pending",
        }))
      );
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setErrorMessage("تعذر تحميل الإشعارات.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markSystemNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "approved" } : item
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllSystemNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, status: "approved" }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <>
      <PageHeader
        title="الإشعارات"
        subtitle="هنا تظهر آخر التنبيهات والإشعارات الخاصة بالنظام"
      />

      <div className="page-actions mb-3">
        <button className="btn-outline-custom btn-sm-custom" onClick={markAllAsRead}>
          تعليم الكل كمقروء
        </button>
      </div>

      {loading ? (
        <div className="alert-custom alert-info">جاري تحميل الإشعارات...</div>
      ) : errorMessage ? (
        <div className="alert-custom alert-danger">{errorMessage}</div>
      ) : !notifications.length ? (
        <EmptyState
          title="لا توجد إشعارات"
          description="لا يوجد أي إشعار جديد في الوقت الحالي."
        />
      ) : (
        <div className="list-clean">
          {notifications.map((item) => (
            <div key={item.id} className="list-item-card">
              <div className="panel-header">
                <div>
                  <h4 className="panel-title">{item.title}</h4>
                  <p className="panel-subtitle">{item.message}</p>
                </div>

                <StatusBadge
                  label={
                    item.status === "pending"
                      ? "جديد"
                      : item.status === "approved"
                      ? "مقروء"
                      : "نشط"
                  }
                  status={item.status}
                />
              </div>

              <div className="page-actions" style={{ marginTop: "12px" }}>
                <button
                  className="btn-light-custom btn-sm-custom"
                  onClick={() => markAsRead(item.id)}
                >
                  تعليم كمقروء
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}