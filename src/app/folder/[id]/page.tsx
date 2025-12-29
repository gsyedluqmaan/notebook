"use client";

import { useEffect, useState } from "react";
import { getFolder, getFiles, createFile, deleteFile } from "../../lib/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FolderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [folder, setFolder] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    setLoading(true);
    const folderData = await getFolder(params.id);
    const filesData = await getFiles(params.id);
    setFolder(folderData);
    setFiles(filesData);
    setLoading(false);
  }

  async function handleCreateFile() {
    if (!fileName.trim()) return;

    const result = await createFile(params.id, fileName);
    setFileName("");

    // Navigate to whiteboard
    router.push(`/whiteboard/${result.insertedId}`);
  }

  async function handleDeleteFile(fileId: string) {
    if (confirm("Delete this file?")) {
      await deleteFile(fileId, params.id);
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 mb-4 inline-block"
          >
            ← Back to Folders
          </Link>
          <h1 className="text-3xl font-bold">{folder?.name}</h1>
        </div>

        {/* Create File */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New File Name"
            />
            <button
              onClick={handleCreateFile}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              + Create File
            </button>
          </div>
        </div>

        {/* File List */}
        {files.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No files yet. Create one to start drawing!
          </div>
        ) : (
          <div className="grid gap-4">
            {files.map((file) => (
              <div
                key={file._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex justify-between items-center"
              >
                <Link
                  href={`/whiteboard/${file._id}`}
                  className="flex-1 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      Last edited: {new Date(file.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleDeleteFile(file._id)}
                  className="ml-4 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
