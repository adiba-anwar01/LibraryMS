import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function FineView() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFines() {
      const q = query(
        collection(db, "issuedBooks"),
        where("memberId", "==", currentUser.uid)
      );
      const snap = await getDocs(q);
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchFines();
  }, []);

  const fineRecords = records.filter((r) => r.fine > 0);
  const totalFine = fineRecords.reduce((sum, r) => sum + r.fine, 0);

  return (
    <div className="stack">
      <div className="card">
        <div className="fine-summary">
          <p className="fine-label">Total Outstanding Fine</p>
          <div className={`fine-total ${totalFine === 0 ? "fine-zero" : ""}`}>
            ₹{totalFine.toFixed(2)}
          </div>
          {totalFine === 0 && (
            <p className="fine-note"> No fines! Great job returning books on time.</p>
          )}
        </div>
      </div>

      {!loading && fineRecords.length > 0 && (
        <div className="card">
          <div className="card-title"> Fine Breakdown</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Issued On</th>
                  <th>Due Date</th>
                  <th>Returned On</th>
                  <th>Fine (₹)</th>
                </tr>
              </thead>
              <tbody>
                {fineRecords.map((r) => {
                  const due = r.returnDueDate?.toDate ? r.returnDueDate.toDate() : new Date(r.returnDueDate);
                  const issuedAt = r.issuedAt?.toDate ? r.issuedAt.toDate() : new Date(r.issuedAt);
                  const returnedAt = r.returnedAt?.toDate ? r.returnedAt.toDate() : new Date(r.returnedAt);
                  return (
                    <tr key={r.id}>
                      <td><strong>{r.bookTitle}</strong></td>
                      <td className="text-sm">{issuedAt.toLocaleDateString()}</td>
                      <td className="text-sm">{due.toLocaleDateString()}</td>
                      <td className="text-sm">{returnedAt.toLocaleDateString()}</td>
                      <td className="text-danger">₹{r.fine}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && fineRecords.length === 0 && (
        <div className="empty-state">
          <p>No fine charges on record.</p>
        </div>
      )}
    </div>
  );
}
