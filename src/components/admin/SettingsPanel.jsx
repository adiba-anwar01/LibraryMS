import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SettingsPanel() {
  const [finePerDay, setFinePerDay] = useState("");
  const [returnDays, setReturnDays] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "settings", "library_settings"));
      if (snap.exists()) {
        setFinePerDay(snap.data().finePerDay);
        setReturnDays(snap.data().returnDurationDays);
      } else {
        setFinePerDay(5);
        setReturnDays(14);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await setDoc(doc(db, "settings", "library_settings"), {
        finePerDay: Number(finePerDay),
        returnDurationDays: Number(returnDays),
      });
      setMsg({ type: "success", text: "Settings saved successfully." });
    } catch {
      setMsg({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Loading settings…</p>;

  return (
    <div className="card">
      <div className="card-title">⚙️ Library Settings</div>
      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"}`}>
          {msg.text}
        </div>
      )}
      <form onSubmit={handleSave}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="finePerDay">Fine Per Day (₹)</label>
            <input
              id="finePerDay"
              type="number"
              min="0"
              step="0.5"
              value={finePerDay}
              onChange={(e) => setFinePerDay(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="returnDays">Return Duration (days)</label>
            <input
              id="returnDays"
              type="number"
              min="1"
              value={returnDays}
              onChange={(e) => setReturnDays(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
