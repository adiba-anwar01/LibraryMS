import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-icon">📚</span>
        <span className="navbar-title">LibraryMS</span>
      </div>
      <div className="navbar-right">
        {userProfile && (
          <>
            <span className="navbar-user">{userProfile.name}</span>
            <span className={`role-badge role-${userProfile.role}`}>
              {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
            </span>
          </>
        )}
        <button className="btn btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
