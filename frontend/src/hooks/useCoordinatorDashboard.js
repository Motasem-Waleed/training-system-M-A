import { useEffect, useState, useCallback } from "react";
import {
  getDashboardStats,
  getTrainingRequests,
  getTrainingRequestBatches,
  itemsFromPagedResponse,
} from "../services/api";

export default function useCoordinatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [st, reqRes, batchRes] = await Promise.all([
        getDashboardStats(),
        getTrainingRequests({ per_page: 8 }),
        getTrainingRequestBatches({ per_page: 5 }),
      ]);
      setStats(st);
      setRecentRequests(itemsFromPagedResponse(reqRes));
      setRecentBatches(itemsFromPagedResponse(batchRes));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل لوحة المنسق");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingReview = stats?.coordinator_pending_review ?? 0;
  const prelimApproved = stats?.coordinator_prelim_approved ?? 0;
  const openBatches = stats?.coordinator_open_batches ?? 0;
  const needsEdit = stats?.coordinator_needs_edit ?? 0;
  const rejectedRequests = stats?.coordinator_rejected ?? 0;
  const sentToEducation = stats?.sent_to_education ?? 0;
  const approvedByBody = stats?.approved_by_governing_body ?? 0;
  const rejectedByBody = stats?.rejected_by_governing_body ?? 0;

  return {
    loading,
    error,
    stats,
    recentRequests,
    recentBatches,
    reload: load,
    pendingReview,
    prelimApproved,
    openBatches,
    needsEdit,
    rejectedRequests,
    sentToEducation,
    approvedByBody,
    rejectedByBody,
  };
}
