"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Check,
  X,
  User,
  Shield,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

const ROLE_COLORS = {
  Registration: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Media: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Tech: "bg-green-500/20 text-green-300 border-green-500/30",
  Logistics: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Hospitality: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Security: "bg-red-500/20 text-red-300 border-red-500/30",
  default: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const getRoleStyle = (role) => {
  const key =
    Object.keys(ROLE_COLORS).find((k) => role?.includes(k)) || "default";
  return ROLE_COLORS[key];
};

const VolunteerApprovalCard = ({ eventId, enableVolunteers }) => {
  const [requests, setRequests] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    // 1. Safety Check: Ensure eventId exists
    if (!eventId) {
      console.warn("VolunteerApprovalCard: No eventId provided");
      setLoading(false);
      return;
    }

    console.log(`Listening for requests for Event ID: ${eventId}`);

    // 2. Query Setup
    const q = query(
      collection(db, "volunteer_applications"),
      where("eventId", "==", eventId),
    );

    // 3. Real-time Listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const pendingData = allData.filter(
          (req) => req.status?.toLowerCase() === "pending",
        );
        const approvedData = allData.filter(
          (req) => req.status?.toLowerCase() === "approved",
        );

        console.log(
          `Snapshot update: ${pendingData.length} pending, ${approvedData.length} approved`,
        );
        setRequests(pendingData);
        setApproved(approvedData);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to volunteer requests:", err);
        setError("Failed to stream volunteer requests.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [eventId]);

  const handleAction = async (id, status) => {
    setProcessingId(id);
    try {
      const requestRef = doc(db, "volunteer_applications", id);
      await updateDoc(requestRef, {
        status: status,
        reviewedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(`Error updating status to ${status}:`, err);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            Volunteer Requests
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Review and manage incoming applications.
          </p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {requests.length} Pending
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-gray-900/50 border border-gray-800 rounded-2xl text-gray-500">
          <User className="w-10 h-10 mb-3 opacity-20" />
          {enableVolunteers ? (
            <>
              <p>No pending volunteer requests</p>
              <p className="text-xs text-gray-600 mt-2">ID: {eventId}</p>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
              <p className="font-medium text-slate-400">
                Volunteer registrations were disabled during event creation.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-gray-700 group-hover:text-white transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {request.userName || "Unknown User"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Applied:{" "}
                      {request.createdAt?.toDate
                        ? request.createdAt.toDate().toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </span>
                  <div className="h-px flex-grow bg-gray-800"></div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleStyle(
                    request.role,
                  )}`}
                >
                  {request.role || "General Volunteer"}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAction(request.id, "approved")}
                  disabled={processingId === request.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/20 hover:border-green-500/40 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === request.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Accept
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleAction(request.id, "rejected")}
                  disabled={processingId === request.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === request.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4" /> Decline
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved Volunteers Section */}
      {approved.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-800">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" /> Approved Volunteers
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
              {approved.length}
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {approved.map((vol) => (
              <div
                key={vol.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-green-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {vol.userName?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {vol.userName}
                    </p>
                    <p className="text-[10px] text-slate-500">{vol.email}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${
                    getRoleStyle(vol.role) ||
                    "bg-gray-700 text-gray-300 border-gray-600"
                  }`}
                >
                  {vol.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerApprovalCard;
