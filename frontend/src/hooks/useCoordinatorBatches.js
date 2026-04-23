import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getTrainingRequestBatches,
  getTrainingRequests,
  getOfficialLetters,
  itemsFromPagedResponse,
} from "../services/api";

export default function useCoordinatorBatches() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [batches, setBatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [letters, setLetters] = useState([]);

  const [filters, setFilters] = useState({
    governing_body: "",
    directorate: "",
    period: "",
    status: "",
    search: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [batchRes, reqRes, letterRes] = await Promise.all([
        getTrainingRequestBatches({ per_page: 100 }),
        getTrainingRequests({ per_page: 200 }),
        getOfficialLetters({ per_page: 100 }),
      ]);
      setBatches(itemsFromPagedResponse(batchRes));
      setRequests(itemsFromPagedResponse(reqRes));
      setLetters(itemsFromPagedResponse(letterRes));
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تحميل بيانات الدفعات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredBatches = useMemo(() => {
    let list = batches;
    if (filters.governing_body) {
      list = list.filter((b) => b.governing_body === filters.governing_body);
    }
    if (filters.directorate) {
      list = list.filter((b) => b.directorate === filters.directorate);
    }
    if (filters.status) {
      list = list.filter((b) => b.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (b) =>
          String(b.id).includes(q) ||
          (b.letter_number || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [batches, filters]);

  const getBatchRequests = useCallback(
    (batchId) => {
      return requests.filter((r) =>
        r.batch_id === batchId || r.training_request_batch_id === batchId
      );
    },
    [requests]
  );

  const getBatchLetter = useCallback(
    (batchId) => {
      return letters.find(
        (l) => l.batch_id === batchId || l.training_request_batch_id === batchId
      );
    },
    [letters]
  );

  return {
    loading,
    error,
    batches: filteredBatches,
    allBatches: batches,
    requests,
    letters,
    filters,
    setFilters,
    getBatchRequests,
    getBatchLetter,
    reload: load,
  };
}
