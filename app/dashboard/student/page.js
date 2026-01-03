"use client";

import React, { useState, useEffect } from "react";
import Logout from "../../logout";
import Logo from "../../logo";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  Calendar,
  MapPin,
  Filter,
  Search,
  Sun,
  Moon,
  LogOut,
  User,
  Briefcase,
  CheckCircle,
  Loader2,
  Zap,
  Megaphone, // Added Megaphone
} from "lucide-react";

const StudentDashboard = () => {
  const router = useRouter();

  // -- State Management --
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Data
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState(new Set());
  const [volunteerApps, setVolunteerApps] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    branches: [],
    semesters: [],
    category: "",
    venue: "",
    showOnlyUpcoming: true,
  });

  // UI State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [registeringId, setRegisteringId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  // Constants
  const BRANCHES = [
    "B.Tech CSE Core",
    "B.Tech CSE AI/ML",
    "B.Tech CSE Data Science",
    "B.Tech IT",
    "B.Tech ECE",
    "BBA-LLB",
    "Biotech",
    "BCA",
    "M.Tech CSE",
  ];
  const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
  const CATEGORIES = [
    "Hackathon",
    "Workshop",
    "Seminar",
    "Cultural",
    "Sports",
    "Gaming",
  ];
  const VENUES = [
    "Auditorium",
    "Seminar Hall 1",
    "Seminar Hall 2",
    "Lab 101",
    "Ground",
  ];

  // -- Effects --

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") setDarkMode(false);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== "student") {
            router.push("/login");
            return;
          }
          setUserData(data);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Real-time Data Listeners
  useEffect(() => {
    if (!user) return;

    // 1. Events Listener
    const eventsUnsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const eventsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate
          ? doc.data().date.toDate()
          : new Date(doc.data().date),
      }));

      // Sort: Upcoming (Ascending) then Expired (Descending)
      const now = new Date();
      const upcoming = eventsList
        .filter((e) => e.date >= now)
        .sort((a, b) => a.date - b.date);
      const expired = eventsList
        .filter((e) => e.date < now)
        .sort((a, b) => b.date - a.date);

      setEvents([...upcoming, ...expired]);
    });

    // 2. Registrations Listener
    const regQuery = query(
      collection(db, "event_registrations"),
      where("userId", "==", user.uid)
    );
    const regUnsub = onSnapshot(regQuery, (snapshot) => {
      const regSet = new Set(snapshot.docs.map((doc) => doc.data().eventId));
      setRegistrations(regSet);
    });

    // 3. Volunteer Applications Listener
    const volQuery = query(
      collection(db, "volunteer_applications"),
      where("userId", "==", user.uid)
    );
    const volUnsub = onSnapshot(volQuery, (snapshot) => {
      const volMap = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!volMap[data.eventId]) volMap[data.eventId] = {};
        volMap[data.eventId][data.role] = data.status;
      });
      setVolunteerApps(volMap);
    });

    return () => {
      eventsUnsub();
      regUnsub();
      volUnsub();
    };
  }, [user]);

  // -- Handlers --

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const handleFilterChange = (type, value) => {
    setFilters((prev) => {
      if (type === "branches" || type === "semesters") {
        const list = prev[type];
        return {
          ...prev,
          [type]: list.includes(value)
            ? list.filter((i) => i !== value)
            : [...list, value],
        };
      }
      return { ...prev, [type]: value };
    });
  };

  const handleRegister = async (event) => {
    if (!user || registrations.has(event.id)) return;
    setRegisteringId(event.id);
    try {
      await addDoc(collection(db, "event_registrations"), {
        eventId: event.id,
        userId: user.uid,
        userName:
          userData?.name || userData?.fname || user.displayName || "Student",
        email: user.email,
        eventTitle: event.title,
        registeredAt: serverTimestamp(),
      });
      setRegistrations((prev) => new Set(prev).add(event.id));
    } catch (error) {
      alert("Registration failed: " + error.message);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleVolunteerApply = async (event, role) => {
    if (!user) return;
    setApplyingId(event.id);
    try {
      await addDoc(collection(db, "volunteer_applications"), {
        eventId: event.id,
        userId: user.uid,
        userName: userData?.name || userData?.fname || user.displayName,
        email: user.email,
        role: role,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setVolunteerApps((prev) => ({
        ...prev,
        [event.id]: {
          ...(prev[event.id] || {}),
          [role]: "pending",
        },
      }));
    } catch (error) {
      alert("Application failed: " + error.message);
    } finally {
      setApplyingId(null);
    }
  };

  const addToGoogleCalendar = (event) => {
    const startTime = event.date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTime = new Date(event.date.getTime() + 2 * 60 * 60 * 1000)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${startTime}/${endTime}&details=${encodeURIComponent(
      event.description
    )}&location=${encodeURIComponent(event.venue)}`;
    window.open(url, "_blank");
  };

  const handleLogout = () => {
    auth.signOut();
    router.push("/login");
  };

  const filteredEvents = events.filter((event) => {
    if (filters.showOnlyUpcoming && new Date() > event.date) return false;
    if (filters.category && event.category !== filters.category) return false;
    if (filters.venue && event.venue !== filters.venue) return false;
    if (
      filters.branches.length > 0 &&
      event.branches &&
      !event.branches.some((b) => filters.branches.includes(b))
    )
      return false;
    if (
      filters.semesters.length > 0 &&
      event.semesters &&
      !event.semesters.some((s) => filters.semesters.includes(Number(s)))
    )
      return false;
    return true;
  });

  const volunteerEvents = events.filter(
    (e) => e.enableVolunteers && new Date(e.date) > new Date()
  );

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <Loader2
          className={`w-12 h-12 animate-spin ${
            darkMode ? "text-amber-500" : "text-amber-600"
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <span className="text-xl md:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-rose-600">
                  <span className="md:hidden">Dashboard</span>
                  <span className="hidden md:inline">Student Dashboard</span>
                </span>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-colors ${
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
                  onClick={() => router.push("/studentnotice")}
                  className="px-3 py-2 md:px-4 md:py-2 bg-amber-600/10 text-amber-400 border border-amber-600/20 rounded-lg hover:bg-amber-600 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
                  title="Notice"
                >
                  <Megaphone className="w-5 h-5 md:hidden" />
                  <span className="hidden md:inline">Notice</span>
                </button>

                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-700/50">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-200">
                      {userData?.name ||
                        userData?.fname ||
                        user?.displayName ||
                        "Student"}
                    </p>
                    <p className="text-xs text-amber-400 font-medium">
                      {userData?.branch || "Engineering"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-[2px]">
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${
                        darkMode ? "bg-slate-900" : "bg-white"
                      }`}
                    >
                      {userData?.photo || user?.photoURL ? (
                        <img
                          src={userData?.photo || user?.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>

                <Logout className="ml-1 md:ml-2 p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 pb-12">
          {/* Filters Sidebar */}
          <aside
            className={`lg:w-72 flex-shrink-0 ${
              mobileFiltersOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div
              className={`sticky top-24 p-6 rounded-2xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-500" /> Filters
                </h3>
                <button
                  onClick={() =>
                    setFilters({
                      branches: [],
                      semesters: [],
                      category: "",
                      venue: "",
                      showOnlyUpcoming: true,
                    })
                  }
                  className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
                >
                  Reset All
                </button>
              </div>

              <div className="space-y-6">
                {/* Upcoming */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    filters.showOnlyUpcoming
                      ? "border-amber-500/50 bg-amber-500/10"
                      : darkMode
                      ? "border-slate-700 bg-slate-800/50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      filters.showOnlyUpcoming
                        ? "text-amber-400"
                        : "text-slate-500"
                    }`}
                  >
                    Upcoming Events
                  </span>
                </label>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={filters.category}
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                      className={`w-full p-2.5 rounded-lg border text-sm font-medium appearance-none focus:ring-2 focus:ring-amber-500 outline-none ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Venue
                  </label>
                  <div className="relative">
                    <select
                      value={filters.venue}
                      onChange={(e) =>
                        handleFilterChange("venue", e.target.value)
                      }
                      className={`w-full p-2.5 rounded-lg border text-sm font-medium appearance-none focus:ring-2 focus:ring-amber-500 outline-none ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="">All Venues</option>
                      {VENUES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Branch */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Target Branch
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {BRANCHES.map((branch) => (
                      <label
                        key={branch}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:text-amber-400 transition-colors group"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            filters.branches.includes(branch)
                              ? "bg-amber-500 border-amber-500"
                              : "border-slate-600 group-hover:border-amber-400"
                          }`}
                        >
                          {filters.branches.includes(branch) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={filters.branches.includes(branch)}
                          onChange={() =>
                            handleFilterChange("branches", branch)
                          }
                          className="hidden"
                        />
                        {branch}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Semester */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Semester
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SEMESTERS.map((sem) => (
                      <button
                        key={sem}
                        onClick={() => handleFilterChange("semesters", sem)}
                        className={`text-sm py-1.5 rounded-md transition-all font-medium border ${
                          filters.semesters.includes(sem)
                            ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/25"
                            : darkMode
                            ? "bg-slate-800 border-slate-700 hover:border-amber-500 text-slate-400"
                            : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {sem}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <button
            className="lg:hidden w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <Filter className=":w-1 w-4 h-4" />{" "}
            {mobileFiltersOpen ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Feeds */}
          <div className="flex-1 space-y-10">
            {/* Section: Events */}
            <section>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                    Explore Events
                  </h2>
                  <p className="text-slate-500 mt-1 font-medium">
                    Join workshops, hackathons, and more.
                  </p>
                </div>
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {filteredEvents.length} Active
                </span>
              </div>

              <div className="grid gap-6">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No events found. Try adjusting your filters.</p>
                  </div>
                ) : (
                  filteredEvents.map((event) => {
                    const isExpired = new Date() > event.date;
                    return (
                      <div
                        key={event.id}
                        className={`group relative p-[1px] rounded-2xl transition-all duration-300 hover:shadow-2xl ${
                          isExpired
                            ? "bg-slate-800 border border-slate-700 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                            : "bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 hover:shadow-rose-500/20"
                        }`}
                      >
                        <div
                          className={`h-full rounded-2xl overflow-hidden ${
                            darkMode ? "bg-slate-900" : "bg-white"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row h-full">
                            {/* Image */}
                            <div className="md:w-1/3 h-56 md:h-auto relative overflow-hidden bg-slate-800">
                              <div className="absolute top-4 left-4 z-20 flex gap-2">
                                <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-amber-600 text-white rounded shadow-lg shadow-amber-500/40">
                                  {event.category}
                                </span>
                                {isExpired && (
                                  <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-red-600 text-white rounded shadow-lg">
                                    Expired
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="md:w-2/3 p-6 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start">
                                  <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">
                                    {event.title}
                                  </h3>
                                  {registrations.has(event.id) && (
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                      <CheckCircle className="w-3 h-3" />{" "}
                                      Registered
                                    </span>
                                  )}
                                </div>

                                <p
                                  className={`text-sm mb-4 line-clamp-2 leading-relaxed ${
                                    darkMode
                                      ? "text-slate-400"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {event.description}
                                </p>

                                <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500 mb-6">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    {event.date.toLocaleDateString(undefined, {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-amber-500" />
                                    {event.venue}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/50">
                                {registrations.has(event.id) ? (
                                  <button
                                    onClick={() => addToGoogleCalendar(event)}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                      darkMode
                                        ? "bg-slate-800 hover:bg-slate-700 text-white"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                                    }`}
                                  >
                                    <Calendar className="w-4 h-4" /> Add to
                                    Calendar
                                  </button>
                                ) : isExpired ? (
                                  <button
                                    disabled
                                    className="flex-1 bg-slate-700 text-slate-400 py-3 rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    Event Ended
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRegister(event)}
                                    disabled={registeringId === event.id}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                  >
                                    {registeringId === event.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Register Now"
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Section: Volunteers */}
            <section className="pt-8 border-t border-slate-800/50">
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <Briefcase className="w-6 h-6 text-rose-400" />
                  Volunteer{" "}
                  <span className="text-slate-500 text-lg font-normal ml-2">
                    Open Roles
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {volunteerEvents.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                    No active volunteer calls at the moment.
                  </div>
                ) : (
                  volunteerEvents.map((event) => {
                    // Pre-calculation of apps moved inside the role loop or handled via closure
                    return (
                      <div
                        key={event.id}
                        className={`p-5 rounded-xl border transition-all group ${
                          darkMode
                            ? "bg-slate-900/50 border-slate-800 hover:border-rose-500/30"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-lg group-hover:text-rose-400 transition-colors">
                            {event.title}
                          </h4>
                          <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                            {event.date.toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Roles Available
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {event.volunteerRoles?.map((role) => (
                              <div
                                key={role}
                                className="flex items-center gap-2 w-full justify-between bg-slate-800/80 p-3 rounded-lg border border-slate-700/50"
                              >
                                <span className="text-sm font-medium text-slate-300">
                                  {role}
                                </span>
                                {(() => {
                                  const apps = volunteerApps[event.id] || {};
                                  const status = apps[role];
                                  const hasActiveApp = Object.values(apps).some(
                                    (s) => s === "pending" || s === "approved"
                                  );
                                  const isRegistered = registrations.has(
                                    event.id
                                  );

                                  if (status) {
                                    return (
                                      <span
                                        className={`text-[10px] uppercase font-black px-2 py-1 rounded tracking-wide
                                      ${
                                        status === "approved"
                                          ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                          : status === "rejected"
                                          ? "bg-red-500 text-white"
                                          : "bg-yellow-500 text-black"
                                      }`}
                                      >
                                        {status}
                                      </span>
                                    );
                                  }

                                  if (!isRegistered) {
                                    return (
                                      <span className="text-[10px] font-bold text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                                        Register First
                                      </span>
                                    );
                                  }

                                  if (hasActiveApp) {
                                    return (
                                      <span className="text-xs text-slate-500 italic">
                                        Applied other
                                      </span>
                                    );
                                  }

                                  return (
                                    <button
                                      onClick={() =>
                                        handleVolunteerApply(event, role)
                                      }
                                      disabled={applyingId === event.id}
                                      className="text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                                    >
                                      {applyingId === event.id
                                        ? "..."
                                        : "Apply"}
                                    </button>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
