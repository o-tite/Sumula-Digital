import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/infrastructure/db";
import type { UserRole } from "@/shared/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.sub = user.id ?? token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.sub as string) ?? "";
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const isPublic =
        path === "/" ||
        path.startsWith("/login") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/_next") ||
        path.startsWith("/favicon");
      if (isPublic) return true;
      if (!session) return false;
      const role = session.user.role;
      if (path.startsWith("/admin") && role !== "ORGANIZER") return false;
      if (path.startsWith("/sumula") && role !== "REFEREE") return false;
      return true;
    }
  }
});
