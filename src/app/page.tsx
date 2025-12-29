"use client";

import { useEffect, useState } from "react";
import { getFolders, createFolder, deleteFolder } from "./lib/actions";
import Link from "next/link";

export default function Home() {
  const [folders, setFolders] = useState<any[]>([]);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    setLoading(true);
    const data = await getFolders();
    setFolders(data);
    setLoading(false);
  }

  async function handleCreateFolder() {
    if (!folderName.trim()) return;

    await createFolder(folderName);
    setFolderName("");
    loadFolders();
  }

  async function handleDeleteFolder(folderId: string) {
    if (confirm("Delete this folder and all its files?")) {
      await deleteFolder(folderId);
      loadFolders();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Drawing Folders</h1>

        {/* Create Folder */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New Folder Name"
            />
            <button
              onClick={handleCreateFolder}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              + Create Folder
            </button>
          </div>
        </div>

        {/* Folder List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : folders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No folders yet. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-4">
            {folders.map((folder) => (
              <div
                key={folder._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex justify-between items-center"
              >
                <Link
                  href={`/folder/${folder._id}`}
                  className="flex-1 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{folder.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(folder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleDeleteFolder(folder._id)}
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
