import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

let warnedMissingConfig = false;

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if ((!supabaseUrl || !supabaseKey) && !warnedMissingConfig) {
    warnedMissingConfig = true;
    console.warn(
      "[MyDoctor] Supabase environment variables are missing; middleware treats every request as signed out."
    );
  }

  const supabase = createServerClient(
    supabaseUrl || "https://invalid.supabase.co",
    supabaseKey || "missing-publishable-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // A failing session read must never crash the request: treat it as signed
  // out (protected pages redirect to login, public pages still render).
  let session = null;
  try {
    const {
      data: { session: activeSession },
    } = await supabase.auth.getSession();
    session = activeSession;
  } catch (error) {
    console.error("[MyDoctor] Could not read auth session in middleware:", error);
  }

  const pathname = request.nextUrl.pathname;

  // Protected routes
  const protectedRoutes = [
    "/account",
    "/dashboard/patient",
    "/dashboard/doctor",
    "/dashboard/admin",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based access
  if (session && isProtectedRoute) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if (pathname.startsWith("/dashboard/admin") && profile.role !== "admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
        if (pathname.startsWith("/dashboard/doctor") && profile.role !== "doctor") {
          return NextResponse.redirect(new URL("/", request.url));
        }
        if (pathname.startsWith("/dashboard/patient") && profile.role !== "patient") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ["/auth/login", "/auth/register", "/auth/signup"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && session) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        const redirectMap: Record<string, string> = {
          admin: "/dashboard/admin",
          doctor: "/dashboard/doctor",
          patient: "/dashboard/patient",
        };
        return NextResponse.redirect(
          new URL(redirectMap[profile.role] || "/", request.url)
        );
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/account",
    "/dashboard/patient/:path*",
    "/dashboard/doctor/:path*",
    "/dashboard/admin/:path*",
    "/auth/login",
    "/auth/register",
    "/auth/signup",
  ],
};