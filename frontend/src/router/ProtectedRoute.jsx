import { Navigate } from "react-router-dom";
import { readStoredToken, readStoredUser } from "../utils/session";

export default function ProtectedRoute({ children }) {
  const user = readStoredUser();
  const token = readStoredToken();

  if (!user?.id || !token || token === "undefined" || token === "null") {
    return <Navigate to="/" replace />;
  }

  return children;
}
