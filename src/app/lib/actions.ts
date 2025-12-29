"use server";

import { ObjectId } from "mongodb";
import getDb from "./db";
import { revalidatePath } from "next/cache";

export async function getFolders() {
  const db = await getDb();
  const folders = await db
    .collection("folders")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(folders));
}

export async function createFolder(name: string) {
  const db = await getDb();
  const result = await db.collection("folders").insertOne({
    name,
    createdAt: new Date(),
  });

  revalidatePath("/");
  return JSON.parse(JSON.stringify(result));
}

export async function deleteFolder(folderId: string) {
  const db = await getDb();

  // Delete all files in folder
  await db.collection("files").deleteMany({
    folderId: new ObjectId(folderId),
  });

  // Delete folder
  await db.collection("folders").deleteOne({
    _id: new ObjectId(folderId),
  });

  revalidatePath("/");
  return { success: true };
}

export async function getFolder(folderId: string) {
  const db = await getDb();
  const folder = await db.collection("folders").findOne({
    _id: new ObjectId(folderId),
  });

  return JSON.parse(JSON.stringify(folder));
}

export async function getFiles(folderId: string) {
  const db = await getDb();
  const files = await db
    .collection("files")
    .find({ folderId: new ObjectId(folderId) })
    .sort({ updatedAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(files));
}

export async function createFile(folderId: string, name: string) {
  const db = await getDb();
  const result = await db.collection("files").insertOne({
    folderId: new ObjectId(folderId),
    name,
    data: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath(`/folder/${folderId}`);
  return JSON.parse(JSON.stringify(result));
}

export async function getFile(fileId: string) {
  const db = await getDb();
  const file = await db.collection("files").findOne({
    _id: new ObjectId(fileId),
  });

  return JSON.parse(JSON.stringify(file));
}

export async function saveFile(fileId: string, data: any) {
  const db = await getDb();
  const result = await db.collection("files").updateOne(
    { _id: new ObjectId(fileId) },
    {
      $set: {
        data,
        updatedAt: new Date(),
      },
    }
  );

  return JSON.parse(JSON.stringify(result));
}

export async function deleteFile(fileId: string, folderId: string) {
  const db = await getDb();
  await db.collection("files").deleteOne({
    _id: new ObjectId(fileId),
  });

  revalidatePath(`/folder/${folderId}`);
  return { success: true };
}
