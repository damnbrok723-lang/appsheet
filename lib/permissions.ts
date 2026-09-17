import { auth } from "../auth";

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(...roles: string[]) {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  if (!role || !roles.includes(role)) throw new Error("FORBIDDEN");
  return session;
}

export function canAccessResource(resourceUserId: string, currentUserId: string, roles: string[] = []) {
  return resourceUserId === currentUserId || roles.some((role) => role === "ADMIN" || role === "MANAGER");
}
