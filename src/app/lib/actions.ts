"use server";

import { ObjectId } from "mongodb";
import getDb from "./db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/* ===========================
Helper: Get Logged User
=========================== */
function getUserIdFromCookie(): string {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
  return decoded.id;
}

/* ===========================
 FOLDER FUNCTIONS
=========================== */

export async function getFolders() {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  const folders = await db
    .collection("folders")
    .find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(folders));
}

export async function createFolder(name: string) {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  const result = await db.collection("folders").insertOne({
    name,
    userId: new ObjectId(userId),
    createdAt: new Date(),
  });

  revalidatePath("/");
  return JSON.parse(JSON.stringify(result));
}

export async function deleteFolder(folderId: string) {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  // Delete files belonging to this user only
  await db.collection("files").deleteMany({
    folderId: new ObjectId(folderId),
    userId: new ObjectId(userId),
  });

  // Delete folder belonging to this user only
  await db.collection("folders").deleteOne({
    _id: new ObjectId(folderId),
    userId: new ObjectId(userId),
  });

  revalidatePath("/");
  return { success: true };
}

export async function getFolder(folderId: string) {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  const folder = await db.collection("folders").findOne({
    _id: new ObjectId(folderId),
    userId: new ObjectId(userId),
  });

  return JSON.parse(JSON.stringify(folder));
}

/* ===========================
 FILE FUNCTIONS
=========================== */

export async function getFiles(folderId: string) {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  const files = await db
    .collection("files")
    .find({
      folderId: new ObjectId(folderId),
      userId: new ObjectId(userId),
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(files));
}

export async function createFile(folderId: string, name: string) {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  const result = await db.collection("files").insertOne({
    folderId: new ObjectId(folderId),
    userId: new ObjectId(userId),
    name,
    data: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath(`/folder/${folderId}`);
  return JSON.parse(JSON.stringify(result));
}

export async function getFile(fileId: string) {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  const file = await db.collection("files").findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  return JSON.parse(JSON.stringify(file));
}

export async function saveFile(fileId: string, data: any) {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  const result = await db.collection("files").updateOne(
    {
      _id: new ObjectId(fileId),
      userId: new ObjectId(userId),
    },
    {
      $set: {
        data,
        updatedAt: new Date(),
      },
    },
  );

  return JSON.parse(JSON.stringify(result));
}

export async function deleteFile(fileId: string, folderId: string) {
  const userId = getUserIdFromCookie();
  const db = await getDb();

  await db.collection("files").deleteOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  revalidatePath(`/folder/${folderId}`);
  return { success: true };
}
