import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";

export default function IssuedBooksTable() {
  const [issued, setIssued] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [approving, setApproving] = useState(null);

  async function fetchIssued() {

    const q = query(collection(db, "issuedBooks"));
    const snap = await getDocs(q);
    const unsorted = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    unsorted.sort((a, b) => {
      const timeA = a.issuedAt?.toMillis ? a.issuedAt.toMillis() : (a.requestedAt?.toMillis ? a.requestedAt.toMillis() : (a.issuedAt?.seconds ? a.issuedAt.seconds * 1000 : 0));
      const timeB = b.issuedAt?.toMillis ? b.issuedAt.toMillis() : (b.requestedAt?.toMillis ? b.requestedAt.toMillis() : (b.issuedAt?.seconds ? b.issuedAt.seconds * 1000 : 0));
      return timeB - timeA;
    });
    setIssued(unsorted);
    setLoading(false);
  }

  useEffect(() => {
    fetchIssued();
  }, []);

  function getStatus(record) {
    if (record.status === "pending") return "pending";
    if (record.status === "return_pending") return "return_pending";
    if (record.status === "returned") return "returned";
    const due = record.returnDueDate?.toDate ? record.returnDueDate.toDate() : (record.returnDueDate ? new Date(record.returnDueDate) : null);
    if (!due) return "issued";
    return new Date() > due ? "overdue" : "issued";
  }

  async function approveRequest(record) {
    setApproving(record.id);
    try {
      const settSnap = await getDoc(doc(db, "settings", "library_settings"));
      const returnDays = settSnap.exists() ? settSnap.data().returnDurationDays : 14;
      const now = new Date();
      const dueDate = new Date(now.getTime() + returnDays * 24 * 60 * 60 * 1000);

      const bookSnap = await getDoc(doc(db, "books", record.bookId));
      if (!bookSnap.exists()) throw new Error("Book not found.");
      if (bookSnap.data().availableCopies <= 0) throw new Error("No copies available!");

      await updateDoc(doc(db, "books", record.bookId), {
        availableCopies: bookSnap.data().availableCopies - 1,
      });

      await updateDoc(doc(db, "issuedBooks", record.id), {
        status: "issued",
        issuedAt: now,
        returnDueDate: dueDate
      });
      fetchIssued();
    } catch (err) {
      alert("Failed to approve: " + err.message);
    } finally {
      setApproving(null);
    }
  }

  async function approveReturn(record) {
    setApproving(record.id);
    try {
      const bookSnap = await getDoc(doc(db, "books", record.bookId));
      if (bookSnap.exists()) {
        await updateDoc(doc(db, "books", record.bookId), {
          availableCopies: bookSnap.data().availableCopies + 1,
        });
      }

      await updateDoc(doc(db, "issuedBooks", record.id), {
        status: "returned",
        returnedAt: new Date()
      });
      fetchIssued();
    } catch (err) {
      alert("Failed to approve return: " + err.message);
    } finally {
      setApproving(null);
    }
  }

  const filtered = filter === "all" ? issued : issued.filter((r) => getStatus(r) === filter);

  const badgeClass = { returned: "badge-success", overdue: "badge-danger", issued: "badge-info", pending: "badge-warning", return_pending: "badge-warning" };

  return (
    <div className="card">
      <div className="card-title">All Issued Books</div>
      <div className="filter-bar">
        {["all", "pending", "issued", "overdue", "return_pending", "returned"].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(f)}
          >
            {f.replace("_", " ").toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No records found.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Issued</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Fine (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const status = getStatus(r);
                const due = r.returnDueDate?.toDate ? r.returnDueDate.toDate() : (r.returnDueDate ? new Date(r.returnDueDate) : null);
                const issuedAt = r.issuedAt?.toDate ? r.issuedAt.toDate() : (r.issuedAt ? new Date(r.issuedAt) : null);
                const requestedAt = r.requestedAt?.toDate ? r.requestedAt.toDate() : (r.requestedAt ? new Date(r.requestedAt) : null);
                const displayDate = issuedAt || requestedAt;
                return (
                  <tr key={r.id}>
                    <td><strong>{r.bookTitle}</strong></td>
                    <td>
                      <div>{r.memberName}</div>
                      <div className="text-sm">{r.memberEmail}</div>
                    </td>
                    <td className="text-sm">{displayDate ? displayDate.toLocaleDateString() : "—"}</td>
                    <td className="text-sm">{due ? due.toLocaleDateString() : "—"}</td>
                    <td>
                      <span className={`badge ${badgeClass[status]}`}>{status}</span>
                    </td>
                    <td>
                      {r.fine > 0 ? <span className="text-danger">₹{r.fine}</span> : "—"}
                    </td>
                    <td>
                      {status === "pending" && (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => approveRequest(r)}
                          disabled={approving === r.id}
                        >
                          {approving === r.id ? "…" : "Approve Issue"}
                        </button>
                      )}
                      {status === "return_pending" && (
                        <button 
                          className="btn btn-sm btn-accent"
                          onClick={() => approveReturn(r)}
                          disabled={approving === r.id}
                        >
                          {approving === r.id ? "…" : "Approve Return"}
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
