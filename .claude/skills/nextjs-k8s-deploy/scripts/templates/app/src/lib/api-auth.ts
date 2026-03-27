import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "./auth";

export function getUser(req: NextRequest): JwtPayload | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}
