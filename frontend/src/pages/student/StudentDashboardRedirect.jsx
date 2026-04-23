import { Navigate } from "react-router-dom";
import { getStudentDashboardPath } from "../../utils/studentSection";
import { readStoredUser } from "../../utils/session";

export default function StudentDashboardRedirect() {
  const user = readStoredUser();
  return <Navigate to={getStudentDashboardPath(user)} replace />;
}
