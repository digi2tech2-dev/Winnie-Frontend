import { Navigate, useLocation } from "react-router-dom";
import { PageSkeleton } from "../Skeletons";
import { useAuth } from "../../context/AuthContext";
import { canAccessRole, getDefaultRouteForRole } from "../../utils/authRoles";

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const intendedPath = `${location.pathname}${location.search}${location.hash}`;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: intendedPath }} />;
  }

  if (role && !canAccessRole(user?.role, role)) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  return children;
}
