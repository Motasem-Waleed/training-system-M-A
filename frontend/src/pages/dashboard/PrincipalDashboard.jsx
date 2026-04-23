import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  getNotifications,
  getOfficialLetters,
  getTrainingRequests,
  itemsFromPagedResponse,
} from "../../services/api";
import { siteLabels } from "../../utils/roles";
import {
  isStudentApproved,
} from "../../utils/status";

const PrincipalDashboard = ({ siteType = "school" }) => {
  const labels = siteLabels(siteType);
  const [loading, setLoading] = useState(true);
  const [principalInfo, setPrincipalInfo] = useState({
    principalName: "—",
    schoolName: "—",
    directorate: "—",
    schoolType: "—",
    phone: "—",
    email: "—",
  });
  const [requests, setRequests] = useState([]);
  const [latestLetters, setLatestLetters] = useState([]);
  const [latestActivities, setLatestActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [userRes, requestsRes, lettersRes, notificationsRes] =
        await Promise.all([
          getCurrentUser().catch(() => null),
          getTrainingRequests({ per_page: 100 }).catch(() => ({ data: [] })),
          getOfficialLetters({ type: "to_school", per_page: 5 }).catch(() => ({
            data: [],
          })),
          getNotifications({ per_page: 5 }).catch(() => ({ data: [] })),
        ]);

      const requestsList = itemsFromPagedResponse(requestsRes);
      const lettersList = itemsFromPagedResponse(lettersRes);
      const notificationsList = itemsFromPagedResponse(notificationsRes);

      const u = userRes?.data || userRes || {};
      const site = u.training_site?.data || u.training_site || {};
      setPrincipalInfo({
        principalName: u.name || "—",
        schoolName: site.name || "غير محدد — اربط الحساب بموقع تدريب من الإدارة",
        directorate: site.directorate || "—",
        schoolType:
          site.site_type_label ||
          (site.school_type === "private"
            ? "جهة خاصة"
            : site.school_type === "public"
              ? "جهة حكومية"
              : site.site_type === "health_center"
                ? "مركز صحي / تدريب صحي"
                : "مدرسة / جهة تدريب"),
        phone: u.phone || "—",
        email: u.email || "—",
      });
      setRequests(requestsList);
      setLatestLetters(
        lettersList.map((letter) => ({
          id: letter.id,
          subject: letter.letter_number || "كتاب رسمي",
          sender: letter.sent_by?.data?.name || letter.sent_by?.name || "—",
          date: letter.letter_date || letter.created_at || "—",
        }))
      );
      setLatestActivities(
        notificationsList.map((item) => item.message).filter(Boolean)
      );
    } catch (error) {
      console.error("Failed to load principal dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = useMemo(() => {
    return requests
      .filter((request) =>
        ["sent_to_school", "school_approved"].includes(request.book_status)
      )
      .flatMap((request) =>
        (request.students || []).map((student) => ({
          id: `${request.id}-${student.id}`,
          studentName:
            student.user?.data?.name || student.user?.name || "طالب غير معروف",
          specialization:
            student.course?.data?.name || student.course?.name || "—",
          status: student.status_label || student.status || "قيد المراجعة",
          badgeClass: isStudentApproved(student.status)
            ? "badge-custom badge-success"
            : student.status === "rejected"
              ? "badge-custom badge-danger"
              : "badge-custom badge-warning",
        }))
      )
      .slice(0, 6);
  }, [requests]);

  const summaryCards = [
    {
      title: "طلبات التدريب الجديدة",
      value: String(
        requests.filter((request) => request.book_status === "sent_to_school").length
      ),
      desc: "طلبات بحاجة لمراجعة واعتماد",
      className: "warning",
    },
    {
      title: "الطلبة المتدربون",
      value: String(
        requests
          .flatMap((request) => request.students || [])
          .filter((student) => isStudentApproved(student.status)).length
      ),
      desc: `عدد الطلبة المقبولين داخل ${labels.siteName}`,
      className: "primary",
    },
    {
      title: labels.mentorCol,
      value: String(
        requests
          .flatMap((request) => request.students || [])
          .filter((student) => student.assigned_teacher).length
      ),
      desc: `تم تعيينهم لمتابعة الطلبة`,
      className: "success",
    },
    {
      title: "الكتب الرسمية",
      value: String(latestLetters.length),
      desc: "كتب جديدة واردة من المديرية",
      className: "accent",
    },
  ];

  return (
    <div className="principal-dashboard">
      {loading ? (
        <div className="alert-custom alert-info">جاري تحميل لوحة المدير...</div>
      ) : null}
      <div className="content-header">
        <h1 className="page-title">الرئيسية - {labels.managerLabel}</h1>
        <p className="page-subtitle">
          لوحة متابعة طلبات التدريب والمرشدين والكتب الرسمية داخل {labels.siteName}.
        </p>
      </div>

      <div className="section-card mb-3">
        <h4>المعلومات الأساسية</h4>
        <div className="summary-grid">
          <div className="kpi-box">
            <strong>{principalInfo.principalName}</strong>
            <span>{labels.managerLabel}</span>
          </div>

          <div className="kpi-box">
            <strong>{principalInfo.schoolName}</strong>
            <span>اسم {labels.siteName}</span>
          </div>

          <div className="kpi-box">
            <strong>{principalInfo.directorate}</strong>
            <span>المديرية</span>
          </div>

          <div className="kpi-box">
            <strong>{principalInfo.schoolType}</strong>
            <span>نوع {labels.siteName}</span>
          </div>

          <div className="kpi-box">
            <strong>{principalInfo.phone}</strong>
            <span>رقم الهاتف</span>
          </div>

          <div className="kpi-box">
            <strong>{principalInfo.email}</strong>
            <span>البريد الإلكتروني</span>
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

      <div className="section-card mb-3">
        <h4>طلبات التدريب الحديثة</h4>

        <div className="table-wrapper">
          <table className="table-custom">
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>التخصص</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.studentName}</td>
                  <td>{request.specialization}</td>
                  <td>
                    <span className={request.badgeClass}>{request.status}</span>
                  </td>
                </tr>
              ))}

              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center">
                    لا توجد طلبات تدريب حديثة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="section-card">
          <h4>آخر الكتب الرسمية</h4>

          <div className="activity-list">
            {latestLetters.map((letter) => (
              <div key={letter.id} className="activity-item">
                <h6>{letter.subject}</h6>
                <p>
                  الجهة المرسلة: {letter.sender}
                  <br />
                  التاريخ: {letter.date}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h4>آخر الأنشطة والتنبيهات</h4>

          <div className="activity-list">
            {latestActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <p>{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
