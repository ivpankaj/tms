import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/auth/api-auth";
import { env } from "@/lib/config/env";

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  response.cookies.set(env.auth.cookieName, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
