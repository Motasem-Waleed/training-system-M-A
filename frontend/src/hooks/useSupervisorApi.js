import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/api";

/**
 * Hook مركزي لتحميل بيانات المشرف الأكاديمي
 * يوفر وظائف مشتركة لجميع تبويبات مساحة العمل
 */

// ─── بيانات مساحة العمل (Stats + Students + Sections) ───
export function useSupervisorWorkspace() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, studentsRes, sectionsRes] = await Promise.all([
        apiClient.get("/supervisor/stats").then((r) => r.data).catch(() => null),
        apiClient.get("/supervisor/students", { params: { per_page: 200 } }).then((r) => r.data).catch(() => []),
        apiClient.get("/supervisor/sections").then((r) => r.data).catch(() => []),
      ]);
      setStats(statsRes);
      setStudents(Array.isArray(studentsRes) ? studentsRes : studentsRes?.data || []);
      setSections(Array.isArray(sectionsRes) ? sectionsRes : sectionsRes?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { stats, students, sections, loading, error, refresh: load };
}

// ─── بيانات طالب واحد ───
export function useStudentProfile(studentId) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}`);
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

// ─── الحضور ───
export function useStudentAttendance(studentId) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}/attendance`, { params: { per_page: 200 } });
      const data = res.data;
      setRecords(Array.isArray(data) ? data : data?.data || []);
      setSummary(data?.summary || null);
    } catch {
      setError("فشل تحميل سجل الحضور");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const addComment = useCallback(async (date, comment) => {
    await apiClient.post(`/supervisor/students/${studentId}/attendance-comment`, { date, comment });
    load();
  }, [studentId, load]);

  const sendAlert = useCallback(async (target) => {
    await apiClient.post(`/supervisor/students/${studentId}/attendance-alert`, { target });
  }, [studentId]);

  const escalate = useCallback(async (reason) => {
    await apiClient.post(`/supervisor/students/${studentId}/escalate`, { reason });
  }, [studentId]);

  return { records, summary, loading, error, refresh: load, addComment, sendAlert, escalate };
}

// ─── السجلات اليومية ───
export function useStudentDailyLogs(studentId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}/daily-logs`, { params: { per_page: 200 } });
      setLogs(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setError("فشل تحميل السجلات اليومية");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const review = useCallback(async (logId, supervisorComment, status) => {
    await apiClient.post(`/supervisor/daily-logs/${logId}/review`, { supervisor_comment: supervisorComment, status });
    load();
  }, [load]);

  return { logs, loading, error, refresh: load, review };
}

// ─── ملف الإنجاز ───
export function useStudentPortfolio(studentId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}/portfolio`);
      const data = res.data;
      setEntries(Array.isArray(data?.entries) ? data.entries : Array.isArray(data) ? data : []);
    } catch {
      setError("فشل تحميل ملف الإنجاز");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const commentOnEntry = useCallback(async (entryId, supervisorComment) => {
    await apiClient.put(`/portfolio-entries/${entryId}`, { supervisor_comment: supervisorComment });
    load();
  }, [load]);

  return { entries, loading, error, refresh: load, commentOnEntry };
}

// ─── الزيارات الميدانية ───
export function useSupervisorVisits(assignmentId) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const res = await apiClient.get("/supervisor-visits", { params: { training_assignment_id: assignmentId, per_page: 200 } });
      setVisits(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setError("فشل تحميل الزيارات");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  const schedule = useCallback(async (data) => {
    await apiClient.post("/supervisor-visits", { training_assignment_id: assignmentId, ...data });
    load();
  }, [assignmentId, load]);

  const complete = useCallback(async (visitId, data) => {
    await apiClient.post(`/supervisor-visits/${visitId}/complete`, data);
    load();
  }, [load]);

  return { visits, loading, error, refresh: load, schedule, complete };
}

// ─── التقييمات ───
export function useStudentEvaluations(studentId) {
  const [fieldEvals, setFieldEvals] = useState([]);
  const [academicEval, setAcademicEval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const [fieldRes, acadRes] = await Promise.all([
        apiClient.get(`/supervisor/students/${studentId}/field-evaluations`).then((r) => r.data).catch(() => []),
        apiClient.get(`/supervisor/students/${studentId}/academic-evaluation`).then((r) => r.data).catch(() => null),
      ]);
      setFieldEvals(Array.isArray(fieldRes) ? fieldRes : fieldRes?.data || []);
      setAcademicEval(acadRes);
    } catch {
      setError("فشل تحميل التقييمات");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const saveAcademic = useCallback(async (data) => {
    if (academicEval?.id) {
      await apiClient.put(`/evaluations/${academicEval.id}`, { ...data, student_id: studentId, type: "academic" });
    } else {
      await apiClient.post("/evaluations", { ...data, student_id: studentId, type: "academic" });
    }
    load();
  }, [studentId, academicEval, load]);

  return { fieldEvals, academicEval, loading, error, refresh: load, saveAcademic };
}

// ─── الرسائل / التواصل ───
export function useStudentMessages(studentId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}/messages`, { params: { per_page: 200 } });
      setMessages(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setError("فشل تحميل الرسائل");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const send = useCallback(async (data) => {
    await apiClient.post(`/supervisor/students/${studentId}/messages`, data);
    load();
  }, [studentId, load]);

  return { messages, loading, error, refresh: load, send };
}

// ─── سجل النشاط ───
export function useStudentTimeline(studentId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/supervisor/students/${studentId}/timeline`, { params: { per_page: 200 } });
      setEvents(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setError("فشل تحميل سجل النشاط");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  return { events, loading, error, refresh: load };
}
