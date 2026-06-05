import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function getProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  async function login(email, password) {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getProfile(user.uid);
    if (profile?.isActive === false) {
      await signOut(auth);
      throw new Error("Your account has been deactivated. Contact admin.");
    }
    return profile;
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUserProfile(user ? await getProfile(user.uid) : null);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
