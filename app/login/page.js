"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ChevronRight, AlertCircle } from "lucide-react";
import SignInWithGoogle from "../SignInWithGoogle";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Logo from "../logo";
const login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [btnText, setbtnText] = useState("Log In");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("All fields are required");
      return;
    }
    try {
      setbtnText("Logging In...");
      setError("");

      await setPersistence(auth, browserSessionPersistence); // Enable tab-specific session

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        let role = userData.role;

        // Role Recovery: if role is missing, default to student and update DB
        if (!role) {
          role = "student";
          await setDoc(docRef, { role: "student" }, { merge: true });
        }

        // Name Recovery: if name is missing, use email username
        if (!userData.name && !userData.fname) {
          await setDoc(
            docRef,
            { fname: user.email.split("@")[0] },
            { merge: true }
          );
        }

        if (role === "admin") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/student");
        }
      } else {
        // User not registered in Firestore
        await auth.signOut();
        setError("Account not registered. Please contact an administrator.");
        setbtnText("Login");
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
      setbtnText("Login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 relative overflow-hidden">
      <Logo />
      <div className="relative w-full max-w-md p-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl">
        <div className="mb-8 text-center">
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-600">
            Login
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="group">
            <label
              className="block text-sm font-medium text-slate-300 mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
              </div>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition duration-200"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <button className="w-full py-3 mt-6 font-bold text-white bg-gradient-to-r from-amber-600 to-rose-600 rounded-lg hover:from-amber-700 hover:to-rose-700 shadow-lg shadow-rose-500/30 transition-all transform hover:scale-[1.02] flex justify-center items-center">
            {btnText} <ChevronRight className="ml-1 w-5 h-5" />
          </button>

          <div className="flex justify-between items-center mt-4"></div>
        </form>
        <SignInWithGoogle />
      </div>
    </div>
  );
};

export default login;
