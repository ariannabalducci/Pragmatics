import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { signAuthToken } from "@/lib/auth";

// Called by the client after a successful Google sign-in via NextAuth.
// Returns a custom JWT (same format as the password login) so the rest
// of the app can use localStorage.token seamlessly.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = session.user;

  if (user.role !== "THERAPIST") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const token = signAuthToken({ userId: user.id, role: user.role });

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
