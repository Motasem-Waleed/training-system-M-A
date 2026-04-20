import { useStudentTimeline } from "../../../hooks/useFieldSupervisorApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  FileText,
  Star,
  MessageCircle,
  RotateCcw,
  AlertTriangle,
  Activity,
  Clock,
  Check,
  Edit,
  Send,
  Save,
} from "lucide-react";

/**
 * تبويب سجل النشاط (Timeline)
 */
export default function TimelineTab({ studentId }) {
  const { events, loading, error } = useStudentTimeline(studentId);

  if (loading) {
    return <TimelineSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case "attendance":
        return CheckCircle;
      case "report":
        return FileText;
      case "evaluation":
        return Star;
      case "message":
        return MessageCircle;
      default:
        return Activity;
    }
  };

  const getEventColor = (color) => {
    const colors = {
      green: "bg-green-100 text-green-600 border-green-200",
      red: "bg-red-100 text-red-600 border-red-200",
      yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
    };
    return colors[color] || colors.blue;
  };

  const getEventTitle = (event) => {
    return event.title;
  };

  // تجميع الأحداث حسب التاريخ
  const groupedEvents = events.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort((a, b) =>
    new Date(b) - new Date(a)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          سجل النشاط
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد أحداث مسجلة</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="relative">
                {/* تاريخ المجموعة */}
                <div className="sticky top-0 bg-white py-2 z-10 border-b mb-4">
                  <Badge variant="outline" className="font-medium">
                    {new Date(date).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Badge>
                </div>

                {/* الأحداث */}
                <div className="space-y-3 mr-4 border-r-2 border-gray-200 pr-4">
                  {groupedEvents[date].map((event, index) => {
                    const Icon = getEventIcon(event.type);
                    return (
                      <div
                        key={`${date}-${index}`}
                        className="relative"
                      >
                        {/* نقطة التوقيت */}
                        <div
                          className={`
                            absolute -right-[calc(1rem+2px)] top-0
                            w-4 h-4 rounded-full border-2 bg-white
                            ${getEventColor(event.color).replace(
                              /bg-[\w-]+/,
                              ""
                            )}
                          `}
                          style={{
                            borderColor:
                              event.color === "green"
                                ? "#22c55e"
                                : event.color === "red"
                                ? "#ef4444"
                                : event.color === "yellow"
                                ? "#eab308"
                                : event.color === "purple"
                                ? "#a855f7"
                                : "#3b82f6",
                          }}
                        />

                        <div
                          className={`
                            p-3 rounded-lg border
                            ${getEventColor(event.color)}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{getEventTitle(event)}</p>
                                <span className="text-xs opacity-75">{event.time}</span>
                              </div>
                              {event.description && (
                                <p className="text-sm mt-1 opacity-90">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* مفتاح الأحداث */}
        <div className="mt-8 pt-4 border-t">
          <p className="text-sm font-medium mb-3">مفتاح الأحداث:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span>حضور</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span>تقرير</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span>تقييم</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span>رسالة</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Loading
// ═══════════════════════════════════════════════════════════════════════════
function TimelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
  );
}
