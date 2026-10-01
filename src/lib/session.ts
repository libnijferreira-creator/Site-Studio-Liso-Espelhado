import { cookies } from "next/headers";
import { createSession, destroySession, getSessionAdmin } from "./db";

export const SESSION_COOKIE = "studio_session";

export async function getSession() {
  const store = await cookies();
  return getSessionAdmin(store.get(SESSION_COOKIE)?.value);
}

export async function startSession(adminId: number) {
  const token = createSession(adminId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession() {
  const store = await cookies();
  destroySession(store.get(SESSION_COOKIE)?.value);
  store.delete(SESSION_COOKIE);
}
