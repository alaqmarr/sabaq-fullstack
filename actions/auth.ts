"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut();
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAsGuest(its: string) {
  if (!its || its.length !== 8 || !/^\d+$/.test(its)) {
    return { success: false, error: "Invalid ITS number" };
  }

  const cookieStore = await cookies();
  cookieStore.set("guest_its", its, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  redirect("/");
}
