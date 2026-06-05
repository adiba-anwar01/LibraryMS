import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection, getDocs, addDoc, updateDoc,
  doc, query, where, serverTimestamp, getDoc,
} from "firebase/firestore";

export default function IssueBook() {
  const [memberEmail, setMemberEmail] = useState("");
  const [memberData, setMemberData] = useState(null);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchingMember, setSearchingMember] = useState(false);

  async function fetchAvailableBooks() {
    const snap = await getDocs(collection(db, "books"));
    setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((b) => b.availableCopies > 0));
  }

  useEffect(() => { fetchAvailableBooks(); }, []);

  async function findMember() {
    if (!memberEmail.trim()) return;
    setSearchingMember(true);
    setMemberData(null);
    setMsg(null);
    const q = query(
      collection(db, "users"),
      where("email", "==", memberEmail.trim()),
      where("role", "==", "member")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      setMsg({ type: "error", text: "No member found with that email." });
    } else {
      setMemberData({ id: snap.docs[0].id, ...snap.docs[0].data() });
    }
    setSearchingMember(false);
  }

  async function handleIssue(e) {
    e.preventDefault();
    if (!memberData) return setMsg({ type: "error", text: "Find a member first." });
    if (!selectedBook) return setMsg({ type: "error", text: "Select a book." });

    setSubmitting(true);
    setMsg(null);
    try {
      const settSnap = await getDoc(doc(db, "settings", "library_settings"));
      const returnDays = settSnap.exists() ? settSnap.data().returnDurationDays : 14;

      const now = new Date();
      const dueDate = new Date(now.getTime() + returnDays * 24 * 60 * 60 * 1000);
      const book = books.find((b) => b.id === selectedBook);

      await addDoc(collection(db, "issuedBooks"), {
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        memberId: memberData.id,
        memberName: memberData.name,
        memberEmail: memberData.email,
        issuedAt: serverTimestamp(),
        returnDueDate: dueDate,
        returnedAt: null,
        status: "issued",
        fine: 0,
      });

      await updateDoc(doc(db, "books", book.id), {
        availableCopies: book.availableCopies - 1,
      });

      setMsg({ type: "success", text: `"${book.title}" issued to ${memberData.name}. Due: ${dueDate.toLocaleDateString()}.` });
      setSelectedBook("");
      setMemberEmail("");
      setMemberData(null);
      fetchAvailableBooks();
    } catch (err) {
      setMsg({ type: "error", text: "Issue failed: " + err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-title">Issue Book to Member</div>
      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"}`}>
          {msg.text}
        </div>
      )}
      <form onSubmit={handleIssue}>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="memberEmailInput">Member Email</label>
          <div className="member-lookup">
            <input
              id="memberEmailInput"
              type="email"
              placeholder="member@email.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
            />
            <button type="button" className="btn btn-outline" onClick={findMember} disabled={searchingMember}>
              {searchingMember ? "…" : "Find"}
            </button>
          </div>
        </div>

        {memberData && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            ✅ Found: <strong>{memberData.name}</strong> ({memberData.email})
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="bookSearchInput">Search Available Books</label>
          <input
            id="bookSearchInput"
            className="search-input"
            placeholder="Search title or author…"
            value={bookSearch}
            onChange={(e) => setBookSearch(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="bookSelect">Select Book</label>
          <select id="bookSelect" value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} required>
            <option value="">-- Choose an available book --</option>
            {filteredBooks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.author} ({b.availableCopies} available)
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={submitting || !memberData}>
            {submitting ? "Issuing…" : "Issue Book"}
          </button>
        </div>
      </form>
    </div>
  );
}
