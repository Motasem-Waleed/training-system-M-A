import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useFieldSupervisorDashboard,
  useFieldSupervisorStudents,
  useSubtypeLabels,
} from "../../hooks/useFieldSupervisorApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Star,
  BookOpen,
  Activity,
  Search,
  ArrowRight,
  Filter,
} from "lucide-react";

/**
 * منطقة عمل المشرف الميداني - الصفحة الرئيسية
 * تدعم 3 أنواع: mentor_teacher, school_counselor, psychologist
 */
export default function FieldSupervisorWorkspace() {
  const navigate = useNavigate();
  const { data: dashboardData, loading: dashboardLoading } = useFieldSupervisorDashboard();
  const { students, loading: studentsLoading } = useFieldSupervisorStudents();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");

  const supervisorType = dashboardData?.supervisor_type || "mentor_teacher";
  const labels = useSubtypeLabels(supervisorType);
  const stats = dashboardData?.stats || {};

  // فلترة الطلاب
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.university_id?.includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" || student.health_status === statusFilter;
      const matchesSpec =
        specializationFilter === "all" ||
        student.specialization === specializationFilter;
      return matchesSearch && matchesStatus && matchesSpec;
    });
  }, [students, searchTerm, statusFilter, specializationFilter]);

  // الحصول على قائمة التخصصات الفريدة
  const specializations = useMemo(() => {
    const specs = [...new Set(students.map((s) => s.specialization).filter(Boolean))];
    return specs;
  }, [students]);

  // لون حالة الطالب
  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "healthy":
        return "ممتاز";
      case "warning":
        return "تحت المتابعة";
      case "critical":
        return "يتطلب تدخل";
      default:
        return status;
    }
  };

  // البطاقات الإحصائية حسب النوع
  const getStatCards = () => {
    const baseCards = [
      {
        title: "الطلاب المرتبطين",
        value: stats.students_count || 0,
        icon: Users,
        color: "blue",
      },
      {
        title: "سجلات اليوم غير المراجعة",
        value: stats.unreviewed_reports_today || 0,
        icon: FileText,
        color: "yellow",
      },
      {
        title: "الحضور غير المسجل",
        value: stats.pending_attendance_today || 0,
        icon: CheckCircle,
        color: "orange",
      },
      {
        title: "التقييمات غير المكتملة",
        value: stats.incomplete_evaluations || 0,
        icon: Star,
        color: "purple",
      },
      {
        title: "الحالات الحرجة",
        value: stats.critical_cases || 0,
        icon: AlertCircle,
        color: "red",
      },
      {
        title: "رسائل المشرف الأكاديمي",
        value: stats.messages_from_supervisor || 0,
        icon: MessageCircle,
        color: "green",
      },
    ];

    // إضافة بطاقات خاصة حسب النوع
    if (supervisorType === "mentor_teacher") {
      baseCards.push(
        {
          title: "الدروس المنفذة",
          value: stats.lessons_conducted || 0,
          icon: BookOpen,
          color: "indigo",
        },
        {
          title: "ملاحظات إدارة الصف",
          value: stats.classroom_notes || 0,
          icon: Activity,
          color: "cyan",
        }
      );
    } else if (supervisorType === "school_counselor") {
      baseCards.push(
        {
          title: "التقارير الإرشادية",
          value: stats.counseling_reports_today || 0,
          icon: FileText,
          color: "indigo",
        },
        {
          title: "الحالات المرصودة",
          value: stats.observed_cases || 0,
          icon: Activity,
          color: "cyan",
        }
      );
    } else if (supervisorType === "psychologist") {
      baseCards.push(
        {
          title: "التقارير المهنية",
          value: stats.professional_reports || 0,
          icon: FileText,
          color: "indigo",
        },
        {
          title: "الجلسات الموثقة",
          value: stats.sessions_documented || 0,
          icon: Activity,
          color: "cyan",
        }
      );
    }

    return baseCards;
  };

  const statCards = getStatCards();

  if (dashboardLoading || studentsLoading) {
    return <FieldSupervisorSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {labels.title}
        </h1>
        <p className="text-gray-600">
          مرحباً {dashboardData?.profile?.user?.name}، لديك {stats.students_count || 0} طالب مرتبط بك
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <Card key={index} className={`border-l-4 border-l-${card.color}-500`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${card.color}-100`}>
                  <card.icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl">الطلاب المرتبطين</CardTitle>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search-input"
                  name="search"
                  placeholder="بحث بالاسم أو الرقم الجامعي..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-full sm:w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" name="status_filter" className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="healthy">ممتاز</SelectItem>
                  <SelectItem value="warning">تحت المتابعة</SelectItem>
                  <SelectItem value="critical">يتطلب تدخل</SelectItem>
                </SelectContent>
              </Select>

              {specializations.length > 0 && (
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger id="spec-filter" name="spec_filter" className="w-full sm:w-40">
                    <SelectValue placeholder="التخصص" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التخصصات</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا يوجد طلاب مطابقين للبحث</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>التخصص / القسم</TableHead>
                    <TableHead>جهة التدريب</TableHead>
                    <TableHead>الحضور</TableHead>
                    <TableHead>التقرير اليومي</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.university_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{student.specialization || "—"}</p>
                          <p className="text-xs text-gray-500">{student.department || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{student.training_site || "—"}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {student.training_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.attendance_rate ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                student.attendance_rate >= 90
                                  ? "bg-green-500"
                                  : student.attendance_rate >= 75
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <span className="text-sm">{student.attendance_rate}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            student.today_report_status === "confirmed"
                              ? "bg-green-50 text-green-700"
                              : student.today_report_status === "returned"
                              ? "bg-red-50 text-red-700"
                              : student.today_report_status === "submitted"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-50 text-gray-600"
                          }
                        >
                          {student.today_report_status === "confirmed"
                            ? "معتمد"
                            : student.today_report_status === "returned"
                            ? "معاد"
                            : student.today_report_status === "submitted"
                            ? "قيد المراجعة"
                            : "غير مُرسل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            student.evaluation_status === "completed"
                              ? "bg-green-50 text-green-700"
                              : student.evaluation_status === "draft"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-50 text-gray-600"
                          }
                        >
                          {student.evaluation_status === "completed"
                            ? "مكتمل"
                            : student.evaluation_status === "draft"
                            ? "مسودة"
                            : "لم يبدأ"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.health_status)}>
                          {getStatusLabel(student.health_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/field-supervisor/students/${student.id}`)}
                        >
                          عرض
                          <ArrowRight className="w-4 h-4 mr-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Loading Component
// ═══════════════════════════════════════════════════════════════════════════
function FieldSupervisorSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-6 w-96 mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
