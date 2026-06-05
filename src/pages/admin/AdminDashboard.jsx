import { useState } from "react";
import Navbar from "../../components/Navbar";
import SettingsPanel from "../../components/admin/SettingsPanel";
import StaffManagement from "../../components/admin/StaffManagement";

const TABS = ["Settings", "Staff Management"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("Settings");

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">   
          <h1>Admin Dashboard</h1>
          <p>Manage library settings and staff accounts</p>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "Settings" ? "⚙️ " : "👥 "}{t}
            </button>
          ))}
        </div>

        {tab === "Settings" && <SettingsPanel />}
        {tab === "Staff Management" && <StaffManagement />}
      </div>
    </>
  );
}
