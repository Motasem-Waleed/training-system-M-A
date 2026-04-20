import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  useFieldSupervisorStudent,
  useSubtypeLabels,
} from "../../hooks/useFieldSupervisorApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  User,
  Calendar,
  MapPin,
  CheckCircle,
  FileText,
  Star,
  MessageCircle,
  Activity,
  Clock,
} from "lucide-react";

// Import Tab Components
import OverviewTab from "./tabs/OverviewTab";
import AttendanceTab from "./tabs/AttendanceTab";
import DailyReportsTab from "./tabs/DailyReportsTab";
import EvaluationTab from "./tabs/EvaluationTab";
import CommunicationTab from "./tabs/CommunicationTab";
import TimelineTab from "./tabs/TimelineTab";

/**
 * صفحة تفاصيل الطالب للمشرف الميداني
 * تحتوي على 6 تبويبات
 */
export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { student, loading, error, refresh } = useFieldSupervisorStudent(studentId);
  const supervisorType = student?.supervisor_type || "mentor_teacher";
  const labels = useSubtypeLabels(supervisorType);

  if (loading) {
    return <StudentDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">حدث خطأ</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={refresh} className="mt-4">
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">الطالب غير موجود</p>
            <Button onClick={() => navigate("/field-supervisor")} className="mt-4">
              العودة للقائمة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentData = student?.student || student;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/field-supervisor")}
          className="mb-4"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للقائمة
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{studentData.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                <span>{studentData.university_id}</span>
                <span>•</span>
                <span>{studentData.specialization || "—"}</span>
                <Badge variant="outline" className="text-xs">
                  {studentData.section || "—"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                student?.health_status === "healthy"
                  ? "bg-green-100 text-green-800"
                  : student?.health_status === "warning"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {student?.health_status === "healthy"
                ? "حالة ممتازة"
                : student?.health_status === "warning"
                ? "تحت المتابعة"
                : "يتطلب تدخل"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">جهة التدريب</p>
              <p className="text-sm font-medium">{studentData.training_site || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">تاريخ البدء</p>
              <p className="text-sm font-medium">{studentData.training_start || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">نسبة الحضور</p>
              <p className="text-sm font-medium">
                {student?.attendance?.attendance_rate || 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-xs text-gray-500">حالة التقييم</p>
              <p className="text-sm font-medium">
                {student?.evaluation?.status_label || "لم يبدأ"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-white mb-4 flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-2">
            <User className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            الحضور
          </TabsTrigger>
          <TabsTrigger value="daily-reports" className="gap-2">
            <FileText className="w-4 h-4" />
            {labels.dailyReport}
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="gap-2">
            <Star className="w-4 h-4" />
            {labels.evaluation}
          </TabsTrigger>
          <TabsTrigger value="communication" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            التواصل
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Activity className="w-4 h-4" />
            سجل النشاط
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab studentId={studentId} labels={labels} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <AttendanceTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="daily-reports" className="mt-0">
          <DailyReportsTab studentId={studentId} labels={labels} />
        </TabsContent>

        <TabsContent value="evaluation" className="mt-0">
          <EvaluationTab studentId={studentId} labels={labels} />
        </TabsContent>

        <TabsContent value="communication" className="mt-0">
          <CommunicationTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <TimelineTab studentId={studentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Loading
// ═══════════════════════════════════════════════════════════════════════════
function StudentDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Skeleton className="h-10 w-32 mb-4" />

      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>

      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
