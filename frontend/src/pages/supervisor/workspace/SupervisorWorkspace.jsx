import { useState, useEffect, useCallback } from "react";
import { apiClient, unwrapSupervisorList, unwrapSupervisorStats } from "../../../services/api";
import DashboardSummary from "./DashboardSummary";
import StudentsTable from "./StudentsTable";
import StudentProfile from "./StudentProfile";

export default function SupervisorWorkspace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    try {
      const [statsRes, studentsRes, sectionsRes] = await Promise.all([
        apiClient.get("/supervisor/stats").then((r) => r.data).catch(() => null),
        apiClient.get("/supervisor/students", { params: { per_page: 200 } }).then((r) => r.data).catch(() => ({})),
        apiClient.get("/supervisor/sections", { params: { per_page: 100 } }).then((r) => r.data).catch(() => ({})),
      ]);

      setStats(unwrapSupervisorStats(statsRes));
      setStudents(unwrapSupervisorList(studentsRes));
      setSections(unwrapSupervisorList(sectionsRes));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل البيانات");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  const handleSelectStudent = useCallback((studentId) => {
    setSelectedStudentId(studentId);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedStudentId(null);
  }, []);

  const handleRefresh = useCallback(() => {
    loadWorkspace();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⏳</div>
        <p style={{ color: "#666" }}>جاري تحميل مساحة العمل...</p>
      </div>
    );
  }

  if (selectedStudentId) {
    return (
      <StudentProfile
        studentId={selectedStudentId}
        onBack={handleBackToList}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <div>
      {error && (
        <div className="section-card" style={{ borderRight: "4px solid #dc3545", marginBottom: "16px" }}>
          <p style={{ color: "#dc3545", margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      <DashboardSummary stats={stats} loading={loading} />

      <div className="section-card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
              👥 الطلبة المشرف عليهم
            </h3>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: "0.85rem" }}>
              متابعة شاملة لحالة كل طالب
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <input
              id="student-search"
              name="search"
              type="text"
              className="form-input-custom"
              placeholder="🔍 بحث بالاسم أو الرقم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: "200px" }}
            />
            <select
              id="section-filter"
              name="section"
              className="form-select-custom"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              style={{ minWidth: "140px" }}
            >
              <option value="">كل الشعب</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.section_name || s.name}
                </option>
              ))}
            </select>
            <select
              id="status-filter"
              name="status"
              className="form-select-custom"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: "140px" }}
            >
              <option value="">كل الحالات</option>
              <option value="healthy">🟢 سليم</option>
              <option value="warning">🟡 تنبيه</option>
              <option value="critical">🔴 حرج</option>
            </select>
          </div>
        </div>

        <StudentsTable
          students={students}
          searchTerm={searchTerm}
          filterSection={filterSection}
          filterStatus={filterStatus}
          onSelectStudent={handleSelectStudent}
        />
      </div>
    </div>
  );
}
