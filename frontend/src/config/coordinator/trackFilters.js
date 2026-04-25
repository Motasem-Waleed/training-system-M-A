export const TRACKS = [
  {
    value: "usool_tarbiah_school",
    label: "أصول التربية / التدريب المدرسي",
    shortLabel: "أصول التربية",
    governingBody: "directorate_of_education",
    siteType: "school",
  },
  {
    value: "psychology_school",
    label: "علم النفس / التدريب المدرسي",
    shortLabel: "علم النفس (مدرسي)",
    governingBody: "directorate_of_education",
    siteType: "school",
  },
];

export const SITE_TYPES = [
  { value: "school", label: "مدرسة" },
  { value: "health_center", label: "مركز نفسي" },
  { value: "clinic", label: "عيادة" },
  { value: "community_center", label: "مركز مجتمعي" },
];

export function getTrackLabel(value) {
  const track = TRACKS.find((t) => t.value === value);
  return track ? track.label : value;
}

export function getSiteTypeLabel(value) {
  const site = SITE_TYPES.find((s) => s.value === value);
  return site ? site.label : value;
}
