import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import getDb from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code missing" },
      { status: 400 },
    );
  }

  try {
    // 1️⃣ Exchange authorization code for Google access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "Failed to get Google access token" },
        { status: 401 },
      );
    }

    // 2️⃣ Fetch Google user info
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      return NextResponse.json(
        { error: "Google account has no email" },
        { status: 400 },
      );
    }

    // 3️⃣ Connect to MongoDB
    const db = await getDb();
    const usersCollection = db.collection("users");

    // 4️⃣ Find or create user (AUTO-REGISTER)
    let user = await usersCollection.findOne({
      email: googleUser.email,
    });

    if (!user) {
      const result = await usersCollection.insertOne({
        name: googleUser.name,
        email: googleUser.email,
        provider: "google",
        createdAt: new Date(),
      });

      user = {
        _id: result.insertedId,
        name: googleUser.name,
        email: googleUser.email,
      };
    }

    // 5️⃣ Create YOUR app JWT
    const appToken = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    // 6️⃣ ✅ FIXED: Set COOKIE + Redirect
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"
        : "http://localhost:3000";

    const response = NextResponse.redirect(
      `${frontendUrl}/auth/callback?token=${appToken}`,
    );

    // 🔑 SET COOKIE (matches your login API + server actions)
    response.cookies.set("token", appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "OAuth callback failed" },
      { status: 500 },
    );
  }
}
