import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      // Block sign-in if the google email is not associated with a THERAPIST
      if (!profile?.email) return false;

      const user = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (!user || user.role !== "THERAPIST") {
        // Redirect to therapist login with an error flag
        return "/therapist/login?error=not_therapist";
      }

      return true;
    },

    async jwt({ token, profile, account }) {
      // On first sign in, enrich the token with our DB user data
      if (profile?.email) {
        const user = await prisma.user.findUnique({
          where: { email: profile.email },
        });
        if (user) {
          token.userId = user.id;
          token.role = user.role;
          token.name = user.name;
          token.username = user.username;

          // Save Google tokens if provided
          if (account && account.provider === 'google') {
            const dataToUpdate: {
              googleAccessToken?: string;
              googleRefreshToken?: string;
              googleTokenExpiresAt?: bigint;
            } = {};
            
            if (account.access_token) dataToUpdate.googleAccessToken = account.access_token;
            if (account.refresh_token) dataToUpdate.googleRefreshToken = account.refresh_token;
            if (account.expires_at) dataToUpdate.googleTokenExpiresAt = BigInt(account.expires_at);

            if (Object.keys(dataToUpdate).length > 0) {
              await prisma.user.update({
                where: { email: profile.email },
                data: dataToUpdate,
              });
            }
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Expose userId and role to the client session
      session.user = {
        ...session.user,
        // @ts-ignore – custom fields
        id: token.userId as string,
        role: token.role as string,
        username: token.username as string,
      };
      return session;
    },
  },

  pages: {
    signIn: "/therapist/login",
    error: "/therapist/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
