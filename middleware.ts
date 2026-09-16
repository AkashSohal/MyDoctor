import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
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
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Protected routes
  const protectedRoutes = [
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
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

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
  const authRoutes = ["/auth/login", "/auth/register"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && session) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

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
    "/dashboard/patient/:path*",
    "/dashboard/doctor/:path*",
    "/dashboard/admin/:path*",
    "/auth/login",
    "/auth/register",
  ],
};