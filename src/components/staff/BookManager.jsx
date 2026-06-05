import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";

export default function BookManager() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", genre: "", totalCopies: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");

  async function fetchBooks() {
    const q = query(collection(db, "books"), orderBy("addedAt", "desc"));
    const snap = await getDocs(q);
    setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchBooks(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await addDoc(collection(db, "books"), {
        ...form,
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(form.totalCopies),
        addedAt: serverTimestamp(),
      });
      setMsg({ type: "success", text: `"${form.title}" added.` });
      setForm({ title: "", author: "", isbn: "", genre: "", totalCopies: 1 });
      fetchBooks();
    } catch {
      setMsg({ type: "error", text: "Failed to add book." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await deleteDoc(doc(db, "books", id));
    setMsg({ type: "success", text: `"${title}" deleted.` });
    fetchBooks();
  }

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="card-title">➕ Add New Book</div>
        {msg && (
          <div className={`alert alert-${msg.type === "success" ? "success" : "error"}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="bookTitle">Title</label>
              <input id="bookTitle" type="text" placeholder="Book title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="bookAuthor">Author</label>
              <input id="bookAuthor" type="text" placeholder="Author name" value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="bookIsbn">ISBN</label>
              <input id="bookIsbn" type="text" placeholder="ISBN number" value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="bookGenre">Genre</label>
              <input id="bookGenre" type="text" placeholder="e.g. Fiction" value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="bookCopies">Total Copies</label>
              <input id="bookCopies" type="number" min="1" value={form.totalCopies}
                onChange={(e) => setForm({ ...form, totalCopies: e.target.value })} required />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add Book"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">📚 Book Catalogue</div>
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <p className="text-muted">Loading books…</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No books found.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>ISBN</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.title}</strong></td>
                    <td className="text-muted">{b.author}</td>
                    <td><span className="badge badge-info">{b.genre || "—"}</span></td>
                    <td className="text-sm">{b.isbn || "—"}</td>
                    <td>
                      <span className={`badge ${b.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                        {b.availableCopies}/{b.totalCopies}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id, b.title)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
