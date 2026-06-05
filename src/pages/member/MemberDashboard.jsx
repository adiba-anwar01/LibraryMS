import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import SearchBooks from "../../components/member/SearchBooks";
import MyIssuedBooks from "../../components/member/MyIssuedBooks";
import FineView from "../../components/member/FineView";

const TABS = ["Search Books", "My Books", "My Fines"];

export default function MemberDashboard() {
  const [tab, setTab] = useState("Search Books");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchSettings() {
      const snap = await getDoc(doc(db, "settings", "library_settings"));
      if (snap.exists()) {
        setSettings(snap.data());
      }
    }
    fetchSettings();
  }, []);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h1>Member Dashboard</h1>
          <p>Browse, issue, and return books from the library</p>
        </div>

        {settings && (
          <div className="alert alert-info" style={{ marginBottom: "1.5rem" }}>
            <strong>Library Rules:</strong> Books must be returned within <strong>{settings.returnDurationDays} days</strong>. 
            A fine of <strong>₹{settings.finePerDay} per day</strong> will be applied for late returns.
          </div>
        )}

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "Search Books" ? "🔍 " : t === "My Books" ? "📖 " : "💰 "}{t}
            </button>
          ))}
        </div>

        {tab === "Search Books" && <SearchBooks />}
        {tab === "My Books" && <MyIssuedBooks />}
        {tab === "My Fines" && <FineView />}
      </div>
    </>
  );
}
