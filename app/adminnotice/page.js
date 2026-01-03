"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  Sun,
  Moon,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Megaphone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LayoutDashboard,
  UserCircle,
  Briefcase,
  Users,
} from "lucide-react";

// Constants
const BRANCHES = [
  "CSE Core",
  "CSE AI/ML",
  "CSE Data Science",
  "CSE Cyber Security",
  "IT",
  "BBA-LLB",
  "LLB",
  "Biotech",
  "BCA",
  "M.Tech CSE",
];

const SEMESTERS = Array.from({ length: 10 }, (_, i) => i + 1);

const page = () => {
  const router = useRouter();

  // -- State --
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [notices, setNotices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetSemesters, setTargetSemesters] = useState([]);
  const [targetBranches, setTargetBranches] = useState([]);

  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // -- Effects --

  // Auth & Theme Init
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") setDarkMode(false);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role !== "admin") {
              router.push("/login");
              return;
            }
            setUser(currentUser);
            setUserData(data);
          } else {
            router.push("/login");
            return;
          }
        } catch (error) {
          console.error("Error checking admin role:", error);
          router.push("/login");
          return;
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Real-time Notices Fetch
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const noticesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Handle timestamp conversion safely
          createdAt: doc.data().createdAt?.toDate
            ? doc.data().createdAt.toDate()
            : new Date(),
        }));
        setNotices(noticesData);
      },
      (error) => {
        console.error("Error fetching notices:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // -- Handlers --

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "notices"), {
        title,
        content,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        authorName: user.displayName || "Admin",
        targetSemesters,
        targetBranches,
      });
      setTitle("");
      setContent("");
      setTargetSemesters([]);
      setTargetBranches([]);
    } catch (error) {
      alert("Failed to post notice: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (error) {
      alert("Error deleting: " + error.message);
    }
  };

  const startEditing = (notice) => {
    setEditingId(notice.id);
    setEditTitle(notice.title);
    setEditContent(notice.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  // -- Helpers --
  const toggleTarget = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const saveEdit = async (id) => {
    try {
      const noticeRef = doc(db, "notices", id);
      await updateDoc(noticeRef, {
        title: editTitle,
        content: editContent,
        updatedAt: serverTimestamp(),
      });
      setEditingId(null);
    } catch (error) {
      alert("Error updating: " + error.message);
    }
  };

  // -- Render Helpers --

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <Loader2
          className={`w-10 h-10 animate-spin ${
            darkMode ? "text-amber-500" : "text-amber-600"
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 border-b backdrop-blur-md ${
          darkMode
            ? "bg-slate-900/80 border-slate-800"
            : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Admin<span className="text-amber-500">Notice</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* User Profile - Hidden on mobile, visible on desktop */}
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-700/50">
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {userData?.name ||
                      userData?.fname ||
                      user?.displayName ||
                      "Admin"}
                  </p>
                  <p className="text-xs text-amber-500 font-medium"></p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-6 h-6 text-slate-400" />
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push("/dashboard/admin")}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  darkMode
                    ? "hover:bg-slate-800 text-slate-300 hover:text-white border border-transparent hover:border-slate-700"
                    : "hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all ${
                  darkMode
                    ? "hover:bg-slate-800 text-amber-400"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Create Form */}
        <div
          className={`mb-10 rounded-2xl border p-6 md:p-8 shadow-xl ${
            darkMode
              ? "bg-slate-900 border-slate-800 shadow-indigo-500/5"
              : "bg-white border-slate-200 shadow-slate-200/50"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Plus
              className={`w-6 h-6 ${
                darkMode ? "text-amber-400" : "text-amber-600"
              }`}
            />
            <h2 className="text-2xl font-bold">Post New Notice</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Hackathon Schedule Update"
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-amber-500 ${
                  darkMode
                    ? "bg-slate-950 border-slate-700 text-white placeholder-slate-600 focus:border-amber-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500"
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Write the details here..."
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none focus:ring-2 focus:ring-amber-500 ${
                  darkMode
                    ? "bg-slate-950 border-slate-700 text-white placeholder-slate-600 focus:border-amber-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                }`}
              />
            </div>

            {/* Target Audience Filters */}
            <div className="grid grid-cols-1 gap-6 pt-2">
              <div className="space-y-3">
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  } flex items-center gap-2`}
                >
                  <Briefcase className="w-4 h-4" /> Target Branches (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {BRANCHES.map((branch) => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() =>
                        toggleTarget(targetBranches, setTargetBranches, branch)
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                        targetBranches.includes(branch)
                          ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                          : darkMode
                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          : "bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  } flex items-center gap-2`}
                >
                  <Users className="w-4 h-4" /> Target Semesters (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEMESTERS.map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() =>
                        toggleTarget(targetSemesters, setTargetSemesters, sem)
                      }
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200 border flex items-center justify-center ${
                        targetSemesters.includes(sem)
                          ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                          : darkMode
                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          : "bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !title || !content}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 
                   text-white font-bold py-2 px-6 rounded-lg 
                   transition-transform duration-300 hover:scale-105 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Megaphone className="w-5 h-5" />
                )}
                Publish Notice
              </button>
            </div>
          </form>
        </div>

        {/* Notice List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3
              className={`text-lg font-bold ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              History ({notices.length})
            </h3>
          </div>

          {notices.length === 0 ? (
            <div
              className={`text-center py-20 rounded-2xl border border-dashed ${
                darkMode
                  ? "border-slate-800 bg-slate-900/50"
                  : "border-slate-300 bg-slate-50"
              }`}
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500 font-medium">
                No notices posted yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 hover:border-amber-500/30"
                      : "bg-white border-slate-200 hover:border-amber-200"
                  }`}
                >
                  {/* Decorative Gradient Line */}
                  <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-amber-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {editingId === notice.id ? (
                    // Edit Mode
                    <div className="space-y-4 animate-in fade-in">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border outline-none ${
                          darkMode
                            ? "bg-slate-950 border-slate-700"
                            : "bg-slate-50 border-slate-300"
                        }`}
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border outline-none resize-none ${
                          darkMode
                            ? "bg-slate-950 border-slate-700"
                            : "bg-slate-50 border-slate-300"
                        }`}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(notice.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 transition-all"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                            {notice.createdAt.toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-500">
                            {notice.createdAt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold leading-tight">
                          {notice.title}
                        </h3>

                        {((notice.targetBranches &&
                          notice.targetBranches.length > 0) ||
                          (notice.targetSemesters &&
                            notice.targetSemesters.length > 0)) && (
                          <div className="flex flex-wrap gap-2 mb-2 mt-2">
                            {notice.targetBranches?.map((b) => (
                              <span
                                key={b}
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              >
                                {b}
                              </span>
                            ))}
                            {notice.targetSemesters?.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              >
                                Sem {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <p
                          className={`whitespace-pre-wrap leading-relaxed ${
                            darkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {notice.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(notice)}
                          className="p-2 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default page;
