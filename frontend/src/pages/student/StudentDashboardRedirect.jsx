import { Navigate } from "react-router-dom";
import { getStudentDashboardPath } from "../../utils/studentSection";

export default function StudentDashboardRedirect() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return <Navigate to={getStudentDashboardPath(user)} replace />;
}
