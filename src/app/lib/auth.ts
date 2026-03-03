import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return null;
  }
}
