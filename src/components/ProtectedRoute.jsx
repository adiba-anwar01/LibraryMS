import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRole }) {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) return <Navigate to="/" replace />;
  if (userProfile && userProfile.role !== allowedRole) {
    const roleMap = { admin: "/admin", staff: "/staff", member: "/member" };
    return <Navigate to={roleMap[userProfile.role] || "/"} replace />;
  }
  return children;
}
