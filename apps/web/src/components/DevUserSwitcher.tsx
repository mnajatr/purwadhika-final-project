"use client";

import { useEffect, useState } from "react";

export default function DevUserSwitcher() {
  const [devUserId, setDevUserId] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("devUserId");
    setDevUserId(stored ?? "4");
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Development User Switcher
      </label>
      <select
        value={devUserId}
        onChange={(e) => {
          const value = e.target.value;
          localStorage.setItem("devUserId", value);
          setDevUserId(value);
          window.location.reload();
        }}
        className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="1">User 1 (Super Admin)</option>
        <option value="2">User 2 (Store Admin - Bandung)</option>
        <option value="3">User 3 (Store Admin - Jakarta)</option>
        <option value="4">User 4 (Normal User)</option>
        <option value="5">User 5 (Normal User)</option>
        <option value="none">None (No User)</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Current User ID: {devUserId || "4"} - Switch to test different
        users&apos; orders
      </p>
    </div>
  );
}
