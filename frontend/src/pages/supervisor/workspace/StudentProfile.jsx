import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../services/api";
import OverviewTab from "./tabs/OverviewTab";
import AttendanceTab from "./tabs/AttendanceTab";
import DailyLogsTab from "./tabs/DailyLogsTab";
import PortfolioTab from "./tabs/PortfolioTab";
import TasksTab from "./tabs/TasksTab";
import TaskSubmissionsTab from "./tabs/TaskSubmissionsTab";
import FieldVisitsTab from "./tabs/FieldVisitsTab";
import EvaluationsTab from "./tabs/EvaluationsTab";
import CommunicationTab from "./tabs/CommunicationTab";
import ActivityTimelineTab from "./tabs/ActivityTimelineTab";

const TABS = [
  { key: "overview", label: "نظرة عامة", icon: "📋" },
  { key: "attendance", label: "الحضور", icon: "📊" },
  { key: "daily-logs", label: "السجلات اليومية", icon: "📝" },
  { key: "portfolio", label: "ملف الإنجاز", icon: "📁" },
  { key: "tasks", label: "المهام", icon: "✅" },
  { key: "submissions", label: "حلول الطلبة", icon: "📩" },
  { key: "field-visits", label: "الزيارات الميدانية", icon: "🏫" },
  { key: "evaluations", label: "التقييمات", icon: "📊" },
  { key: "communication", label: "التواصل", icon: "💬" },
  { key: "timeline", label: "سجل النشاط", icon: "🕐" },
];

export default function StudentProfile({ studentId, onBack, onRefresh }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}`);
      setStudent(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل بيانات الطالب");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const renderTab = () => {
    const props = { studentId, student, onRefresh: loadStudent };
    switch (activeTab) {
      case "overview": return <OverviewTab {...props} />;
      case "attendance": return <AttendanceTab {...props} />;
      case "daily-logs": return <DailyLogsTab {...props} />;
      case "portfolio": return <PortfolioTab {...props} />;
      case "tasks": return <TasksTab {...props} />;
      case "submissions": return <TaskSubmissionsTab {...props} />;
      case "field-visits": return <FieldVisitsTab {...props} />;
      case "evaluations": return <EvaluationsTab {...props} />;
      case "communication": return <CommunicationTab {...props} />;
      case "timeline": return <ActivityTimelineTab {...props} />;
      default: return <OverviewTab {...props} />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "#f0f0f0",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          → العودة للقائمة
        </button>

        {loading ? (
          <span style={{ color: "#666" }}>جاري التحميل...</span>
        ) : student ? (
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "8px" }}>
              🎓 {student.name || "الطالب"}
              <span style={{ fontSize: "0.85rem", color: "#666", fontWeight: "400" }}>
                ({student.university_id || ""})
              </span>
            </h2>
            <p style={{ margin: "4px 0 0", color: "#888", fontSize: "0.85rem" }}>
              {student.specialization || ""} — {student.section_name || ""} — {student.site_name || ""}
            </p>
          </div>
        ) : null}
      </div>

      {error && (
        <div className="section-card" style={{ borderRight: "4px solid #dc3545", marginBottom: "16px" }}>
          <p style={{ color: "#dc3545", margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          overflowX: "auto",
          paddingBottom: "8px",
          marginBottom: "20px",
          borderBottom: "1px solid #e9ecef",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? "var(--primary, #4361ee)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "#555",
              border: "1px solid",
              borderColor: activeTab === tab.key ? "var(--primary, #4361ee)" : "#dee2e6",
              borderRadius: "8px",
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: activeTab === tab.key ? "600" : "400",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>{renderTab()}</div>
    </div>
  );
}
