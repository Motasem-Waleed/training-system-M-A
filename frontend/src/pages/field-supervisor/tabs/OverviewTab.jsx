import { useNavigate } from "react-router-dom";
import { useFieldSupervisorStudent } from "../../../hooks/useFieldSupervisorApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  User,
  MapPin,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  Star,
  MessageCircle,
  ArrowRight,
  AlertCircle,
  Clock,
} from "lucide-react";

/**
 * تبويب النظرة العامة على الطالب
 */
export default function OverviewTab({ studentId, labels }) {
  const navigate = useNavigate();
  const { student, loading } = useFieldSupervisorStudent(studentId);

  if (loading) {
    return <OverviewSkeleton />;
  }

  const studentData = student?.student || student || {};
  const attendance = student?.attendance || {};
  const lastReport = student?.last_report || {};
  const evaluation = student?.evaluation || {};

  // الأزرار السريعة
  const quickActions = [
    {
      key: "record_attendance",
      label: "تسجيل حضور",
      icon: CheckCircle,
      color: "blue",
      action: () => navigate(`/field-supervisor/students/${studentId}?tab=attendance`),
    },
    {
      key: "review_today_report",
      label: "مراجعة تقرير اليوم",
      icon: FileText,
      color: "green",
      action: () => navigate(`/field-supervisor/students/${studentId}?tab=daily-reports`),
    },
    {
      key: "open_evaluation",
      label: "فتح التقييم",
      icon: Star,
      color: "yellow",
      action: () => navigate(`/field-supervisor/students/${studentId}?tab=evaluation`),
    },
    {
      key: "message_student",
      label: "رسالة للطالب",
      icon: MessageCircle,
      color: "purple",
      action: () => navigate(`/field-supervisor/students/${studentId}?tab=communication`),
    },
    {
      key: "message_supervisor",
      label: "رسالة للمشرف الأكاديمي",
      icon: MessageCircle,
      color: "indigo",
      action: () => navigate(`/field-supervisor/students/${studentId}?tab=communication`),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.key}
                variant="outline"
                size="sm"
                onClick={action.action}
                className={`gap-2 border-${action.color}-200 hover:bg-${action.color}-50`}
              >
                <action.icon className={`w-4 h-4 text-${action.color}-500`} />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* معلومات أساسية */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              معلومات الطالب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={User} label="الاسم الكامل" value={studentData.name} />
            <InfoRow
              icon={Building}
              label="الرقم الجامعي"
              value={studentData.university_id}
            />
            <InfoRow
              icon={MapPin}
              label="التخصص"
              value={studentData.specialization || "—"}
            />
            <InfoRow
              icon={Building}
              label="القسم"
              value={studentData.department || "—"}
            />
            <InfoRow
              icon={Building}
              label="المساق التدريبي"
              value={studentData.section || "—"}
            />
            <InfoRow
              icon={MapPin}
              label="جهة التدريب"
              value={studentData.training_site || "—"}
            />
            <InfoRow
              icon={Calendar}
              label="تاريخ بدء التدريب"
              value={studentData.training_start || "—"}
            />
            <InfoRow
              icon={CheckCircle}
              label="حالة الطالب"
              value={
                studentData.training_status ? (
                  <Badge
                    className={
                      studentData.training_status === "ongoing"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {studentData.training_status === "ongoing" ? "مستمر" : studentData.training_status}
                  </Badge>
                ) : (
                  "—"
                )
              }
            />
          </CardContent>
        </Card>

        {/* إحصائيات الأداء */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              مؤشرات الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* نسبة الالتزام */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">نسبة الالتزام بالحضور</span>
                <span className="text-sm font-bold">{attendance.attendance_rate || 0}%</span>
              </div>
              <Progress value={attendance.attendance_rate || 0} className="h-2" />
            </div>

            {/* آخر حضور */}
            <InfoRow
              icon={CheckCircle}
              label="آخر حضور"
              value={student?.last_attendance || "—"}
            />

            {/* آخر تقرير */}
            <InfoRow
              icon={FileText}
              label="آخر تقرير يومي"
              value={
                lastReport?.date ? (
                  <div className="flex items-center gap-2">
                    <span>{lastReport.date}</span>
                    <Badge
                      className={
                        lastReport.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : lastReport.status === "returned"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }
                    >
                      {lastReport.status_label || lastReport.status}
                    </Badge>
                  </div>
                ) : (
                  "—"
                )
              }
            />

            {/* حالة التقييم */}
            <InfoRow
              icon={Star}
              label="حالة التقييم الميداني"
              value={
                evaluation?.status ? (
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        evaluation.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : evaluation.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {evaluation.status_label || evaluation.status}
                    </Badge>
                    {evaluation.is_final && (
                      <Badge className="bg-purple-100 text-purple-800">نهائي</Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline">لم يبدأ</Badge>
                )
              }
            />

            {/* آخر ملاحظة */}
            {student?.last_note && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    آخر ملاحظة من المشرف الأكاديمي
                  </span>
                </div>
                <p className="text-sm text-yellow-700">{student.last_note}</p>
              </div>
            )}

            {/* التنبيهات */}
            {student?.health_status === "critical" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    هذا الطالب يتطلب تدخلاً عاجلاً
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ملخص الحضور */}
      {attendance?.total_days > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              ملخص الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox
                label="إجمالي الأيام"
                value={attendance.total_days}
                color="gray"
              />
              <StatBox
                label="أيام الحضور"
                value={attendance.present_days}
                color="green"
              />
              <StatBox
                label="أيام الغياب"
                value={attendance.absent_days}
                color="red"
              />
              <StatBox
                label="التأخر"
                value={attendance.late_days}
                color="yellow"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// مكون مساعد: صف معلومات
// ═══════════════════════════════════════════════════════════════════════════
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// مكون مساعد: صندوق إحصائيات
// ═══════════════════════════════════════════════════════════════════════════
function StatBox({ label, value, color }) {
  const colorClasses = {
    gray: "bg-gray-50 text-gray-800",
    green: "bg-green-50 text-green-800",
    red: "bg-red-50 text-red-800",
    yellow: "bg-yellow-50 text-yellow-800",
  };

  return (
    <div className={`p-4 rounded-lg text-center ${colorClasses[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Loading
// ═══════════════════════════════════════════════════════════════════════════
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
