import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSection, getSectionEnrollments, deleteEnrollment } from "../../services/api";
import { ArrowLeft, Users, User, BookOpen, Calendar, GraduationCap, Mail, Phone, Trash2 } from "lucide-react";

export default function HeadOfDepartmentSectionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const handleRemoveStudent = async (enrollment) => {
    const studentName = enrollment.user?.name || "الطالب";
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف ${studentName} من هذه الشعبة؟\nسيتم إرسال إشعار للطالب.`
    );
    if (!confirmed) return;

    try {
      setRemovingId(enrollment.id);
      await deleteEnrollment(enrollment.id);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id));
    } catch (err) {
      console.error("Error removing student:", err);
      alert(err?.response?.data?.message || "تعذر حذف الطالب من الشعبة");
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sectionData, enrollmentsData] = await Promise.all([
          getSection(id),
          getSectionEnrollments(id),
        ]);
        setSection(sectionData);
        setEnrollments(enrollmentsData.data || []);
      } catch (err) {
        console.error("Error fetching section details:", err);
        setError("حدث خطأ أثناء تحميل بيانات الشعبة");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const getStatusLabel = (status) => {
    const labels = {
      active: "نشط",
      dropped: "منسحب",
      completed: "مكتمل",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "#22c55e",
      dropped: "#ef4444",
      completed: "#3b82f6",
    };
    return colors[status] || "#666";
  };

  if (loading) {
    return (
      <div className="enrollments-list">
        <div className="page-header">
          <h1>تفاصيل الشعبة</h1>
        </div>
        <div style={{ textAlign: "center", padding: 40 }}>جاري التحميل...</div>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="enrollments-list">
        <div className="page-header">
          <h1>تفاصيل الشعبة</h1>
          <button onClick={() => navigate("/head-department/sections")} className="btn-secondary">
            <ArrowLeft size={16} />
            رجوع
          </button>
        </div>
        <div style={{ textAlign: "center", padding: 40, color: "#dc3545" }}>
          {error || "لم يتم العثور على الشعبة"}
        </div>
      </div>
    );
  }

  return (
    <div className="enrollments-list">
      <div className="page-header">
        <div>
          <h1>تفاصيل الشعبة</h1>
          <p>{section.name} - {section.course?.name}</p>
        </div>
        <button onClick={() => navigate("/head-department/sections")} className="btn-secondary">
          <ArrowLeft size={16} />
          رجوع
        </button>
      </div>

      {/* Section Info Card */}
      <div className="section-card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={20} />
          معلومات الشعبة
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div>
            <label style={{ color: "#666", fontSize: 14 }}>المساق</label>
            <p style={{ fontWeight: 500 }}>{section.course?.name}</p>
            <p style={{ fontSize: 12, color: "#888" }}>{section.course?.code}</p>
          </div>
          <div>
            <label style={{ color: "#666", fontSize: 14 }}>الفصل الدراسي</label>
            <p style={{ fontWeight: 500 }}>
              {section.semester === "first" ? "الأول" : section.semester === "second" ? "الثاني" : "الصيفي"}
            </p>
          </div>
          <div>
            <label style={{ color: "#666", fontSize: 14 }}>العام الدراسي</label>
            <p style={{ fontWeight: 500 }}>{section.academic_year}</p>
          </div>
          <div>
            <label style={{ color: "#666", fontSize: 14 }}>السعة</label>
            <p style={{ fontWeight: 500 }}>{section.capacity} طالب</p>
          </div>
          <div>
            <label style={{ color: "#666", fontSize: 14 }}>المشرف الأكاديمي</label>
            <p style={{ fontWeight: 500 }}>{section.academic_supervisor?.name || "غير محدد"}</p>
          </div>
          <div>
            <label style={{ color: "#666", fontSize: 14 }}>عدد المسجلين</label>
            <p style={{ fontWeight: 500, color: "#3b82f6" }}>
              {enrollments.length} / {section.capacity}
            </p>
          </div>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="section-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Users size={20} />
            الطلاب المسجلون
          </h2>
          <span style={{ 
            backgroundColor: "#e7f3ff", 
            color: "#3b82f6",
            padding: "4px 12px",
            borderRadius: 12,
            fontSize: 14 
          }}>
            {enrollments.length} طالب
          </span>
        </div>

        {enrollments.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
            <Users size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>لا يوجد طلاب مسجلون في هذه الشعبة</p>
            <button 
              onClick={() => navigate(`/head-department/enrollments/create?section_id=${id}`)}
              className="btn-primary"
              style={{ marginTop: 16 }}
            >
              تسجيل طالب جديد
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {enrollments.map((enrollment) => (
              <div 
                key={enrollment.id}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  backgroundColor: "#fff"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: "50%", 
                    backgroundColor: "#e7f3ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3b82f6"
                  }}>
                    <User size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, margin: 0 }}>{enrollment.user?.name}</p>
                    <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                      {enrollment.user?.university_id}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {enrollment.user?.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#666" }}>
                      <Mail size={14} />
                      {enrollment.user.email}
                    </div>
                  )}
                  <span style={{ 
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: getStatusColor(enrollment.status) + "20",
                    color: getStatusColor(enrollment.status)
                  }}>
                    {getStatusLabel(enrollment.status)}
                  </span>
                  <button
                    onClick={() => handleRemoveStudent(enrollment)}
                    disabled={removingId === enrollment.id}
                    title="حذف الطالب من الشعبة"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      backgroundColor: removingId === enrollment.id ? "#fee2e2" : "#fff",
                      color: "#dc2626",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: removingId === enrollment.id ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (removingId !== enrollment.id) {
                        e.currentTarget.style.backgroundColor = "#fee2e2";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (removingId !== enrollment.id) {
                        e.currentTarget.style.backgroundColor = "#fff";
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    {removingId === enrollment.id ? "جارٍ..." : "حذف"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
