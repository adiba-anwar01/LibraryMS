import { useState, useEffect } from "react";
import { db, firebaseConfig } from "../../firebase";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection, query, where, getDocs,
  doc, setDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchStaff() {
    const q = query(collection(db, "users"), where("role", "==", "staff"));
    const snap = await getDocs(q);
    setStaffList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchStaff(); }, []);

  async function addStaff(e) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);

      await secondaryAuth.signOut();
      await setDoc(doc(db, "users", cred.user.uid), {
        name: form.name,
        email: form.email,
        role: "staff",
        isActive: true,
        createdAt: serverTimestamp(),
      });
      setMsg({ type: "success", text: `Staff "${form.name}" added.` });
      setForm({ name: "", email: "", password: "" });
      fetchStaff();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(staff) {
    await updateDoc(doc(db, "users", staff.id), { isActive: !staff.isActive });
    setMsg({ type: "success", text: `Staff "${staff.name}" ${staff.isActive ? "deactivated" : "activated"}.` });
    fetchStaff();
  }

  async function saveEdit(id) {
    await updateDoc(doc(db, "users", id), { name: editName });
    setEditId(null);
    setEditName("");
    fetchStaff();
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="card-title">➕ Add Staff Member</div>
        {msg && (
          <div className={`alert alert-${msg.type === "success" ? "success" : "error"}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={addStaff}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="staffName">Full Name</label>
              <input
                id="staffName"
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="staffEmail">Email Address</label>
              <input
                id="staffEmail"
                type="email"
                placeholder="staff@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="staffPassword">Temporary Password</label>
              <input
                id="staffPassword"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add Staff"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">👥 Staff Accounts</div>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : staffList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p>No staff accounts yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {editId === s.id ? (
                        <input
                          className="inline-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        s.name
                      )}
                    </td>
                    <td className="text-muted">{s.email}</td>
                    <td>
                      <span className={`badge ${s.isActive ? "badge-success" : "badge-danger"}`}>
                        {s.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        {editId === s.id ? (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => saveEdit(s.id)}>Save</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditId(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => { setEditId(s.id); setEditName(s.name); }}
                            >
                              Edit
                            </button>
                            <button
                              className={`btn btn-sm ${s.isActive ? "btn-danger" : "btn-success"}`}
                              onClick={() => toggleActive(s)}
                            >
                              {s.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </>
                        )}
                      </div>
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
