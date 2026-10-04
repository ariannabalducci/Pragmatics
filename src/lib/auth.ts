import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import prisma from "./prisma";

export interface AuthUser {
  userId: string;
  role: Role;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signAuthToken(user: AuthUser) {
  return jwt.sign({ userId: user.userId, role: user.role }, getSecret(), { expiresIn: "12h" });
}

export function getAuthUser(request: Request): AuthUser | null {
  const secret = getSecret();
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(header.slice(7), secret) as AuthUser;
  } catch {
    return null;
  }
}

export async function isTherapistOf(therapistId: string, childId: string) {
  const child = await prisma.child.findFirst({
    where: { userId: childId, therapistId },
    select: { userId: true },
  });
  return child !== null;
}
