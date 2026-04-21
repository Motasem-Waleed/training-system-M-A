export const getStudentTrack = (user) => {
  if (!user) return null;
  const roleName = user?.role?.name || user?.role;
  if (roleName !== "student") return null;

  const track = user?.current_section?.track;
  if (track === "education" || track === "psychology") return track;
  return null;
};

export const getStudentDashboardPath = (user) => {
  const track = getStudentTrack(user);
  if (track === "psychology") return "/student/dashboard/psychology";
  return "/student/dashboard/education";
};
