"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, User, Mail, BookOpen, Loader2 } from "lucide-react";

const EventRegistrationModal = ({ eventId, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!eventId) return;

      try {
        const q = query(
          collection(db, "event_registrations"),
          where("eventId", "==", eventId),
        );
        const snapshot = await getDocs(q);

        const registrations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch additional user details (like branch) if missing
        const detailedStudents = await Promise.all(
          registrations.map(async (reg) => {
            if (reg.branch) return reg; // Branch already exists

            // Fetch branch from user profile if not in registration
            if (reg.userId) {
              try {
                const userDoc = await getDoc(doc(db, "users", reg.userId));
                if (userDoc.exists()) {
                  return { ...reg, branch: userDoc.data().branch };
                }
              } catch (err) {
                console.error(
                  "Error fetching user details for:",
                  reg.userId,
                  err,
                );
              }
            }
            return { ...reg, branch: "Unknown Branch" };
          }),
        );

        setStudents(detailedStudents);
      } catch (error) {
        console.error("Error fetching registrations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [eventId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              Registered Students
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              List of all students registered for this event.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-amber-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm font-medium">Loading registrations...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-gray-900/50">
              <User className="w-12 h-12 mb-3 opacity-20" />
              <p>No students have registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-amber-500/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-[2px] flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {student.userName?.charAt(0).toUpperCase() || "S"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {student.userName}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {student.email}
                        </span>
                        <span className="hidden sm:inline text-gray-600">
                          |
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-500/80">
                          <BookOpen className="w-3.5 h-3.5" />
                          {student.branch || "Unknown Branch"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 text-right">
                    <span className="text-xs font-mono text-gray-500">
                      {student.registeredAt?.toDate
                        ? student.registeredAt.toDate().toLocaleDateString()
                        : "Unknown Date"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 rounded-b-2xl">
          <div className="flex justify-between items-center text-xs text-gray-500 px-2">
            <span>Total Registered: {students.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationModal;
