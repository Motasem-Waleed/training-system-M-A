import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "../config/coordinator/statusLabels";

const DEFAULT_STATUS_META = {
  key: "",
  label: "غير محدد",
  className: "badge-soft",
  colors: { bg: "#e9ecef", text: "#495057" },
};

const TRAINING_REQUEST_BADGE_CLASS = {
  draft: "badge-info",
  sent_to_coordinator: "badge-primary",
  coordinator_under_review: "badge-primary",
  needs_edit: "badge-warning",
  coordinator_rejected: "badge-danger",
  prelim_approved: "badge-success",
  batched_pending_send: "badge-info",
  sent_to_directorate: "badge-info",
  directorate_approved: "badge-success",
  directorate_rejected: "badge-danger",
  sent_to_school: "badge-info",
  school_approved: "badge-success",
  school_rejected: "badge-danger",
  sent_to_health_ministry: "badge-info",
  health_ministry_approved: "badge-success",
  health_ministry_rejected: "badge-danger",
  delivered: "badge-success",
  approved: "badge-success",
  rejected: "badge-danger",
};

const TASK_DONE_STATUSES = new Set(["submitted", "graded"]);
const STUDENT_APPROVED_STATUSES = new Set(["approved"]);

export function getTrainingRequestStatusMeta(status, fallbackLabel = "") {
  const key = String(status || "").trim();

  if (!key) {
    return {
      ...DEFAULT_STATUS_META,
      label: fallbackLabel || DEFAULT_STATUS_META.label,
    };
  }

  return {
    key,
    label: fallbackLabel || STATUS_LABELS[key] || key,
    className: TRAINING_REQUEST_BADGE_CLASS[key] || "badge-soft",
    colors: STATUS_COLORS[key] || DEFAULT_STATUS_META.colors,
  };
}

export function isTrainingRequestEditable(status) {
  return ["needs_edit", "rejected", "coordinator_rejected"].includes(status);
}

export function isTrainingRequestCancelable(status) {
  return [
    "draft",
    "sent_to_coordinator",
    "coordinator_under_review",
    "needs_edit",
  ].includes(status);
}

export function isTaskPending(status) {
  return !TASK_DONE_STATUSES.has(String(status || "").trim());
}

export function isStudentApproved(status) {
  return STUDENT_APPROVED_STATUSES.has(String(status || "").trim());
}
