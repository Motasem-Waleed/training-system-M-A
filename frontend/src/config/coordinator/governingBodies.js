export const GOVERNING_BODIES = [
  {
    value: "directorate_of_education",
    label: "مديرية التربية والتعليم",
    shortLabel: "التربية",
    targetStatus: "sent_to_directorate",
    approvalStatus: "directorate_approved",
    rejectionStatus: "directorate_rejected",
  },
];

export const DIRECTORATES = [
  { value: "", label: "الكل / غير محدد" },
  { value: "وسط", label: "وسط" },
  { value: "شمال", label: "شمال" },
  { value: "جنوب", label: "جنوب" },
  { value: "يطا", label: "يطا" },
  { value: "دورا", label: "دورا" },
  { value: "حلحول", label: "حلحول" },
];

export function getGoverningBodyLabel(value) {
  const body = GOVERNING_BODIES.find((b) => b.value === value);
  return body ? body.label : value;
}

export function getGoverningBodyShortLabel(value) {
  const body = GOVERNING_BODIES.find((b) => b.value === value);
  return body ? body.shortLabel : value;
}
