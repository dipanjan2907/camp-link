"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { AlertCircle } from "lucide-react";

function SignInWithGoogle() {
  const router = useRouter();
  const [btnText, setBtnText] = useState("Continue with Google");
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setBtnText("Signing In...");
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      await setPersistence(auth, browserSessionPersistence); // Enable tab-specific session
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let role = "student";

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        role = data.role || "student";

        // Update profile info but preserve role
        await updateDoc(userDocRef, {
          fname: user.displayName,
          email: user.email,
          photo: user.photoURL,
        });

        // Use the existing role (handle missing role caseByKey defaulting to student)
        if (!data.role) {
          // If role was missing in DB, save it now
          await setDoc(userDocRef, { role: "student" }, { merge: true });
        }
      } else {
        // User not found in database - RESTRICT ACCESS
        await auth.signOut();
        setError("Account not found. Please contact an administrator.");
        setBtnText("Continue with Google");
        return;
      }

      // Redirect based on role
      if (role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/student");
      }
    } catch (err) {
      console.error("Google Sign In Error:", err);
      setError(err.message.replace("Firebase: ", ""));
      setBtnText("Continue with Google");
    }
  };

  return (
    <>
      <p className="block text-sm font-medium text-slate-400 mb-1 text-center mt-3">
        -- OR --
      </p>

      {error && (
        <div className="flex items-center gap-2 p-2 mb-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 border border-slate-600 rounded-xl py-3 mt-3 hover:bg-slate-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
      >
        <Image
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google Logo"
          width={20}
          height={20}
        />
        <span className="text-slate-200 text-sm tracking-wide">{btnText}</span>
      </button>
    </>
  );
}

export default SignInWithGoogle;
