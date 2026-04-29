const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();

const getUserValue = (user, key) => user?.[key] ?? user?.data?.[key];

export const getStudentTrack = (user) => {
  if (!user) return null;
  const roleName = getUserValue(user, "role")?.name || getUserValue(user, "role");
  if (roleName !== "student") return null;

  const currentSection = getUserValue(user, "current_section") || {};
  const track = currentSection.track;
  if (track === "education" || track === "psychology") return track;

  const departmentName = normalizeText(getUserValue(user, "department")?.name);
  const courseName = normalizeText(currentSection.course_name);
  const courseCode = normalizeText(currentSection.course_code);
  const specialization = normalizeText(getUserValue(user, "specialization") || getUserValue(user, "major"));
  const source = `${departmentName} ${courseName} ${courseCode} ${specialization}`;

  if (source.includes("psych") || source.includes("psyc") || source.includes("نفس")) {
    return "psychology";
  }

  if (
    source.includes("usool") ||
    source.includes("tarb") ||
    source.includes("educ") ||
    source.includes("اصول") ||
    source.includes("تربي")
  ) {
    return "education";
  }

  return null;
};

export const getStudentDashboardPath = (user) => {
  const track = getStudentTrack(user);
  if (track === "psychology") return "/student/dashboard/psychology";
  return "/student/dashboard/education";
};
