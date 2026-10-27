import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = sessionStorage.getItem("crowd_access_token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}