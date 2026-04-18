import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("access_token");

  if (!user || !token || token === "undefined" || token === "null") {
    return <Navigate to="/" replace />;
  }

  return children;
}