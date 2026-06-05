import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection, getDocs, addDoc, updateDoc,
  doc, getDoc, serverTimestamp, query, where,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function SearchBooks() {
  const { currentUser, userProfile } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);
  const [issuing, setIssuing] = useState(null);

  async function fetchBooks() {
    const snap = await getDocs(collection(db, "books"));
    setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchBooks(); }, []);

  async function issueBook(book) {
    setIssuing(book.id);
    setMsg(null);
    try {
      const existing = await getDocs(
        query(
          collection(db, "issuedBooks"),
          where("memberId", "==", currentUser.uid),
          where("bookId", "==", book.id)
        )
      );
      const isAlreadyIssuedOrPending = existing.docs.some(d => ["issued", "pending"].includes(d.data().status));
      if (isAlreadyIssuedOrPending) {
        setMsg({ type: "error", text: "You have already requested or issued this book." });
        return;
      }

      await addDoc(collection(db, "issuedBooks"), {
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        memberId: currentUser.uid,
        memberName: userProfile.name,
        memberEmail: userProfile.email,
        requestedAt: serverTimestamp(),
        issuedAt: null,
        returnDueDate: null,
        returnedAt: null,
        status: "pending",
        fine: 0,
      });

      setMsg({ type: "success", text: `"${book.title}" requested! Waiting for staff approval.` });
      fetchBooks();
    } catch (err) {
      setMsg({ type: "error", text: "Failed to issue: " + err.message });
    } finally {
      setIssuing(null);
    }
  }

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.genre || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-title">Search Books</div>
      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"}`}>
          {msg.text}
        </div>
      )}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search by title, author, or genre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <p className="text-muted">Loading books…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No books match your search.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.title}</strong></td>
                  <td className="text-muted">{b.author}</td>
                  <td><span className="badge badge-info">{b.genre || "—"}</span></td>
                  <td>
                    <span className={`badge ${b.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                      {b.availableCopies > 0 ? `${b.availableCopies} available` : "Not available"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={b.availableCopies === 0 || issuing === b.id}
                      onClick={() => issueBook(b)}
                    >
                      {issuing === b.id ? "…" : "Request"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
