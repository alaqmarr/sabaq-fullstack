import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@/app/prisma/client";

// Extend the built-in types
declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    itsNumber: string;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      itsNumber: string;
    } & DefaultSession["user"];
  }
}

import type { DefaultSession } from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        itsNumber: { label: "ITS Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsedCredentials = z
          .object({ itsNumber: z.string().min(8), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { itsNumber, password } = parsedCredentials.data;
          const user = await prisma.user.findUnique({ where: { itsNumber } });

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.itsNumber = user.itsNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.itsNumber = token.itsNumber as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
