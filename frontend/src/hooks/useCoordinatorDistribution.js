import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getTrainingRequests,
  getTrainingRequestBatches,
  createTrainingRequestBatch,
  sendTrainingRequestBatch,
  getCourses,
  getTrainingPeriods,
  getTrainingSites,
  getUsers,
  coordinatorReviewTrainingRequest,
  itemsFromPagedResponse,
} from "../services/api";

const getApiErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;
  const validationErrors = responseData?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    const firstError = Object.values(validationErrors).flat().find(Boolean);
    if (firstError) return firstError;
  }

  return responseData?.message || fallbackMessage;
};

export default function useCoordinatorDistribution() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [requests, setRequests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sites, setSites] = useState([]);
  const [periods, setPeriods] = useState([]);

  const [selectedForBatch, setSelectedForBatch] = useState({});
  const [batchForm, setBatchForm] = useState({
    governing_body: "directorate_of_education",
    directorate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reqRes, usersRes, coursesRes, sitesRes, periodsRes, batchesRes] =
        await Promise.all([
          getTrainingRequests({ per_page: 200 }),
          getUsers({ per_page: 200, status: "active" }),
          getCourses({ per_page: 200 }),
          getTrainingSites({ per_page: 200 }),
          getTrainingPeriods({ per_page: 200 }),
          getTrainingRequestBatches({ per_page: 50 }),
        ]);
      setRequests(itemsFromPagedResponse(reqRes));
      setStudents(itemsFromPagedResponse(usersRes));
      setCourses(itemsFromPagedResponse(coursesRes));
      setSites(itemsFromPagedResponse(sitesRes));
      setBatches(itemsFromPagedResponse(batchesRes));
      const periodsPayload = periodsRes?.data ?? periodsRes;
      setPeriods(itemsFromPagedResponse(periodsPayload));
    } catch (e) {
      setError(getApiErrorMessage(e, "فشل تحميل بيانات التوزيع"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const incomingRequests = useMemo(
    () =>
      requests.filter((r) =>
        ["sent_to_coordinator", "coordinator_under_review", "needs_edit"].includes(
          r.book_status
        )
      ),
    [requests]
  );

  const prelimApproved = useMemo(
    () => requests.filter((r) => r.book_status === "prelim_approved"),
    [requests]
  );

  const batchedPending = useMemo(
    () => requests.filter((r) => r.book_status === "batched_pending_send"),
    [requests]
  );

  const coordinatorRejected = useMemo(
    () => requests.filter((r) => r.book_status === "coordinator_rejected"),
    [requests]
  );

  const prelimApprovedByGroup = useMemo(() => {
    const map = new Map();
    for (const r of prelimApproved) {
      const gb = r.governing_body || "directorate_of_education";
      const dir = r.training_site?.directorate || r.directorate || "";
      const key = `${gb}::${dir}`;
      if (!map.has(key)) {
        map.set(key, { governing_body: gb, directorate: dir, requests: [] });
      }
      map.get(key).requests.push(r);
    }
    return Array.from(map.values());
  }, [prelimApproved]);

  const createBatchForGroup = useCallback(
    async (governing_body, directorate, requestIds) => {
      if (requestIds.length === 0) {
        setError("لا توجد طلبات لإنشاء دفعة.");
        return;
      }
      setSaving(true);
      setError("");
      try {
        await createTrainingRequestBatch({
          governing_body,
          directorate:
            governing_body === "directorate_of_education"
              ? directorate || null
              : null,
          training_request_ids: requestIds,
        });
        setSuccess("تم إنشاء الدفعة بنجاح");
        await load();
      } catch (e) {
        setError(getApiErrorMessage(e, "فشل إنشاء الدفعة"));
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const reviewDecision = useCallback(
    async (id, decision, reason = null) => {
      setSaving(true);
      setError("");
      try {
        await coordinatorReviewTrainingRequest(id, { decision, reason });
        await load();
      } catch (e) {
        setError(getApiErrorMessage(e, "فشل تنفيذ الإجراء"));
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const toggleSelect = useCallback((reqId, checked) => {
    setSelectedForBatch((prev) => ({ ...prev, [reqId]: checked }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedForBatch({});
  }, []);

  const createBatch = useCallback(async () => {
    const ids = Object.entries(selectedForBatch)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    if (ids.length === 0) {
      setError("اختر طلبًا واحدًا على الأقل لإنشاء دفعة.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createTrainingRequestBatch({
        governing_body: batchForm.governing_body,
        directorate:
          batchForm.governing_body === "directorate_of_education"
            ? batchForm.directorate || null
            : null,
        training_request_ids: ids,
      });
      setSelectedForBatch({});
      setSuccess("تم إنشاء الدفعة بنجاح");
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "فشل إنشاء الدفعة"));
    } finally {
      setSaving(false);
    }
  }, [selectedForBatch, batchForm, load]);

  const sendBatch = useCallback(
    async (batchId, letterData = {}) => {
      setSaving(true);
      setError("");
      try {
        await sendTrainingRequestBatch(batchId, letterData);
        setSuccess("تم إرسال الدفعة بنجاح");
        await load();
        return true;
      } catch (e) {
        setError(getApiErrorMessage(e, "فشل إرسال الدفعة"));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return {
    loading,
    saving,
    error,
    success,
    setSuccess,
    requests,
    batches,
    students,
    courses,
    sites,
    periods,
    selectedForBatch,
    batchForm,
    setBatchForm,
    incomingRequests,
    prelimApproved,
    prelimApprovedByGroup,
    batchedPending,
    coordinatorRejected,
    reviewDecision,
    toggleSelect,
    clearSelection,
    createBatch,
    createBatchForGroup,
    sendBatch,
    reload: load,
  };
}
