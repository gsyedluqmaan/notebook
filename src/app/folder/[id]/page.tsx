"use client";

import { useEffect, useState, useRef } from "react";
import { getFolder, getFiles, createFile, deleteFile } from "../../lib/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type FileItem = {
  _id: string;
  name: string;
  updatedAt: string;
};

type Toast = {
  id: string;
  type: "success" | "error";
  message: string;
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const isSuccess = toast.type === "success";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-xs pointer-events-auto border ${
        isSuccess
          ? "bg-white border-[#0790e8]/20 text-[#0790e8] shadow-[#0790e8]/10"
          : "bg-white border-red-200 text-red-500 shadow-red-100"
      }`}
    >
      <span
        className={`text-[11px] font-bold mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
          isSuccess ? "bg-[#0790e8] text-white" : "bg-red-500 text-white"
        }`}
      >
        {isSuccess ? "✓" : "✕"}
      </span>
      <span className="leading-snug text-gray-700">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-auto text-gray-300 hover:text-gray-500 transition shrink-0 text-xs"
      >
        ✕
      </button>
    </motion.div>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── File Card ────────────────────────────────────────────────────────────────

function FileCard({
  file,
  onDelete,
}: {
  file: FileItem;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 2500);
    } else {
      if (confirmRef.current) clearTimeout(confirmRef.current);
      setConfirming(false);
      onDelete(file._id);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="group bg-white border border-gray-100 rounded-2xl hover:border-[#0790e8]/30 hover:shadow-[0_4px_24px_rgba(7,144,232,0.08)] transition-all duration-200 p-4 flex justify-between items-center"
    >
      <Link
        href={`/whiteboard/${file._id}`}
        className="flex-1 flex items-center gap-4 min-w-0"
      >
        <div className="w-10 h-10 rounded-xl bg-[#0790e8]/8 border border-[#0790e8]/15 flex items-center justify-center shrink-0 group-hover:bg-[#0790e8]/12 transition-colors duration-200">
          <svg
            className="w-[17px] h-[17px] text-[#0790e8]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <h3 className="text-gray-900 font-semibold text-[14px] truncate leading-tight group-hover:text-[#0790e8] transition-colors duration-150">
            {file.name}
          </h3>
          <p className="text-gray-400 text-[11px] mt-0.5 font-mono">
            {new Date(file.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </Link>

      <AnimatePresence mode="wait">
        <motion.button
          key={confirming ? "confirm" : "delete"}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.1 }}
          onClick={handleDeleteClick}
          className={`ml-4 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            confirming
              ? "bg-red-50 text-red-500 border border-red-200 animate-pulse"
              : "text-gray-300 hover:text-red-400 hover:bg-red-50 border border-transparent"
          }`}
        >
          {confirming ? "Confirm?" : "Delete"}
        </motion.button>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FolderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [folder, setFolder] = useState<any>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [folderData, filesData] = await Promise.all([
        getFolder(params.id),
        getFiles(params.id),
      ]);
      setFolder(folderData);
      setFiles(filesData);
    } catch {
      addToast("error", "Failed to load folder.");
    } finally {
      setLoading(false);
    }
  }

  function addToast(type: Toast["type"], message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleCreateFile() {
    if (!fileName.trim()) return;
    try {
      setCreating(true);
      const result = await createFile(params.id, fileName.trim());
      setFileName("");
      // router.push(`/whiteboard/${result.insertedId}`);
    } catch {
      addToast("error", "Could not create file. Please try again.");
      setCreating(false);
    }
  }

  async function handleDeleteFile(fileId: string) {
    const file = files.find((f) => f._id === fileId);
    try {
      await deleteFile(fileId, params.id);
      await loadData();
      addToast("success", `"${file?.name}" deleted`);
    } catch {
      addToast("error", "Could not delete file. Please try again.");
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-[#0790e8]/15">
        {/* Top accent line */}
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0790e8]/40 to-transparent z-50" />

        <div className="relative max-w-3xl mx-auto px-4 py-4">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mb-10"
          >
            {/* <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#0790e8] text-xs font-semibold tracking-widest uppercase mb-4 hover:opacity-70 transition-opacity"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Folders
            </Link> */}

            {loading ? (
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0790e8]" />
                  <p className="text-[#0790e8] text-xs font-semibold tracking-widest uppercase">
                    Folder
                  </p>
                </div>
                <h1 className="text-[28px] font-bold tracking-tight text-gray-900 leading-none">
                  {folder?.name}
                </h1>
                {files.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-400 text-sm mt-1.5"
                  >
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </motion.p>
                )}
              </>
            )}
          </motion.div>

          {/* ── Create File Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            className="bg-white border border-gray-200/80 rounded-2xl p-5 mb-6 shadow-sm"
          >
            <label className="block text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-3">
              New File
            </label>

            <div className="flex gap-2.5">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-150 focus:bg-white focus:border-[#0790e8]/60 focus:ring-2 focus:ring-[#0790e8]/10"
                placeholder="e.g. Concept Sketch"
              />

              <motion.button
                onClick={handleCreateFile}
                disabled={creating || !fileName.trim()}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="shrink-0 px-5 py-2.5 bg-[#0790e8] text-white text-sm font-semibold rounded-xl hover:bg-[#0680d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2 shadow-[0_2px_12px_rgba(7,144,232,0.25)]"
              >
                {creating ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.7,
                      ease: "linear",
                    }}
                    className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Create</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* ── File List ── */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2.5"
            >
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-[66px] rounded-2xl bg-white border border-gray-100 animate-pulse"
                  style={{ animationDelay: `${i * 70}ms` }}
                />
              ))}
            </motion.div>
          ) : files.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-20"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#0790e8]/8 border border-[#0790e8]/12 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-[#0790e8]/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-400">
                No files yet
              </p>
              <p className="text-xs mt-1 text-gray-300">
                Create one above to start drawing.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-2.5"
            >
              <AnimatePresence mode="popLayout">
                {files.map((file) => (
                  <FileCard
                    key={file._id}
                    file={file}
                    onDelete={handleDeleteFile}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
