import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/api";

/**
 * Hook مركزي لتحميل بيانات المشرف الميداني
 * يدعم 3 أنواع فرعية: mentor_teacher, school_counselor, psychologist
 */

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════════════════════
export function useFieldSupervisorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/field-supervisor/dashboard");
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل بيانات لوحة التحكم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}

// ═══════════════════════════════════════════════════════════════════════════
// Students
// ═══════════════════════════════════════════════════════════════════════════
export function useFieldSupervisorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/field-supervisor/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل قائمة الطلاب");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { students, loading, error, refresh: load };
}

export function useFieldSupervisorStudent(studentId) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/field-supervisor/students/${studentId}`);
      setStudent(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل بيانات الطالب");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  return { student, loading, error, refresh: load };
}

// ═══════════════════════════════════════════════════════════════════════════
// Attendance
// ═══════════════════════════════════════════════════════════════════════════
export function useStudentAttendance(studentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/field-supervisor/students/${studentId}/attendance`);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل سجل الحضور");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const recordAttendance = useCallback(async (attendanceData) => {
    const res = await apiClient.post("/field-supervisor/attendance", {
      student_id: studentId,
      ...attendanceData,
    });
    load();
    return res.data;
  }, [studentId, load]);

  return { data, loading, error, refresh: load, recordAttendance };
}

// ═══════════════════════════════════════════════════════════════════════════
// Daily Reports
// ═══════════════════════════════════════════════════════════════════════════
export function useReportTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/field-supervisor/report-templates");
      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل القوالب");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { templates, loading, error, refresh: load };
}

export function useStudentDailyReports(studentId) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/field-supervisor/students/${studentId}/daily-reports`);
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل التقارير");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  return { reports, loading, error, refresh: load };
}

export function useDailyReport(reportId) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/field-supervisor/daily-reports/${reportId}`);
      setReport(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل التقرير");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => { load(); }, [load]);

  const confirm = useCallback(async (comment) => {
    await apiClient.post(`/field-supervisor/daily-reports/${reportId}/confirm`, { comment });
    load();
  }, [reportId, load]);

  const returnForEdit = useCallback(async (comment) => {
    await apiClient.post(`/field-supervisor/daily-reports/${reportId}/return`, { comment });
    load();
  }, [reportId, load]);

  return { report, loading, error, refresh: load, confirm, returnForEdit };
}

// ═══════════════════════════════════════════════════════════════════════════
// Evaluations
// ═══════════════════════════════════════════════════════════════════════════
export function useEvaluationTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/field-supervisor/evaluation-templates");
      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل قوالب التقييم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { templates, loading, error, refresh: load };
}

export function useStudentEvaluation(studentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/field-supervisor/students/${studentId}/evaluation`);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل التقييم");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const saveDraft = useCallback(async (evaluationData) => {
    const res = await apiClient.post(
      `/field-supervisor/students/${studentId}/evaluation-draft`,
      evaluationData
    );
    load();
    return res.data;
  }, [studentId, load]);

  const submit = useCallback(async (evaluationData) => {
    const res = await apiClient.post(
      `/field-supervisor/students/${studentId}/evaluation-submit`,
      evaluationData
    );
    load();
    return res.data;
  }, [studentId, load]);

  return { data, loading, error, refresh: load, saveDraft, submit };
}

// ═══════════════════════════════════════════════════════════════════════════
// Communication
// ═══════════════════════════════════════════════════════════════════════════
export function useStudentMessages(studentId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/field-supervisor/students/${studentId}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل الرسائل");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const sendMessage = useCallback(async (content, relatedTo = "general") => {
    const res = await apiClient.post(`/field-supervisor/students/${studentId}/messages`, {
      content,
      related_to: relatedTo,
    });
    load();
    return res.data;
  }, [studentId, load]);

  const messageAcademicSupervisor = useCallback(async (content, relatedTo = "general") => {
    const res = await apiClient.post(
      `/field-supervisor/students/${studentId}/message-academic-supervisor`,
      { content, related_to: relatedTo }
    );
    return res.data;
  }, [studentId]);

  return { messages, loading, error, refresh: load, sendMessage, messageAcademicSupervisor };
}

// ═══════════════════════════════════════════════════════════════════════════
// Timeline
// ═══════════════════════════════════════════════════════════════════════════
export function useStudentTimeline(studentId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/field-supervisor/students/${studentId}/timeline`);
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل سجل النشاط");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  return { events, loading, error, refresh: load };
}

// ═══════════════════════════════════════════════════════════════════════════
// Labels & Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على التسميات حسب نوع المشرف الميداني
 */
export function useSubtypeLabels(supervisorType) {
  return useCallback(() => {
    const labels = {
      mentor_teacher: {
        title: "المعلم المرشد",
        dailyReport: "التقرير اليومي للتدريس",
        evaluation: "تقييم الأداء التدريسي",
        lesson: "الحصة / الدرس",
        topic: "موضوع الدرس",
        classroom: "إدارة الصف",
        preparation: "التحضير",
        teaching_aids: "الوسائل التعليمية",
      },
      school_counselor: {
        title: "المرشد التربوي",
        dailyReport: "التقرير الإرشادي اليومي",
        evaluation: "تقييم الأداء الإرشادي",
        lesson: "النشاط الإرشادي",
        topic: "الحالة / الموقف",
        classroom: "الملاحظة التربوية",
        preparation: "التقرير الإرشادي",
        teaching_aids: "نماذج المتابعة",
      },
      psychologist: {
        title: "الأخصائي النفسي",
        dailyReport: "التقرير المهني اليومي",
        evaluation: "تقييم الأداء المهني",
        lesson: "الجلسة / النشاط",
        topic: "طبيعة الحالة",
        classroom: "الملاحظة العلاجية",
        preparation: "التقرير المهني",
        teaching_aids: "الأدوات المستخدمة",
      },
    };

    return labels[supervisorType] || labels.mentor_teacher;
  }, [supervisorType])();
}
