export const WORKFLOW_STEPS = [
  { key: "draft", label: "مسودة", order: 0 },
  { key: "sent_to_coordinator", label: "مرسل للمنسق", order: 1 },
  { key: "coordinator_under_review", label: "قيد مراجعة المنسق", order: 2 },
  { key: "needs_edit", label: "بحاجة تعديل", order: 2.5 },
  { key: "coordinator_rejected", label: "مرفوض من المنسق", order: 2.9 },
  { key: "prelim_approved", label: "معتمد مبدئيًا", order: 3 },
  { key: "batched_pending_send", label: "مجمّع بانتظار الإرسال", order: 4 },
  {
    key: "sent_to_directorate",
    label: "مرسل للمديرية",
    order: 5,
    governingBody: "directorate_of_education",
  },
  {
    key: "directorate_approved",
    label: "موافقة المديرية",
    order: 6,
    governingBody: "directorate_of_education",
  },
  {
    key: "directorate_rejected",
    label: "مرفوض من المديرية",
    order: 6.1,
    governingBody: "directorate_of_education",
  },
  { key: "sent_to_school", label: "مرسل للمدرسة/المركز", order: 7 },
  { key: "school_approved", label: "موافقة المدرسة/المركز", order: 8 },
  { key: "school_rejected", label: "مرفوض من المدرسة/المركز", order: 8.1 },
  { key: "delivered", label: "تم التسليم", order: 9 },
  { key: "approved", label: "معتمد نهائيًا", order: 10 },
];

export const INCOMING_STATUSES = [
  "sent_to_coordinator",
  "coordinator_under_review",
  "needs_edit",
];

export const COORDINATOR_DECISIONS = [
  { value: "prelim_approved", label: "اعتماد مبدئي", variant: "primary" },
  { value: "rejected", label: "رفض", variant: "danger" },
];

export function getWorkflowStepIndex(status) {
  const step = WORKFLOW_STEPS.find((s) => s.key === status);
  return step ? step.order : -1;
}

export function getActiveWorkflowSteps(governingBody) {
  if (!governingBody) return WORKFLOW_STEPS.filter((s) => !s.governingBody);
  return WORKFLOW_STEPS.filter(
    (s) => !s.governingBody || s.governingBody === governingBody
  );
}
