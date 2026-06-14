import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set(
    "Set-Cookie",
    "auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure"
  );
  return res;
}

