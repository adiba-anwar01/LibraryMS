import { useState } from "react";
import Navbar from "../../components/Navbar";
import BookManager from "../../components/staff/BookManager";
import IssueBook from "../../components/staff/IssueBook";
import IssuedBooksTable from "../../components/staff/IssuedBooksTable";

const TABS = ["Books", "Issue Book", "Issued Records"];

export default function StaffDashboard() {
  const [tab, setTab] = useState("Books");

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h1>Staff Dashboard</h1>
          <p>Manage books, issue to members, and track records</p>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "Books" ? "📚 " : t === "Issue Book" ? "📤 " : "📋 "}{t}
            </button>
          ))}
        </div>

        {tab === "Books" && <BookManager />}
        {tab === "Issue Book" && <IssueBook />}
        {tab === "Issued Records" && <IssuedBooksTable />}
      </div>
    </>
  );
}
