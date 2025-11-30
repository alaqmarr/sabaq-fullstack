import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isVerifyPage = req.nextUrl.pathname === "/dashboard/verify";

  if (isOnDashboard && isLoggedIn) {
    const user = req.auth?.user as any;
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

    if (isAdmin) {
      const adminSession = req.cookies.get("admin_session");

      // If admin is not verified and tries to access dashboard (except verify page), redirect to verify
      if (!adminSession && !isVerifyPage) {
        return NextResponse.redirect(new URL("/dashboard/verify", req.nextUrl));
      }

      // If admin is already verified and tries to access verify page, redirect to dashboard
      if (adminSession && isVerifyPage) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
      }
    }
  }
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
