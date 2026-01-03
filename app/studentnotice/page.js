"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  Sun,
  Moon,
  LogOut,
  Bell,
  Calendar,
  Search,
  UserCircle,
  Loader2,
  Zap,
  LayoutDashboard,
  Filter,
  X,
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

// ... (rest of imports match original until component start)

const StudentNoticePage = () => {
  const router = useRouter();

  // -- State --
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [notices, setNotices] = useState([]);
  const [filterSemester, setFilterSemester] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // -- Effects --

  // Auth & Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") setDarkMode(false);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        // Fetch User Details & Verify Role
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();

            // Strict Role Check
            if (data.role !== "student") {
              router.push("/login");
              return;
            }

            setUser(currentUser);
            setUserData(data);
          } else {
            // No user document found -> Access Denied
            router.push("/login");
            return;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // On error, safer to deny access or just log?
          // Keeping basic behavior: allow logged in user but log error (or strictly redirect).
          // Given user request "IT MUST NOT", strictly blocking might be safer, but if firestore fails temporarily?
          // Let's stick to safe failure: if we can't verify role, we shouldn't show restricted content?
          // But usually we just log. Let's redirect on explicitly WRONG role, but handle error gracefully?
          // Actually, if fetching fails, "user" isn't set, so loading spinner forever?
          // Better to set loading false in finally.
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch Notices
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const noticesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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
    router.push("/login"); // Fixed: User requested redirect to respective page (login)
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <Loader2
          className={`w-12 h-12 animate-spin ${
            darkMode ? "text-amber-400" : "text-amber-600"
          }`}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          darkMode
            ? "bg-slate-950 text-slate-100"
            : "bg-slate-50 text-slate-900"
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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                  <Bell className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                  Campus
                  <span className={darkMode ? "text-white" : "text-slate-800"}>
                    Feed
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Dashboard Button (Desktop/Tablet) */}
                <button
                  onClick={() => router.push("/dashboard/student")}
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

                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-700/50">
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {userData?.name ||
                        userData?.fname ||
                        user?.displayName ||
                        "Student"}
                    </p>
                    <p className="text-xs text-amber-500 font-medium">
                      {userData?.branch || "General"}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
                    {userData?.photo || user?.photoURL ? (
                      <img
                        src={userData?.photo || user?.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* Logout Button (Desktop) */}
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Controls */}
                <div className="flex md:hidden items-center gap-2">
                  <button
                    onClick={() => router.push("/dashboard/student")}
                    className="p-2 text-slate-400 hover:text-white"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-24 pb-12 max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header Section */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
              <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
              Latest Updates
            </h1>
            <p
              className={`text-sm ${
                darkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Stay informed with the latest announcements from the
              administration.
            </p>
          </div>

          {/* Filters Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  showFilters
                    ? "text-amber-500"
                    : darkMode
                    ? "text-slate-400 hover:text-slate-300"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "Filter Notices"}
              </button>

              {(filterSemester || filterBranch) && (
                <button
                  onClick={() => {
                    setFilterSemester("");
                    setFilterBranch("");
                  }}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear Filters
                </button>
              )}
            </div>

            {showFilters && (
              <div
                className={`p-4 rounded-xl border animate-in slide-in-from-top-2 fade-in ${
                  darkMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      className={`text-xs font-bold uppercase tracking-wider ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Department / Branch
                    </label>
                    <select
                      value={filterBranch}
                      onChange={(e) => setFilterBranch(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-500 ${
                        darkMode
                          ? "bg-slate-950 border-slate-700 text-slate-300"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <option value="">All Branches</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      className={`text-xs font-bold uppercase tracking-wider ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Semester
                    </label>
                    <select
                      value={filterSemester}
                      onChange={(e) =>
                        setFilterSemester(Number(e.target.value))
                      }
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-500 ${
                        darkMode
                          ? "bg-slate-950 border-slate-700 text-slate-300"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <option value="">All Semesters</option>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notices Feed */}
          <div className="space-y-6">
            {notices.filter((notice) => {
              // If notice has specific targets, check against filters
              // If filter is empty, we show all (or global)
              // If notice has NO target, it is Global -> show it always (or dependent on requirement? implementing "Show matching + Global")

              // Logic:
              // 1. Semester Check:
              //    - If filterSemester is set: Show if (notice is global OR notice includes filterSemester)
              //    - If filterSemester is NOT set: Show all? Or just valid ones? Let's show all.
              // 2. Branch Check:
              //    - If filterBranch is set: Show if (notice is global OR notice includes filterBranch)

              // But "Global" means targetSemesters is empty/undefined.

              const globalSem =
                !notice.targetSemesters || notice.targetSemesters.length === 0;
              const globalBranch =
                !notice.targetBranches || notice.targetBranches.length === 0;

              const matchesSem =
                !filterSemester || // No filter set
                globalSem || // Global notice
                notice.targetSemesters.includes(filterSemester); // Matches filter

              const matchesBranch =
                !filterBranch || // No filter set
                globalBranch || // Global notice
                notice.targetBranches.includes(filterBranch); // Matches filter

              return matchesSem && matchesBranch;
            }).length === 0 ? (
              <div
                className={`text-center py-24 rounded-3xl border border-dashed ${
                  darkMode
                    ? "border-slate-800 bg-slate-900/50"
                    : "border-slate-300 bg-white"
                }`}
              >
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-500 opacity-20" />
                <h3 className="text-lg font-medium text-slate-500">
                  No matching notices found
                </h3>
                <p className="text-slate-500 text-sm">
                  Try adjusting your filters or check back later.
                </p>
              </div>
            ) : (
              notices
                .filter((notice) => {
                  const globalSem =
                    !notice.targetSemesters ||
                    notice.targetSemesters.length === 0;
                  const globalBranch =
                    !notice.targetBranches ||
                    notice.targetBranches.length === 0;

                  const matchesSem =
                    !filterSemester ||
                    globalSem ||
                    notice.targetSemesters.includes(filterSemester);

                  const matchesBranch =
                    !filterBranch ||
                    globalBranch ||
                    notice.targetBranches.includes(filterBranch);

                  return matchesSem && matchesBranch;
                })
                .map((notice, index) => (
                  <div
                    key={notice.id}
                    className={`group relative p-6 md:p-8 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      darkMode
                        ? "bg-slate-900 border-slate-800 hover:border-amber-500/30 hover:shadow-amber-900/20"
                        : "bg-white border-slate-200 hover:border-amber-400 hover:shadow-amber-100"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Decorative Pill */}
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full border ${
                          darkMode
                            ? "bg-slate-800 border-slate-700 text-slate-300"
                            : "bg-slate-100 border-slate-200 text-slate-600"
                        }`}
                      >
                        Official
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 mb-4 text-xs font-medium uppercase tracking-wider">
                      <Calendar
                        className={`w-4 h-4 ${
                          darkMode ? "text-amber-400" : "text-amber-600"
                        }`}
                      />
                      <span
                        className={
                          darkMode ? "text-amber-400" : "text-amber-700"
                        }
                      >
                        {notice.createdAt.toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500">
                        {notice.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Content */}
                    <h2
                      className={`text-2xl font-bold mb-4 ${
                        darkMode ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      {notice.title}
                    </h2>

                    {/* Tags for Sem/Branch if Specific */}
                    {((notice.targetBranches &&
                      notice.targetBranches.length > 0) ||
                      (notice.targetSemesters &&
                        notice.targetSemesters.length > 0)) && (
                      <div className="flex flex-wrap gap-2 mb-4">
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

                    <div
                      className={`prose prose-sm max-w-none ${
                        darkMode
                          ? "prose-invert text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {notice.content}
                      </p>
                    </div>

                    {/* Footer / Author */}
                    <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-[10px] text-white font-bold">
                          A
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          Posted by {notice.authorName || "Admin"}
                        </span>
                      </div>
                    </div>

                    {/* Accent Gradient Border Bottom */}
                    <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default StudentNoticePage;
