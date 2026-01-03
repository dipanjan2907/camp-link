"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Logout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white font-semibold rounded-lg border border-white/20 hover:bg-red-600 hover:border-red-500 hover:shadow-lg transition-all duration-200 ease-in-out"
      aria-label="Logout"
    >
      <LogOut className="h-5 w-5" />

      <span className="font-medium">Logout</span>
    </button>
  );
};

export default Logout;
