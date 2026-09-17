import type { AuthConfig } from "@auth/core";
import Credentials from "@auth/core/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(6),
});

export const authConfig: AuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const user = await prisma.user.findUnique({
          where: { username: validated.data.username },
          include: { roleRef: true },
        });

        if (!user || user.status !== "ACTIVE") return null;
        const validPassword = await compare(validated.data.password, user.passwordHash);
        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.roleRef.name,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.AUTH_SECRET,
};
