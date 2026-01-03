"use client";

import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // Removed 'storage'
import {
  Calendar,
  MapPin,
  Layers,
  Users,
  Briefcase,
  Check,
  Loader2,
  Plus,
  X,
} from "lucide-react"; // Removed 'Upload' icon

const EventForm = ({ onEventPublished }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    category: "",
    semesters: [],
    branches: [],
    enableVolunteers: false,
    volunteerRoles: [],
  });

  const [newRole, setNewRole] = useState("");

  const BRANCHES = [
    "B.Tech CSE (Core)",
    "B.Tech CSE (AI/ML)",
    "B.Tech CSE (Data Science)",
    "B.Tech CSE (Cyber Security)",
    "IT",
    "BBA-LLB",
    "LLB",
    "Biotech",
    "BCA",
    "M.Tech CSE",
  ];

  const SEMESTERS = Array.from({ length: 10 }, (_, i) => i + 1);
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
    "Virtual",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleAddRole = (e) => {
    e.preventDefault();
    if (newRole.trim()) {
      setFormData((prev) => ({
        ...prev,
        volunteerRoles: [...prev.volunteerRoles, newRole.trim()],
      }));
      setNewRole("");
    }
  };

  const removeRole = (index) => {
    setFormData((prev) => ({
      ...prev,
      volunteerRoles: prev.volunteerRoles.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Simplified payload without posterUrl
      const eventPayload = {
        ...formData,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        initialViews: 0,
        initialRegistrations: 0,
        date: new Date(formData.date),
      };

      await addDoc(collection(db, "events"), eventPayload);

      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        date: "",
        venue: "",
        category: "",
        semesters: [],
        branches: [],
        enableVolunteers: false,
        volunteerRoles: [],
      });
      if (onEventPublished) onEventPublished();

      setTimeout(() => setSuccess(false), 3000);
      alert("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-4xl mx-auto p-6 pb-20">
        <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600"></div>

          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  Create New Event
                </h2>
                <p className="text-gray-400 mt-1 text-sm">
                  Fill in the details to publish a new event to the dashboard.
                </p>
              </div>
              {success && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full animate-in fade-in slide-in-from-top-2">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Event Published!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Removed the split column layout since image is gone */}
              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Event Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. HackSprint 2025"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" /> Date &
                      Time
                    </label>
                    <input
                      type="datetime-local"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400" /> Venue
                    </label>
                    <select
                      name="venue"
                      required
                      value={formData.venue}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Venue</option>
                      {VENUES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" /> Category
                  </label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows="4"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the event details, rules, and agenda..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 pt-4 border-t border-gray-800">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400" /> Target
                    Branches
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BRANCHES.map((branch) => (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => toggleMultiSelect("branches", branch)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                        ${
                          formData.branches.includes(branch)
                            ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                            : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {branch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-400" /> Target Semesters
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SEMESTERS.map((sem) => (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => toggleMultiSelect("semesters", sem)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200 border flex items-center justify-center
                        ${
                          formData.semesters.includes(sem)
                            ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                            : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {sem}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          enableVolunteers: !p.enableVolunteers,
                        }))
                      }
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                        formData.enableVolunteers
                          ? "bg-amber-500"
                          : "bg-gray-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                          formData.enableVolunteers
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className="text-gray-300 font-medium">
                      Enable Volunteer Registration
                    </span>
                  </div>
                </div>

                {formData.enableVolunteers && (
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        placeholder="Enter role name (e.g., Event Coordinator)"
                        className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        onKeyDown={(e) => e.key === "Enter" && handleAddRole(e)}
                      />
                      <button
                        type="button"
                        onClick={handleAddRole}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 rounded-lg flex items-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {formData.volunteerRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.volunteerRoles.map((role, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm"
                          >
                            {role}
                            <button
                              type="button"
                              onClick={() => removeRole(idx)}
                              className="p-1 hover:bg-amber-500/20 rounded-full transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 transform transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>Publish Event</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventForm;
