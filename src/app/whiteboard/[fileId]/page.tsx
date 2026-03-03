"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useCallback } from "react";
import AIModal from "@/components/modal";
import "@excalidraw/excalidraw/index.css";
import Navbar from "@/components/Navbar";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  { ssr: false },
);

export default function WhiteboardPage({
  params,
}: {
  params: { fileId: string };
}) {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // FIX 1: isInitialLoadRef caused the first real onChange (which carries the
  // restored elements) to be skipped, so currentElementsRef stayed stale.
  // Use a counter instead: skip only the very first synthetic fire.
  const changeCountRef = useRef(0);
  const currentElementsRef = useRef<any[]>([]);
  const savedElementsRef = useRef<any[]>([]);
  const excalidrawAPIRef = useRef<any>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showAIModal, setShowAIModal] = useState(false);

  // ── Load file ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadFile() {
      try {
        const response = await fetch(`/api/file/${params.fileId}`);
        if (!response.ok) throw new Error("Failed to fetch file");
        const fileData = await response.json();

        // FIX 2: Normalise the stored data. Your API might return data as a
        // JSON string (common with MongoDB), an object with an `elements` key,
        // or a plain array. Handle all three shapes.
        let elements: any[] = [];
        if (Array.isArray(fileData.data)) {
          elements = fileData.data;
        } else if (typeof fileData.data === "string") {
          try {
            const parsed = JSON.parse(fileData.data);
            elements = Array.isArray(parsed)
              ? parsed
              : (parsed?.elements ?? []);
          } catch {
            elements = [];
          }
        } else if (fileData.data?.elements) {
          elements = fileData.data.elements;
        }

        setFile({ ...fileData, data: elements });
        currentElementsRef.current = elements;
        savedElementsRef.current = elements;
      } catch (error) {
        console.error("Error loading file:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFile();
  }, [params.fileId]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const showToastFor = useCallback((ms = 2500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), ms);
  }, []);

  const saveFile = useCallback(async () => {
    if (isSaving) return;
    setSaveError(false);
    setIsSaving(true);
    try {
      // FIX 3: Always serialise to a plain array. Never send undefined.
      const payload = currentElementsRef.current ?? [];

      const response = await fetch(`/api/file/${params.fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // FIX 4: Some backends expect { data: elements }, others { elements }.
        // Keep your existing shape — just make sure it's always an array.
        body: JSON.stringify({ data: payload }),
      });

      if (!response.ok) throw new Error("Save failed");

      savedElementsRef.current = [...payload];
      setHasUnsavedChanges(false);
      showToastFor();
    } catch (error) {
      console.error("Error saving file:", error);
      setSaveError(true);
      showToastFor(3000);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, params.fileId, showToastFor]);

  // ── onChange ───────────────────────────────────────────────────────────────
  // FIX 5: Excalidraw fires onChange once immediately on mount with the
  // initialData elements (not a user change). We skip only that first fire.
  // Every subsequent call is a genuine edit and must be tracked.
  const handleChange = useCallback((elements: any) => {
    changeCountRef.current += 1;
    if (changeCountRef.current === 1) return; // skip the mount-time echo

    currentElementsRef.current = elements;
    const changed =
      JSON.stringify(elements) !== JSON.stringify(savedElementsRef.current);
    setHasUnsavedChanges(changed);
  }, []);

  // ── AI generation ──────────────────────────────────────────────────────────
  const handleAIGenerate = useCallback(
    (elements: any[]) => {
      if (!excalidrawAPIRef.current) return;
      excalidrawAPIRef.current.updateScene({ elements });
      currentElementsRef.current = elements;
      setHasUnsavedChanges(true);
      showToastFor();
    },
    [showToastFor],
  );

  // ── Debug event listener ───────────────────────────────────────────────────
  useEffect(() => {
    function handleDebugUpdate(e: any) {
      if (!excalidrawAPIRef.current) return;
      excalidrawAPIRef.current.updateScene({ elements: e.detail });
      currentElementsRef.current = e.detail;
      setHasUnsavedChanges(true);
    }
    window.addEventListener("excalidraw:debug:update", handleDebugUpdate);
    return () =>
      window.removeEventListener("excalidraw:debug:update", handleDebugUpdate);
  }, []);

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopImmediatePropagation();
        saveFile();
      }
    };
    document.addEventListener("keydown", handleKeyDown, {
      capture: true,
      passive: false,
    });
    return () =>
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [saveFile]);

  // ── Unload guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
          <span className="block w-4 h-4 border-2 border-gray-300 border-t-[#0790e8] rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">File not found.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <Navbar
        center={
          <h1 className="text-sm font-semibold text-gray-900">{file.name}</h1>
        }
        right={
          <>
            <button
              onClick={() => setShowAIModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#0790e8] text-white text-xs font-semibold shadow-sm hover:opacity-90 transition flex"
            >
              Generate With AI
            </button>

            <button
              onClick={saveFile}
              disabled={isSaving || !hasUnsavedChanges}
              className="px-3 py-1.5 rounded-xl bg-[#0790e8] text-white text-xs font-semibold shadow-[0_2px_8px_rgba(7,144,232,0.25)] hover:bg-[#0680d4] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <span className="block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : hasUnsavedChanges ? (
                "Save •"
              ) : (
                "Saved"
              )}
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-hidden">
        {/* FIX 6: key={file._id} forces Excalidraw to fully remount if the
            file changes, so initialData is never ignored due to stale closure. */}
        <Excalidraw
          key={file._id}
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api;
          }}
          onChange={handleChange}
          initialData={{
            elements: file.data,
            appState: {
              theme: "dark",
              viewBackgroundColor: "#ffffff",
            },
          }}
        />
      </div>

      <AIModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
      />

      {/* Toast */}
      {showToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-xs font-semibold shadow-lg transition-all ${
            saveError
              ? "bg-red-500"
              : "bg-white border border-gray-200 text-gray-700 shadow-[0_4px_16px_rgba(7,144,232,0.12)]"
          }`}
        >
          {saveError ? (
            <>
              {" "}
              <span>✕</span> Failed to save — please retry{" "}
            </>
          ) : (
            <>
              <span className="w-4 h-4 rounded-full bg-[#0790e8] flex items-center justify-center text-white text-[10px] font-bold">
                ✓
              </span>
              Saved successfully
            </>
          )}
        </div>
      )}
    </div>
  );
}
