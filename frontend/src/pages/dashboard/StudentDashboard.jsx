import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  getCurrentUser,
  getStudentTrainingRequests,
  getStudentTasks,
  getStudentPortfolio,
  getStudentTrainingLogs,
  getStudentNotifications,
  itemsFromPagedResponse,
} from "../../services/api";
import { getStudentDashboardPath, getStudentTrack } from "../../utils/studentSection";
import {
  User,
  IdCard,
  GraduationCap,
  Building2,
  School,
  MapPin,
  ClipboardList,
  FileText,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function StudentDashboard({ forcedTrack = null }) {
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
    { title: "طلب التدريب", value: "جاري التحميل...", desc: "حالة طلب التدريب الحالي", className: "warning", icon: ClipboardList, link: "/student/training-request" },
    { title: "برنامج التدريب", value: "0 أيام مسجلة", desc: "عدد الأيام المضافة في البرنامج", className: "primary", icon: Calendar, link: "/student/training-logs" },
    { title: "ملف الإنجاز", value: "0 ملفات", desc: "عدد الملفات المرفوعة", className: "success", icon: Award, link: "/student/portfolio" },
    { title: "المهام", value: "0 مهمة متبقية", desc: "المهام التي تحتاج متابعة", className: "accent", icon: CheckCircle2, link: "/student/tasks" },
  ]);
  const [latestItems, setLatestItems] = useState([]);
  const [latestTasks, setLatestTasks] = useState([]);
  const [latestLogs, setLatestLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);
  const currentUser = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const detectedTrack = getStudentTrack(currentUser);
  const effectiveTrack = forcedTrack || detectedTrack || "education";

  if (forcedTrack && forcedTrack !== detectedTrack && detectedTrack) {
    return <Navigate to={getStudentDashboardPath(currentUser)} replace />;
  }

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
      const tasks = itemsFromPagedResponse(tasksRes);
      const logs = itemsFromPagedResponse(logsRes);
      const formattedNotif = notifications.slice(0, 5).map(notif => ({
        title: notif.type === "training_request_approved" ? "تم قبول طلب التدريب" : (notif.title || "تحديث جديد"),
        text: notif.message || notif.data?.message || "لا يوجد محتوى",
        type: notif.type === "warning" ? "إشعار" : "تحديث",
      }));
      setLatestItems(formattedNotif);
      setLatestTasks(tasks.slice(0, 4));
      setLatestLogs(logs.slice(0, 4));
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
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <Loader2 size={40} className="animate-spin text-primary mb-3" />
        <p className="text-muted">جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <div className="hero-content">
          <div className="hero-icon">
            <GraduationCap size={48} />
          </div>
          <div className="hero-text">
            <h1 className="hero-title">مرحباً، {studentInfo.name || "طالب"} 👋</h1>
            <p className="hero-subtitle">
              {effectiveTrack === "psychology"
                ? "لوحة تحكم طالب علم النفس - تابع تقدمك في التدريب الميداني"
                : "لوحة تحكم طالب أصول التربية - تابع تقدمك في التدريب الميداني"}
            </p>
          </div>
        </div>
      </div>

      {/* Student Info Cards */}
      <div className="section-card mb-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="section-icon">
            <User size={20} />
          </div>
          <h4 className="mb-0">المعلومات الأساسية</h4>
        </div>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon-wrapper primary">
              <User size={18} />
            </div>
            <div className="info-content">
              <span className="info-label">اسم الطالب</span>
              <strong className="info-value">{studentInfo.name || "—"}</strong>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon-wrapper accent">
              <IdCard size={18} />
            </div>
            <div className="info-content">
              <span className="info-label">الرقم الجامعي</span>
              <strong className="info-value">{studentInfo.universityId || "—"}</strong>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon-wrapper success">
              <BookOpen size={18} />
            </div>
            <div className="info-content">
              <span className="info-label">التخصص</span>
              <strong className="info-value">{studentInfo.specialization}</strong>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon-wrapper info">
              <Building2 size={18} />
            </div>
            <div className="info-content">
              <span className="info-label">الكلية</span>
              <strong className="info-value">{studentInfo.college}</strong>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon-wrapper warning">
              <MapPin size={18} />
            </div>
            <div className="info-content">
              <span className="info-label">{effectiveTrack === "psychology" ? "الجهة/المديرية" : "مديرية التربية"}</span>
              <strong className="info-value">{studentInfo.directorate || "—"}</strong>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon-wrapper primary">
              <School size={18} />
            </div>
            <div className="info-content">
              <span className="info-label">{effectiveTrack === "psychology" ? "الجهة المعتمدة" : "المدرسة المعتمدة"}</span>
              <strong className="info-value">{studentInfo.school || "—"}</strong>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon-wrapper success">
              <CheckCircle2 size={18} />
            </div>
            <div className="info-content">
              <span className="info-label">الحالة</span>
              <strong className="info-value">{studentInfo.status || "—"}</strong>
            </div>
          </div>
          <div className="info-card highlight">
            <div className="info-icon-wrapper danger">
              <ClipboardList size={18} />
            </div>
            <div className="info-content">
              <span className="info-label">حالة طلب التدريب</span>
              <strong className="info-value">{studentInfo.trainingRequestStatus}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid mb-4">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Link key={index} to={card.link} className="stat-card-link">
              <div className={`stat-card-modern ${card.className}`}>
                <div className="stat-card-header">
                  <div className={`stat-icon-modern ${card.className}`}>
                    <IconComponent size={22} />
                  </div>
                  <ArrowLeft size={16} className="stat-arrow" />
                </div>
                <div className="stat-card-body">
                  <div className="stat-value-modern">{card.value}</div>
                  <div className="stat-title-modern">{card.title}</div>
                </div>
                <div className="stat-meta-modern">{card.desc}</div>
              </div>
            </Link>
          );
        })}
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

      <div className="section-card mt-3">
        <h4>آخر المهام المطلوبة</h4>
        {latestTasks.length === 0 ? (
          <p>لا توجد مهام حديثة.</p>
        ) : (
          <div className="activity-list">
            {latestTasks.map((task) => (
              <div key={task.id} className="activity-item">
                <h6>{task.title || "مهمة"}</h6>
                <p>الموعد النهائي: {task.due_date || "—"} | الحالة: {task.status_label || task.status || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-card mt-3">
        <h4>حالة السجل اليومي الأخيرة</h4>
        {latestLogs.length === 0 ? (
          <p>لا توجد سجلات يومية بعد.</p>
        ) : (
          <div className="activity-list">
            {latestLogs.map((log) => (
              <div key={log.id} className="activity-item">
                <h6>{log.log_date || "سجل يومي"}</h6>
                <p>الحالة: {log.status_label || log.status || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}