"use client";
import React, { useState, useEffect } from "react";
// ... (imports remain the same, just adding deleteDoc and Trash2)
import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Logout from "../../logout";
import { useRouter } from "next/navigation";
import EventForm from "@/app/components/EventForm";
import VolunteerApprovalCard from "@/app/components/VolunteerApprovalCard";
import { User, Loader2, Trash2, UserPlus, Megaphone } from "lucide-react"; // Added UserPlus, Megaphone

const Page = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Events Listener (Real-time)
  useEffect(() => {
    const eventsCol = collection(db, "events");
    const unsubscribe = onSnapshot(eventsCol, (snapshot) => {
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

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // 1. Fetch User Role
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();

            // 2. Role Check: Admin Only
            if (userData.role !== "admin") {
              router.push("/login");
              return;
            }

            setUserDetails(userData);

            // 3. Events loaded via separate useEffect listener
            // await fetchEvents();
          } else {
            // User doc doesn't exist? Redirect.
            router.push("/login");
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, "events", eventId));
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-row min-h-screen bg-gray-900 relative overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Title */}
            <div>
              <span className="text-xl md:text-2xl font-black tracking-tight text-white">
                Admin{" "}
                <span className="hidden sm:inline text-amber-500">
                  Dashboard
                </span>
              </span>
            </div>

            {/* Right: Actions & User Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/register")}
                className="px-3 py-2 md:px-4 md:py-2 bg-green-600/10 text-green-400 border border-green-600/20 rounded-lg hover:bg-green-600 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
                title="Register Student"
              >
                <UserPlus className="w-5 h-5 md:hidden" />
                <span className="hidden md:inline">Register Student</span>
              </button>

              <button
                onClick={() => router.push("/adminnotice")}
                className="px-3 py-2 md:px-4 md:py-2 bg-amber-600/10 text-amber-400 border border-amber-600/20 rounded-lg hover:bg-amber-600 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
                title="Notice"
              >
                <Megaphone className="w-5 h-5 md:hidden" />
                <span className="hidden md:inline">Notice</span>
              </button>

              <div className="h-8 w-px bg-gray-700 mx-2 hidden md:block"></div>

              {/* User Info */}
              {userDetails && (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white leading-none">
                      {userDetails.name || userDetails.fname || "Admin"}
                    </p>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                      Administrator
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                      {userDetails.photo ? (
                        <img
                          src={userDetails.photo}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Logout className="ml-2 p-2 text-gray-400 hover:text-red-500 transition-colors" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main dashboard content */}
      <div className="w-full flex flex-col md:flex-row p-6 pt-24 gap-6">
        {/* Left Column: Event Creation */}
        <div className="flex-1 flex justify-center">
          <div className="w-full">
            <EventForm />
          </div>
        </div>

        {/* Right Column: Volunteer Requests (Scrollable) */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto max-h-[90vh] pb-10 custom-scrollbar">
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
            Pending Requests
          </h2>
          {events.length === 0 ? (
            <p className="text-gray-500 italic">No events found.</p>
          ) : (
            events.map((event) => {
              const isExpired = new Date() > event.date;
              return (
                <div
                  key={event.id}
                  className={`group relative p-[1px] rounded-xl transition-all duration-300 hover:shadow-2xl ${
                    isExpired
                      ? "bg-slate-700 hover:shadow-none" // Grayscale/Dimmed for expired
                      : "bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 hover:shadow-rose-500/20"
                  }`}
                >
                  <div className="bg-gray-900 rounded-xl p-4 h-full relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="pr-8">
                        <h3
                          className={`text-lg font-semibold ${
                            isExpired ? "text-slate-400" : "text-amber-400"
                          }`}
                        >
                          {event.title}
                        </h3>
                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 rounded border mt-1 inline-block ${
                            isExpired
                              ? "bg-slate-800 text-slate-500 border-slate-700"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          {isExpired ? "Expired" : "Upcoming"}
                        </span>
                        <p className="text-xs text-slate-400 mt-2 font-mono flex items-center gap-1">
                          <span
                            className={`${
                              isExpired ? "opacity-50" : "text-amber-500/80"
                            }`}
                          >
                            📅
                          </span>
                          {event.date.toLocaleString([], {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-20"
                        title="Delete Event"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <VolunteerApprovalCard eventId={event.id} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
