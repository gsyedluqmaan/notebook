"use client";

import { useState } from "react";

export default function ExcalidrawDebugOverlay() {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function onChange(value: string) {
    setRaw(value);
    setSuccess(false);

    // Don't try to parse empty input
    if (!value.trim()) {
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      const elements = Array.isArray(parsed) ? parsed : parsed?.elements;

      if (!Array.isArray(elements)) {
        throw new Error(
          "Invalid Excalidraw JSON - must be array or have 'elements' property",
        );
      }

      window.dispatchEvent(
        new CustomEvent("excalidraw:debug:update", {
          detail: elements,
        }),
      );

      setError(null);
      setSuccess(true);

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      console.error("❌ Parse error:", e);
      setError(e.message);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: 360,
        height: 240,
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          fontSize: 13,
          fontWeight: 600,
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Excalidraw JSON Injector</span>
        {success && (
          <span style={{ color: "#10b981", fontSize: 11 }}>✓ Updated!</span>
        )}
      </div>

      <textarea
        placeholder='Paste Excalidraw JSON here, e.g.:
[
  {
    "type": "rectangle",
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 100,
    ...
  }
]'
        value={raw}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          border: "none",
          padding: 8,
          fontSize: 11,
          fontFamily: "monospace",
          outline: "none",
          resize: "none",
        }}
      />

      {error && (
        <div
          style={{
            color: "#ef4444",
            fontSize: 11,
            padding: "6px 8px",
            background: "#fef2f2",
            borderTop: "1px solid #fee2e2",
          }}
        >
          ❌ {error}
        </div>
      )}
    </div>
  );
}
