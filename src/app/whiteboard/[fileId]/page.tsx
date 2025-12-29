"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { getFile, saveFile } from "../../lib/actions";
import Link from "next/link";\
import type { ExcalidrawProps } from "@excalidraw/excalidraw/types";


// FIXED CSS import for latest Excalidraw
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => {
    const module = await import("@excalidraw/excalidraw");
    return module.default || (module as any).Excalidraw;
  },
  { ssr: false }
);

export default function WhiteboardPage({
  params,
}: {
  params: { fileId: string };
}) {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    loadFile();
  }, [params.fileId]);

  async function loadFile() {
    const fileData = await getFile(params.fileId);
    setFile(fileData);
    setLoading(false);
  }

  function handleChange(elements: any, appState: any) {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");

    saveTimeoutRef.current = setTimeout(async () => {
      await saveFile(params.fileId, elements);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2000);
    }, 1000);
  }

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ color: "#6b7280" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href={`/folder/${file?.folderId}`}
            style={{
              color: "#3b82f6",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Back
          </Link>
          <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
            {file?.name}
          </h1>
        </div>
        <div style={{ fontSize: "14px", color: "#6b7280" }}>
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "✓ Saved"}
        </div>
      </div>

      {/* Drawing Canvas */}
      <div style={{ flex: 1 }}>
        <Excalidraw
          onChange={handleChange}
          initialData={{
            elements: file?.data || [],
            appState: {
              viewBackgroundColor: "#ffffff",
            },
          }}
        />
      </div>
    </div>
  );
}
