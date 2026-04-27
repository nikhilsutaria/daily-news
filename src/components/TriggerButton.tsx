"use client";

import { useState } from "react";

type TriggerStatus = "idle" | "loading" | "success" | "error";

export default function TriggerButton() {
  const [status, setStatus] = useState<TriggerStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleTrigger() {
    const secret = prompt("Enter trigger secret:");
    if (!secret) return;

    setStatus("loading");
    setMessage("");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setStatus("error");
      setMessage("Supabase URL not configured");
      return;
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/run-pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || data.message || "Trigger failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleTrigger}
        disabled={status === "loading"}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "loading" ? "Processing..." : "Trigger Summary"}
      </button>
      {message && (
        <span
          className={`text-sm ${
            status === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
