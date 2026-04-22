import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Called by the client after a successful Google sign-in via NextAuth.
// Returns a custom JWT (same format as the password login) so the rest
// of the app can use localStorage.token seamlessly.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = session.user as any;

  if (user.role !== "THERAPIST") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  return NextResponse.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
}
