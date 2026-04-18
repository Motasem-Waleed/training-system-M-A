import { useEffect, useState, useCallback, useRef } from "react";
import {
  getCurrentUser,
  getStudentTrainingRequests,
  getStudentTasks,
  getStudentPortfolio,
  getStudentTrainingLogs,
  getStudentNotifications,
  itemsFromPagedResponse,
} from "../../services/api";

export default function StudentDashboard() {
  const [studentInfo, setStudentInfo] = useState({
    name: "",
    universityId: "",
    specialization: "علوم الحاسوب",
    college: "",
    status: "",
    directorate: "",
    school: "",
    trainingRequestStatus: "",
  });
  const [summaryCards, setSummaryCards] = useState([
    { title: "طلب التدريب", value: "جاري التحميل...", desc: "حالة طلب التدريب الحالي", className: "warning" },
    { title: "برنامج التدريب", value: "0 أيام مسجلة", desc: "عدد الأيام المضافة في البرنامج", className: "primary" },
    { title: "ملف الإنجاز", value: "0 ملفات", desc: "عدد الملفات المرفوعة", className: "success" },
    { title: "المهام", value: "0 مهمة متبقية", desc: "المهام التي تحتاج متابعة", className: "accent" },
  ]);
  const [latestItems, setLatestItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  const fetchDashboardData = useCallback(async () => {
    // إلغاء أي طلب سابق قبل بدء طلب جديد
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    setLoading(true);
    try {
      // جلب جميع البيانات بالتوازي (أسرع)
      const [user, requestsRes, tasksRes, portfolioRes, logsRes, notifRes] = await Promise.all([
        getCurrentUser({ signal }),
        getStudentTrainingRequests({ signal }),
        getStudentTasks({ signal }),
        getStudentPortfolio({ signal }),
        getStudentTrainingLogs({ signal }),
        getStudentNotifications({ signal }),
      ]);

      // 1. بيانات المستخدم
      console.log("بيانات المستخدم من API:", user); // للتشخيص
      setStudentInfo(prev => ({
        ...prev,
        name: user?.name || user?.data?.name || "",
        universityId: user?.university_id || user?.data?.university_id || "",
        college: user?.department?.name || user?.data?.department?.name || "كلية التربية",
        status: user?.status_label || user?.status || user?.data?.status || "",
      }));

      // 2. طلبات التدريب
      const trainingRequest = itemsFromPagedResponse(requestsRes)[0] || null;
      let requestStatus = "لم يتم التقديم بعد";
      let schoolName = "";
      let directorateName = "";
      if (trainingRequest) {
        requestStatus = trainingRequest.book_status_label || trainingRequest.book_status || trainingRequest.status_label || trainingRequest.status || "قيد الانتظار";
        schoolName = trainingRequest.training_site?.name || "";
        directorateName = trainingRequest.training_site?.directorate_label || trainingRequest.training_site?.directorate || "";
      }
      setStudentInfo(prev => ({
        ...prev,
        trainingRequestStatus: requestStatus,
        school: schoolName,
        directorate: directorateName,
      }));

      // 3. تحديث بطاقات الملخص
      setSummaryCards(prev =>
        prev.map(card => {
          if (card.title === "طلب التدريب") return { ...card, value: requestStatus };
          if (card.title === "المهام") {
            const tasks = itemsFromPagedResponse(tasksRes);
            const pendingTasks = tasks.filter(t => t.status !== "submitted" && t.status !== "graded").length;
            return { ...card, value: `${pendingTasks} مهمة متبقية` };
          }
          if (card.title === "ملف الإنجاز") {
            const portfolioData = portfolioRes?.data || portfolioRes || {};
            const entriesCount = portfolioData.entries?.length || 0;
            return { ...card, value: `${entriesCount} ملفات` };
          }
          if (card.title === "برنامج التدريب") {
            const logs = itemsFromPagedResponse(logsRes);
            const logsCount = logs.length;
            return { ...card, value: `${logsCount} أيام مسجلة` };
          }
          return card;
        })
      );

      // 4. آخر الإشعارات
      const notifications = itemsFromPagedResponse(notifRes);
      const formattedNotif = notifications.slice(0, 5).map(notif => ({
        title: notif.type === "training_request_approved" ? "تم قبول طلب التدريب" : (notif.title || "تحديث جديد"),
        text: notif.message || notif.data?.message || "لا يوجد محتوى",
        type: notif.type === "warning" ? "إشعار" : "تحديث",
      }));
      setLatestItems(formattedNotif);
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        console.log("تم إلغاء الطلب السابق");
        return;
      }
      console.error("خطأ في جلب بيانات لوحة التحكم:", error);
    } finally {
      // فقط إذا لم يتم الإلغاء ننهي حالة التحميل
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    return () => {
      // إلغاء أي طلب قيد التنفيذ عند إزالة المكون
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDashboardData]);

  const getBadgeClass = (type) => {
    if (type === "إشعار") return "badge-custom badge-info";
    return "badge-custom badge-soft";
  };

  if (loading) {
    return <div className="text-center">جاري تحميل لوحة التحكم...</div>;
  }

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">الصفحة الرئيسية</h1>
        <p className="page-subtitle">ملخص معلومات الطالب والتدريب وآخر الإشعارات.</p>
      </div>

      <div className="section-card mb-3">
        <h4>المعلومات الأساسية عن الطالب</h4>
        <div className="summary-grid">
          <div className="kpi-box">
            <strong>{studentInfo.name || "—"}</strong>
            <span>اسم الطالب</span>
          </div>
          <div className="kpi-box">
            <strong>{studentInfo.universityId || "—"}</strong>
            <span>الرقم الجامعي</span>
          </div>
          <div className="kpi-box">
            <strong>{studentInfo.specialization}</strong>
            <span>التخصص</span>
          </div>
          <div className="kpi-box">
            <strong>{studentInfo.college}</strong>
            <span>الكلية</span>
          </div>
          <div className="kpi-box">
            <strong>{studentInfo.directorate || "—"}</strong>
            <span>مديرية التربية</span>
          </div>
          <div className="kpi-box">
            <strong>{studentInfo.school || "—"}</strong>
            <span>المدرسة</span>
          </div>
          <div className="kpi-box">
            <strong>{studentInfo.status || "—"}</strong>
            <span>الحالة</span>
          </div>
          <div className="kpi-box">
            <strong>{studentInfo.trainingRequestStatus}</strong>
            <span>حالة طلب التدريب</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid mb-3">
        {summaryCards.map((card, index) => (
          <div key={index} className={`stat-card ${card.className}`}>
            <div>
              <div className="stat-title">{card.title}</div>
              <div className="stat-value">{card.value}</div>
            </div>
            <div className="stat-meta">{card.desc}</div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <h4>آخر الإشعارات والتحديثات</h4>
        {latestItems.length === 0 ? (
          <p>لا توجد إشعارات حديثة.</p>
        ) : (
          <div className="activity-list">
            {latestItems.map((item, index) => (
              <div key={index} className="activity-item">
                <div className="mb-1">
                  <span className={getBadgeClass(item.type)}>{item.type}</span>
                </div>
                <h6>{item.title}</h6>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}