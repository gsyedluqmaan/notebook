import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDb from "@/app/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/* 🔐 Extract user from cookie */
function getUserIdFromCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    return decoded.id;
  } catch {
    return null;
  }
}

/* ======================
   GET FILE
====================== */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } },
) {
  try {
    const userId = getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    const file = await db.collection("files").findOne({
      _id: new ObjectId(params.fileId),
      userId: new ObjectId(userId),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error("GET file error:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 },
    );
  }
}

/* ======================
   UPDATE FILE (PUT)
====================== */
export async function PUT(
  request: NextRequest,
  { params }: { params: { fileId: string } },
) {
  try {
    const userId = getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data } = body;

    const db = await getDb();

    const result = await db.collection("files").updateOne(
      {
        _id: new ObjectId(params.fileId),
        userId: new ObjectId(userId),
      },
      {
        $set: {
          data,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "File not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT file error:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
