import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection, getDocs, updateDoc, doc,
  getDoc, query, where, orderBy,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function MyIssuedBooks() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [msg, setMsg] = useState(null);

  async function fetchRecords() {
    const q = query(
      collection(db, "issuedBooks"),
      where("memberId", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    const unsorted = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    unsorted.sort((a, b) => {
      const timeA = a.issuedAt?.toMillis ? a.issuedAt.toMillis() : (a.requestedAt?.toMillis ? a.requestedAt.toMillis() : (a.issuedAt?.seconds ? a.issuedAt.seconds * 1000 : 0));
      const timeB = b.issuedAt?.toMillis ? b.issuedAt.toMillis() : (b.requestedAt?.toMillis ? b.requestedAt.toMillis() : (b.issuedAt?.seconds ? b.issuedAt.seconds * 1000 : 0));
      return timeB - timeA;
    });
    setRecords(unsorted);
    setLoading(false);
  }

  useEffect(() => { fetchRecords(); }, []);

  function getStatus(r) {
    if (r.status === "pending") return "pending";
    if (r.status === "return_pending") return "return_pending";
    if (r.status === "returned") return "returned";
    const due = r.returnDueDate?.toDate ? r.returnDueDate.toDate() : (r.returnDueDate ? new Date(r.returnDueDate) : null);
    if (!due) return "issued";
    return new Date() > due ? "overdue" : "issued";
  }

  async function returnBook(record) {
    setReturning(record.id);
    setMsg(null);
    try {
      const settSnap = await getDoc(doc(db, "settings", "library_settings"));
      const finePerDay = settSnap.exists() ? settSnap.data().finePerDay : 5;

      const now = new Date();
      const due = record.returnDueDate?.toDate
        ? record.returnDueDate.toDate()
        : new Date(record.returnDueDate);

      const fine = now > due
        ? Math.ceil((now - due) / (1000 * 60 * 60 * 24)) * finePerDay
        : 0;

      await updateDoc(doc(db, "issuedBooks", record.id), {
        status: "return_pending",
        fine,
      });

      setMsg({
        type: "success",
        text: fine > 0
          ? `Return requested. Fine: ₹${fine}. Waiting for staff approval.`
          : `Return requested. Waiting for staff approval.`,
      });
      fetchRecords();
    } catch (err) {
      setMsg({ type: "error", text: "Return failed: " + err.message });
    } finally {
      setReturning(null);
    }
  }

  const badgeClass = { returned: "badge-success", overdue: "badge-danger", issued: "badge-info", pending: "badge-warning" };

  return (
    <div className="card">
      <div className="card-title">📖 My Issued Books</div>
      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"}`}>
          {msg.text}
        </div>
      )}
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>You have no issued books.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Author</th>
                <th>Issued On</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Fine</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const status = getStatus(r);
                const due = r.returnDueDate?.toDate ? r.returnDueDate.toDate() : (r.returnDueDate ? new Date(r.returnDueDate) : null);
                const issuedAt = r.issuedAt?.toDate ? r.issuedAt.toDate() : (r.issuedAt ? new Date(r.issuedAt) : null);
                const requestedAt = r.requestedAt?.toDate ? r.requestedAt.toDate() : (r.requestedAt ? new Date(r.requestedAt) : null);
                const displayDate = issuedAt || requestedAt;
                return (
                  <tr key={r.id}>
                    <td><strong>{r.bookTitle}</strong></td>
                    <td className="text-muted">{r.bookAuthor}</td>
                    <td className="text-sm">{displayDate ? displayDate.toLocaleDateString() : "—"}</td>
                    <td className={status === "overdue" ? "text-danger" : "text-sm"}>
                      {due ? due.toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass[status]}`}>{status}</span>
                    </td>
                    <td>
                      {r.fine > 0
                        ? <span className="text-danger">₹{r.fine}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {status !== "returned" && status !== "pending" && status !== "return_pending" && (
                        <button
                          className="btn btn-sm btn-accent"
                          onClick={() => returnBook(r)}
                          disabled={returning === r.id}
                        >
                          {returning === r.id ? "…" : "Return"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
